import { useState } from "react";

import { Sparkles, Copy, Check, Loader2, AlertCircle, X } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { markFeedbackAIRunUsed } from "@/lib/ai/feedbackChain/run";
import { type FeedbackContext, type SmartFeedbackResult, type VaguePhrase } from "@/lib/smartFeedback";

interface SmartFeedbackAssistantProps {
  /** The current feedback text */
  currentFeedback: string;
  /** Callback when user wants to replace their feedback with the improved version */
  onReplaceFeedback: (newFeedback: string) => void;
  /** Callback when user wants to insert text at cursor position */
  onInsertText: (text: string) => void;
  /** Callback when AI assistant is used (for tracking) */
  onAIUsed?: () => void;
  /** Callback when AI suggestions are applied (for tracking) */
  onAIApplied?: () => void;
  /** Optional context for better analysis */
  context?: FeedbackContext;
}

export function SmartFeedbackAssistant({
  currentFeedback,
  onReplaceFeedback,
  onInsertText,
  onAIUsed,
  onAIApplied,
  context,
}: SmartFeedbackAssistantProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<SmartFeedbackResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const { toast } = useToast();

  const handleAnalyze = async () => {
    if (!currentFeedback.trim()) {
      toast({
        title: "No feedback to analyze",
        description: "Please enter some feedback text first.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const { analyzeSupervisorFeedback } = await import("@/lib/smartFeedback");
      const analysisResult = await analyzeSupervisorFeedback(currentFeedback, {
        role: "supervisor",
        discipline: "PA / MD / NP clinical education",
        ...context,
      });
      setResult(analysisResult);
      // Track that AI assistant was used
      onAIUsed?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to analyze feedback";
      setError(errorMessage);
      toast({
        title: "Analysis Failed",
        description: "We couldn't load suggestions right now. Please try again, or continue writing your feedback as usual.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReplaceFeedback = () => {
    if (result?.improved_feedback) {
      onReplaceFeedback(result.improved_feedback);
      // Track that AI suggestions were applied
      onAIApplied?.();
      if (result.run_id) {
        markFeedbackAIRunUsed(result.run_id).catch((err) => {
          console.warn("Failed to mark AI run used", err);
        });
      }
      toast({
        title: "Feedback Replaced",
        description: "Your feedback has been replaced with the improved version.",
      });
    }
  };

  const handleCopyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied",
        description: "Text copied to clipboard",
      });
    } catch (err) {
      toast({
        title: "Copy Failed",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleInsertPrompt = (prompt: string) => {
    onInsertText(prompt);
    // Track that AI suggestions were applied (inserting is also applying)
    onAIApplied?.();
    if (result?.run_id) {
      markFeedbackAIRunUsed(result.run_id).catch((err) => {
        console.warn("Failed to mark AI run used", err);
      });
    }
    toast({
      title: "Prompt Inserted",
      description: "Coaching prompt added to your feedback",
    });
  };

  const handleCopyPhraseSuggestion = async (suggestion: string, index: number) => {
    await handleCopyToClipboard(suggestion);
    // Note: Copying doesn't count as "applied" - user still needs to paste it
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (error && !result) {
    return (
      <Card className="mt-4 border-0 bg-gradient-card shadow-card">
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mt-4 space-y-4">
      {/* Action Button */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Refine your feedback to be clearer, more specific, and more helpful for the learner's next steps. Based on evidence-based feedback principles for health professions education.
        </p>
        <Button
          onClick={handleAnalyze}
          disabled={isAnalyzing || !currentFeedback.trim()}
          className="bg-gradient-primary hover:opacity-90"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Enhance Feedback (AI)
            </>
          )}
        </Button>
      </div>

      {/* Results Panel */}
      {result && (
        <Card className="border-0 bg-gradient-card shadow-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Smart Feedback Suggestions (Preview Only)</CardTitle>
                <CardDescription>
                  Suggestions are grounded in evidence-based feedback principles. Review and adapt them to fit your context. You remain in control of what gets saved.
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setResult(null);
                  setError(null);
                }}
                aria-label="Close suggestions"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="rewrite" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="rewrite">Rewrite</TabsTrigger>
                <TabsTrigger value="specificity">Specificity</TabsTrigger>
                <TabsTrigger value="coaching">Coaching</TabsTrigger>
                <TabsTrigger value="tone">Tone</TabsTrigger>
              </TabsList>

              {/* Rewrite Tab */}
              <TabsContent value="rewrite" className="mt-4 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Improved Feedback</label>
                  <Textarea
                    readOnly
                    value={result.improved_feedback}
                    className="min-h-[120px] border-border bg-muted/50"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleReplaceFeedback}
                    className="bg-gradient-primary hover:opacity-90"
                  >
                    Replace my feedback with this
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleCopyToClipboard(result.improved_feedback)}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy to clipboard
                  </Button>
                </div>
              </TabsContent>

              {/* Specificity Tab */}
              <TabsContent value="specificity" className="mt-4 space-y-4">
                {result.vague_phrases.length > 0 ? (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      The following phrases could be more specific. Replace them with behavior-based descriptions of what you directly observed:
                    </p>
                    {result.vague_phrases.map((item: VaguePhrase, index: number) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 rounded-lg border border-border bg-card p-3"
                      >
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              Vague
                            </Badge>
                            <span className="text-sm font-medium italic">"{item.phrase}"</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">→</span>
                            <span className="text-sm">{item.suggestion}</span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyPhraseSuggestion(item.suggestion, index)}
                          className="shrink-0"
                        >
                          {copiedIndex === index ? (
                            <Check className="h-4 w-4 text-success" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No vague phrases detected. Your feedback is already quite specific!
                  </p>
                )}
              </TabsContent>

              {/* Coaching Prompts Tab */}
              <TabsContent value="coaching" className="mt-4 space-y-4">
                {result.coaching_prompts.length > 0 ? (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Consider incorporating these prompts to encourage learner self-assessment and collaborative planning:
                    </p>
                    {result.coaching_prompts.map((prompt: string, index: number) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 rounded-lg border border-border bg-card p-3"
                      >
                        <p className="flex-1 text-sm">{prompt}</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleInsertPrompt(prompt)}
                        >
                          Insert
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No coaching prompts generated.
                  </p>
                )}
              </TabsContent>

              {/* Tone Tab */}
              <TabsContent value="tone" className="mt-4 space-y-4">
                <div className="space-y-3">
                  <div className="rounded-lg border border-border bg-card p-3">
                    <p className="mb-2 text-sm font-medium">Tone Analysis</p>
                    <p className="text-sm text-muted-foreground">{result.tone_summary}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-card p-3">
                    <p className="mb-2 text-sm font-medium">Feedback Literacy & Affect Management</p>
                    <p className="text-sm text-muted-foreground">{result.tone_suggestions}</p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

