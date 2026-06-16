import { CheckCircle } from "lucide-react";

import { FeedbackCompletionActions } from "@/components/feedback/FeedbackCompletionActions";
import { FeedbackResourceRecommendation } from "@/components/resources/FeedbackResourceRecommendation";

export interface AssessmentNavigationProps {
  onAnotherStudent?: () => void;
  onBackToDashboard?: () => void;
}

interface FeedbackPostSubmitSectionProps extends AssessmentNavigationProps {
  assessmentId: string;
  supervisorId: string;
  associate: {
    id: string;
    name: string;
    email?: string;
  };
  onMoreForSameStudent: () => void;
}

export function FeedbackPostSubmitSection({
  assessmentId,
  supervisorId,
  associate,
  onMoreForSameStudent,
  onAnotherStudent,
  onBackToDashboard,
}: FeedbackPostSubmitSectionProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-2 rounded-lg border border-assessment-good/30 bg-green-50/50 p-3 dark:bg-green-950/20">
        <CheckCircle className="mt-0.5 h-5 w-5 text-assessment-good" />
        <p className="text-sm text-muted-foreground">
          Assessment saved. You can attach a resource below if you like, then choose what to do next.
        </p>
      </div>

      <FeedbackResourceRecommendation
        supervisorId={supervisorId}
        associate={associate}
        assessmentId={assessmentId}
      />

      <FeedbackCompletionActions
        studentName={associate.name}
        onMoreForSameStudent={onMoreForSameStudent}
        onAnotherStudent={onAnotherStudent}
        onBackToDashboard={onBackToDashboard}
      />
    </div>
  );
}
