/**
 * Learner Help page – instructions for learner tasks.
 */

import { ArrowLeft, BookOpen, ClipboardList, HelpCircle, Lightbulb, UserCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const LEARNER_DEFINITIONS: { term: string; definition: string }[] = [
  { term: "Direct Observation", definition: "A procedure-based assessment completed by a supervisor using a procedure form." },
  { term: "EPA", definition: "Entrustable Professional Activity; a unit of work supervisors assess for readiness and entrustment." },
  { term: "Feedback digest", definition: "AI-generated summary of your recent feedback with strengths, growth priorities, and next actions." },
  { term: "Narrative Assessment", definition: "Free-text feedback not tied to a specific EPA or procedure form." },
  { term: "Observation", definition: "A completed assessment record with form responses, status, and optional comments." },
  { term: "O-SCORE", definition: "Observed readiness score used in EPA feedback to indicate your level of supervision needs." },
  { term: "Procedure", definition: "A defined clinical/training activity from the Procedure Library with its own assessment form." },
  { term: "Widget", definition: "A dashboard block you can show, hide, and reorder during dashboard customization." },
];

const LearnerHelp = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate("/student")}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="flex items-center gap-2 text-xl font-semibold text-foreground">
                  <HelpCircle className="h-5 w-5 text-primary" />
                  Learner Help
                </h1>
                <p className="text-sm text-muted-foreground">Instructions for navigating your dashboard, assessments, and feedback</p>
              </div>
            </div>
            <Button variant="outline" asChild>
              <Link to="/student">Back to dashboard</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Definitions
              </CardTitle>
              <CardDescription>Key terms used in the learner dashboard</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-3 sm:grid-cols-2">
                {LEARNER_DEFINITIONS.map(({ term, definition }) => (
                  <div key={term} className="space-y-1">
                    <dt className="font-medium text-foreground">{term}</dt>
                    <dd className="text-sm text-muted-foreground">{definition}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCircle className="h-5 w-5" />
                Getting started
              </CardTitle>
              <CardDescription>Profile, onboarding, and dashboard basics</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="complete-profile">
                  <AccordionTrigger>How to complete your profile</AccordionTrigger>
                  <AccordionContent>
                    <ol className="list-inside list-decimal space-y-2 text-sm">
                      <li>From your dashboard, click <strong>Profile</strong>.</li>
                      <li>Update full name, program, and year of training, then click <strong>Save changes</strong>.</li>
                      <li>Keep this current so your supervisors and reports show accurate training details.</li>
                    </ol>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="customize-dashboard">
                  <AccordionTrigger>How to customize your dashboard</AccordionTrigger>
                  <AccordionContent>
                    <ol className="list-inside list-decimal space-y-2 text-sm">
                      <li>Click <strong>Customize</strong> in the top-right controls.</li>
                      <li>Add, remove, reorder, or collapse widgets based on what you want to track most.</li>
                      <li>Click <strong>Save</strong> to keep your layout.</li>
                    </ol>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Assessments and observations
              </CardTitle>
              <CardDescription>View your procedure observations and assessment feedback</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="view-observations">
                  <AccordionTrigger>How to view your observations</AccordionTrigger>
                  <AccordionContent>
                    <ol className="list-inside list-decimal space-y-2 text-sm">
                      <li>Click <Link to="/student/observations" className="font-medium text-primary underline">My observations</Link> from your dashboard header.</li>
                      <li>Use filters for status, procedure, and date range to find specific assessments.</li>
                      <li>Click <strong>View</strong> on any row to open the full form responses and comments.</li>
                    </ol>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="understand-status">
                  <AccordionTrigger>How to interpret observation status</AccordionTrigger>
                  <AccordionContent>
                    <ol className="list-inside list-decimal space-y-2 text-sm">
                      <li><strong>Draft</strong> means your supervisor has started an assessment but has not submitted it yet.</li>
                      <li><strong>Submitted</strong> means the assessment is finalized and ready for review.</li>
                      <li>If expected feedback is missing, contact your supervisor to confirm submission.</li>
                    </ol>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Feedback and next steps
              </CardTitle>
              <CardDescription>Use digests and recommendations to guide your improvement plan</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="feedback-digests">
                  <AccordionTrigger>How to use feedback digests</AccordionTrigger>
                  <AccordionContent>
                    <ol className="list-inside list-decimal space-y-2 text-sm">
                      <li>Open the <strong>Feedback Digests</strong> card on your dashboard.</li>
                      <li>Review strengths and priority growth themes across your recent assessments.</li>
                      <li>Use the suggested next-case actions and reflection prompt before your next observed case.</li>
                    </ol>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="resources">
                  <AccordionTrigger>How to use recommended resources</AccordionTrigger>
                  <AccordionContent>
                    <ol className="list-inside list-decimal space-y-2 text-sm">
                      <li>Review items in your recommended resources section on the dashboard.</li>
                      <li>Match each resource to one growth theme from your latest feedback.</li>
                      <li>After applying it in practice, capture what changed in your next reflection.</li>
                    </ol>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default LearnerHelp;
