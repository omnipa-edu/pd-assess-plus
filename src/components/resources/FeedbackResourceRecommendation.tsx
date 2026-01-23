import { useEffect, useState } from 'react';

import { Link2 } from 'lucide-react';

import { ResourceRecommendationDialog } from '@/components/resources/ResourceRecommendationDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface FeedbackResourceRecommendationProps {
  supervisorId: string;
  associate: {
    id: string;
    name: string;
    email?: string;
  };
  assessmentId?: string | null;
  autoOpenKey?: number;
}

export function FeedbackResourceRecommendation({
  supervisorId,
  associate,
  assessmentId,
  autoOpenKey = 0,
}: FeedbackResourceRecommendationProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (autoOpenKey > 0 && assessmentId) {
      setOpen(true);
    }
  }, [autoOpenKey, assessmentId]);

  return (
    <Card className="border-0 bg-gradient-card shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center text-foreground">
          <Link2 className="mr-2 h-5 w-5 text-primary" />
          Recommend a Resource
        </CardTitle>
        <CardDescription>
          Attach a curated resource or paste a link directly to this feedback.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          {assessmentId
            ? 'This recommendation will be linked to the assessment.'
            : 'Submit the assessment to attach resources.'}
        </p>
        <Button
          onClick={() => setOpen(true)}
          disabled={!assessmentId}
          className="bg-gradient-primary hover:opacity-90"
        >
          Recommend Resource
        </Button>
      </CardContent>

      <ResourceRecommendationDialog
        open={open}
        onOpenChange={setOpen}
        supervisorId={supervisorId}
        students={[{ id: associate.id, name: associate.name, email: associate.email || '' }]}
        fixedStudent={{ id: associate.id, name: associate.name, email: associate.email || '' }}
        assessmentId={assessmentId || null}
      />
    </Card>
  );
}
