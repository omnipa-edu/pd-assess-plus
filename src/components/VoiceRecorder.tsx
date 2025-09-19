import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Mic, MicOff, Square } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface VoiceRecorderProps {
  onTranscription: (text: string) => void;
  isDisabled?: boolean;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onTranscription, isDisabled = false }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 44100,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await processAudio(audioBlob);
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      
      toast({
        title: "Recording Started",
        description: "Speak clearly into your microphone",
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Recording Error",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsProcessing(true);
      
      toast({
        title: "Processing Audio",
        description: "Converting speech to text...",
      });
    }
  }, [isRecording, toast]);

  const processAudio = async (audioBlob: Blob) => {
    try {
      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1];
        
        try {
          const { data, error } = await supabase.functions.invoke('voice-to-text', {
            body: { audio: base64Audio }
          });

          if (error) {
            throw error;
          }

          if (data?.text) {
            onTranscription(data.text);
            toast({
              title: "Transcription Complete",
              description: "Speech converted to text successfully",
            });
          } else {
            throw new Error('No transcription received');
          }
        } catch (apiError) {
          console.error('API Error:', apiError);
          toast({
            title: "Transcription Failed",
            description: "Could not convert speech to text. Please try again.",
            variant: "destructive",
          });
        } finally {
          setIsProcessing(false);
        }
      };
    } catch (error) {
      console.error('Error processing audio:', error);
      setIsProcessing(false);
      toast({
        title: "Processing Error",
        description: "Failed to process audio recording",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex items-center space-x-2">
      {!isRecording ? (
        <Button
          onClick={startRecording}
          disabled={isDisabled || isProcessing}
          variant="outline"
          size="sm"
          className="flex items-center space-x-1"
        >
          <Mic className="w-4 h-4" />
          <span>{isProcessing ? 'Processing...' : 'Start Recording'}</span>
        </Button>
      ) : (
        <Button
          onClick={stopRecording}
          variant="destructive"
          size="sm"
          className="flex items-center space-x-1 animate-pulse"
        >
          <Square className="w-4 h-4" />
          <span>Stop Recording</span>
        </Button>
      )}
      
      {isRecording && (
        <div className="flex items-center space-x-1 text-sm text-red-600">
          <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
          <span>Recording...</span>
        </div>
      )}
    </div>
  );
};

export default VoiceRecorder;