import { CheckCircle, LayoutDashboard, User, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export interface FeedbackCompletionActionsProps {
  studentName: string;
  onMoreForSameStudent: () => void;
  onAnotherStudent?: () => void;
  onBackToDashboard?: () => void;
}

export function FeedbackCompletionActions({
  studentName,
  onMoreForSameStudent,
  onAnotherStudent,
  onBackToDashboard,
}: FeedbackCompletionActionsProps) {
  return (
    <Card className="border-0 bg-gradient-assessment shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center text-foreground">
          <CheckCircle className="mr-2 h-5 w-5 text-assessment-good" />
          What&apos;s next?
        </CardTitle>
        <CardDescription>
          Feedback for {studentName} has been saved. Enter more feedback or return to your dashboard.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Button onClick={onMoreForSameStudent} className="bg-gradient-primary hover:opacity-90">
          <User className="mr-2 h-4 w-4" />
          More feedback for {studentName}
        </Button>
        {onAnotherStudent && (
          <Button variant="outline" onClick={onAnotherStudent}>
            <Users className="mr-2 h-4 w-4" />
            Feedback for another student
          </Button>
        )}
        {onBackToDashboard && (
          <Button variant="outline" onClick={onBackToDashboard}>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Back to dashboard
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
