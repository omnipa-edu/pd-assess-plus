import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const Accreditation = () => {
  const [range, setRange] = useState<string>('academic-year');
  const [specialty, setSpecialty] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const { toast } = useToast();

  const handleGenerate = async () => {
    setLoading(true);
    setDownloadUrl(null);
    try {
      setStatus('Preparing dataset…');
      const from = new Date();
      const to = new Date();
      if (range === 'academic-year') {
        const y = from.getMonth() >= 6 ? from.getFullYear() : from.getFullYear() - 1;
        from.setFullYear(y, 6, 1);
        from.setHours(0, 0, 0, 0);
      } else if (range === '6m') {
        from.setMonth(from.getMonth() - 6);
      } else if (range === '12m') {
        from.setFullYear(from.getFullYear() - 1);
      }
      setStatus('Generating PDF…');
      const { data, error } = await supabase.functions.invoke('generate-accreditation-pack', {
        body: { orgId: 'current', from: from.toISOString(), to: to.toISOString(), specialtyId: specialty === 'all' ? null : specialty }
      });
      if (error) throw error;
      setStatus('Building ZIP…');
      await new Promise((r) => setTimeout(r, 250));
      setDownloadUrl(data?.signedUrl || '#');
      toast({ title: 'Accreditation pack ready', description: 'Your report bundle has been generated.' });
      setStatus(null);
    } catch (e) {
      console.error(e);
      toast({ title: 'Generation failed', description: 'There was a problem generating the pack.', variant: 'destructive' });
      setStatus(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Accreditation Pack</h1>
      <Card>
        <CardHeader>
          <CardTitle>Generate</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Select value={range} onValueChange={setRange}>
              <SelectTrigger><SelectValue placeholder="Date range" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="academic-year">Last academic year</SelectItem>
                <SelectItem value="6m">Last 6 months</SelectItem>
                <SelectItem value="12m">Last 12 months</SelectItem>
              </SelectContent>
            </Select>
            <Select value={specialty} onValueChange={setSpecialty}>
              <SelectTrigger><SelectValue placeholder="Specialty" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All specialties</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleGenerate} disabled={loading} aria-busy={loading} aria-label="Generate accreditation pack">
            {loading ? 'Generating…' : 'Generate Accreditation Pack'}
          </Button>
          {status && <div className="text-sm text-muted-foreground" aria-live="polite">{status}</div>}
          {downloadUrl && (
            <div className="text-sm">
              Your accreditation pack is ready.{' '}
              <a className="text-primary underline" href={downloadUrl}>
                Download ZIP
              </a>
              <div className="text-xs text-muted-foreground mt-1">
                This report contains aggregated, de-identified program-level data.
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Accreditation;


