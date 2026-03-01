/**
 * Supervisor Help page – instructions for performing supervisor tasks
 */

import { ArrowLeft, BookOpen, ClipboardList, GraduationCap, HelpCircle, UserCircle, FileText, TrendingUp } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const SupervisorHelp = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate("/supervisor")}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="flex items-center gap-2 text-xl font-semibold text-foreground">
                  <HelpCircle className="h-5 w-5 text-primary" />
                  Supervisor Help
                </h1>
                <p className="text-sm text-muted-foreground">
                  Instructions for running assessments and managing learners
                </p>
              </div>
            </div>
            <Button variant="outline" asChild>
              <Link to="/supervisor">Back to dashboard</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCircle className="h-5 w-5" />
                Getting started
              </CardTitle>
              <CardDescription>Profile, dashboard, and onboarding</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="complete-profile">
                  <AccordionTrigger>How to complete your profile</AccordionTrigger>
                  <AccordionContent>
                    Click the Profile button in the header and enter your full name. Your email is used for sign-in and cannot be changed. A complete profile helps learners recognize you.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="customize-dashboard">
                  <AccordionTrigger>How to customize your dashboard</AccordionTrigger>
                  <AccordionContent>
                    Click “Customize” on your dashboard to add, remove, reorder, or resize widgets. You can show or hide widgets like Teaching Statistics, CME Summary, Benchmark Comparison, and Recent Assessments. Save when done.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="onboarding">
                  <AccordionTrigger>How to use the onboarding checklist</AccordionTrigger>
                  <AccordionContent>
                    The onboarding checklist guides you through key tasks: create your first assessment, add students, complete your profile, and explore analytics. Click each task to jump to the relevant page.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                My Students
              </CardTitle>
              <CardDescription>View and manage your assigned learners</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="view-students">
                  <AccordionTrigger>How to view your students</AccordionTrigger>
                  <AccordionContent>
                    Click <Link to="/supervisor/students" className="font-medium text-primary underline">My Students</Link> in the header to see learners assigned to you. You can view their progress, assessments, and recommend resources.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="add-students">
                  <AccordionTrigger>How to add students</AccordionTrigger>
                  <AccordionContent>
                    Student–supervisor assignments are usually managed by admins. Contact your administrator to get learners assigned to you. Once assigned, they appear in My Students.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Running assessments
              </CardTitle>
              <CardDescription>EPA Observation, Direct Observation, and Narrative Assessment</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="new-assessment">
                  <AccordionTrigger>How to start a new assessment</AccordionTrigger>
                  <AccordionContent>
                    Click the “New Assessment” button in the header (or use Quick Actions on the dashboard). Choose EPA Observation, Direct Observation, or Narrative Assessment. Select the learner and follow the form.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="epa-observation">
                  <AccordionTrigger>How to complete an EPA Observation</AccordionTrigger>
                  <AccordionContent>
                    From <Link to="/supervisor/run-assessment" className="font-medium text-primary underline">Run assessment</Link>, select EPA Observation. Choose the learner, EPA, and milestone. Document your observation and provide entrustment ratings. Use the narrative and feedback fields to give specific, actionable feedback.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="direct-observation">
                  <AccordionTrigger>How to complete a Direct Observation</AccordionTrigger>
                  <AccordionContent>
                    Select Direct Observation from Run assessment. Choose the learner and procedure (from the Procedure Library). Complete the procedure-specific form with checklists, scales, and free-text fields. Save as draft or submit when done.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="narrative">
                  <AccordionTrigger>How to complete a Narrative Assessment</AccordionTrigger>
                  <AccordionContent>
                    Select Narrative Assessment for qualitative feedback without EPA/procedure structure. Choose the learner and describe strengths, areas for improvement, and next steps. Useful for general feedback or non-standard encounters.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Observations
              </CardTitle>
              <CardDescription>View and review past assessments</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="view-observations">
                  <AccordionTrigger>How to view past observations</AccordionTrigger>
                  <AccordionContent>
                    Click <Link to="/supervisor/observations" className="font-medium text-primary underline">Observations</Link> in the header to see your submitted assessments. Filter by learner, date, or type. Click any observation to view its details.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Resources
              </CardTitle>
              <CardDescription>Browse and recommend resources to learners</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="browse-resources">
                  <AccordionTrigger>How to browse and recommend resources</AccordionTrigger>
                  <AccordionContent>
                    Go to <Link to="/supervisor/resources" className="font-medium text-primary underline">View resources</Link> to search the resource library. You can recommend approved resources to your students. Recommendations appear in their “Recommended by your supervisor” section.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                CME & teaching statistics
              </CardTitle>
              <CardDescription>Track your coaching time and view analytics</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="cme-log">
                  <AccordionTrigger>How to log CME time</AccordionTrigger>
                  <AccordionContent>
                    Go to <Link to="/supervisor/cme-log" className="font-medium text-primary underline">CME Log</Link> (from the CME Summary widget or nav) to record coaching and feedback time. This supports NCCPA Category II documentation. Add sessions with date, duration, and activity type.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="teaching-report">
                  <AccordionTrigger>How to view teaching statistics</AccordionTrigger>
                  <AccordionContent>
                    The Teaching Statistics widget on your dashboard shows assessments completed, learners coached, and related metrics. Click through to the <Link to="/supervisor/cme-teaching-report" className="font-medium text-primary underline">CME Teaching Report</Link> for detailed documentation.
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

export default SupervisorHelp;
