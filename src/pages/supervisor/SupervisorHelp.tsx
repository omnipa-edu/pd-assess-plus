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

const SUPERVISOR_DEFINITIONS: { term: string; definition: string }[] = [
  { term: "Benchmark", definition: "Reference comparison (e.g. peer or cohort) for teaching or assessment metrics." },
  { term: "CME", definition: "Continuing Medical Education; time spent on teaching/coaching can be logged for CME documentation." },
  { term: "Direct Observation", definition: "Assessment type tied to a procedure from the Procedure Library; uses that procedure's form." },
  { term: "EPA", definition: "Entrustable Professional Activity; a unit of work assessed for entrustment." },
  { term: "Entrustment (level)", definition: "Rating of how much supervision a learner needs for an EPA (e.g. full independence vs. prompting)." },
  { term: "Milestone", definition: "A specific capability within an EPA used for finer-grained assessment." },
  { term: "Narrative Assessment", definition: "Qualitative assessment without EPA/procedure structure; free-form feedback." },
  { term: "NCCPA Category II", definition: "Category of CME that can be documented via teaching/coaching logs." },
  { term: "Observation", definition: "A single submitted assessment (EPA, Direct Observation, or Narrative)." },
  { term: "Procedure", definition: "A defined activity from the Procedure Library used for Direct Observation forms." },
  { term: "Resource recommendation", definition: "A resource from the library that you recommend to a specific learner; they see it in Recommended by your supervisor." },
  { term: "Widget", definition: "A dashboard block (e.g. Teaching Statistics, CME Summary) that can be shown, hidden, or reordered." },
];

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
                <BookOpen className="h-5 w-5" />
                Definitions
              </CardTitle>
              <CardDescription>Key terms used in the supervisor dashboard</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-3 sm:grid-cols-2">
                {SUPERVISOR_DEFINITIONS.map(({ term, definition }) => (
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
              <CardDescription>Profile, dashboard, and onboarding</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="complete-profile">
                  <AccordionTrigger>How to complete your profile</AccordionTrigger>
                  <AccordionContent>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>Click the <strong>Profile</strong> button in the header.</li>
                    <li>Enter your full name and save. Your email is used for sign-in and cannot be changed.</li>
                    <li>A complete profile helps learners recognize you.</li>
                  </ol>
                </AccordionContent>
                </AccordionItem>
                <AccordionItem value="customize-dashboard">
                  <AccordionTrigger>How to customize your dashboard</AccordionTrigger>
                  <AccordionContent>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>On your dashboard, click <strong>Customize</strong>.</li>
                    <li>Add, remove, reorder, or resize widgets (e.g. Teaching Statistics, CME Summary, Benchmark Comparison, Recent Assessments).</li>
                    <li>Click <strong>Save</strong> when done.</li>
                  </ol>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="onboarding">
                  <AccordionTrigger>How to use the onboarding checklist</AccordionTrigger>
                  <AccordionContent>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>Use the onboarding checklist on your dashboard to see key tasks.</li>
                    <li>Click <strong>Create your first assessment</strong> to go to the assessment flow, <strong>Add students</strong> to open My Students, or <strong>Complete profile</strong> to open Profile.</li>
                    <li>Click <strong>Explore analytics</strong> to learn about dashboard metrics. Complete each task as you go.</li>
                  </ol>
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
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>Click <Link to="/supervisor/students" className="font-medium text-primary underline">My Students</Link> in the header.</li>
                    <li>View the list of learners assigned to you.</li>
                    <li>Open a learner to view progress, assessments, and recommend resources.</li>
                  </ol>
                </AccordionContent>
                </AccordionItem>
                <AccordionItem value="add-students">
                  <AccordionTrigger>How to add students</AccordionTrigger>
                  <AccordionContent>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>Student–supervisor assignments are usually managed by admins.</li>
                    <li>Contact your administrator to request that learners be assigned to you.</li>
                    <li>Once assigned, they will appear in <Link to="/supervisor/students" className="font-medium text-primary underline">My Students</Link>.</li>
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
                Running assessments
              </CardTitle>
              <CardDescription>EPA Observation, Direct Observation, and Narrative Assessment</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="new-assessment">
                  <AccordionTrigger>How to start a new assessment</AccordionTrigger>
                  <AccordionContent>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>Click the <strong>New Assessment</strong> button in the header, or use Quick Actions on the dashboard.</li>
                    <li>Choose <strong>EPA Observation</strong>, <strong>Direct Observation</strong>, or <strong>Narrative Assessment</strong>.</li>
                    <li>Select the learner and follow the form to complete the assessment.</li>
                  </ol>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="epa-observation">
                  <AccordionTrigger>How to complete an EPA Observation</AccordionTrigger>
                  <AccordionContent>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>Go to <Link to="/supervisor/run-assessment" className="font-medium text-primary underline">Run assessment</Link> and select <strong>EPA Observation</strong>.</li>
                    <li>Choose the learner, EPA, and milestone.</li>
                    <li>Document your observation and provide entrustment ratings.</li>
                    <li>Use the narrative and feedback fields to give specific, actionable feedback, then save or submit.</li>
                  </ol>
                </AccordionContent>
                </AccordionItem>
                <AccordionItem value="direct-observation">
                  <AccordionTrigger>How to complete a Direct Observation</AccordionTrigger>
                  <AccordionContent>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>From <Link to="/supervisor/run-assessment" className="font-medium text-primary underline">Run assessment</Link>, select <strong>Direct Observation</strong>.</li>
                    <li>Choose the learner and the procedure (from the Procedure Library).</li>
                    <li>Complete the procedure-specific form: checklists, scales, and free-text fields.</li>
                    <li>Click <strong>Save as draft</strong> or <strong>Submit</strong> when done.</li>
                  </ol>
                </AccordionContent>
                </AccordionItem>
                <AccordionItem value="narrative">
                  <AccordionTrigger>How to complete a Narrative Assessment</AccordionTrigger>
                  <AccordionContent>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>From Run assessment, select <strong>Narrative Assessment</strong>.</li>
                    <li>Choose the learner.</li>
                    <li>Describe strengths, areas for improvement, and next steps in the free-form fields. No EPA or procedure structure is required.</li>
                    <li>Save or submit. Useful for general feedback or non-standard encounters.</li>
                  </ol>
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
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>Click <Link to="/supervisor/observations" className="font-medium text-primary underline">Observations</Link> in the header.</li>
                    <li>Browse or filter by learner, date, or assessment type.</li>
                    <li>Click any observation to view its full details.</li>
                  </ol>
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
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>Go to <Link to="/supervisor/resources" className="font-medium text-primary underline">View resources</Link> to search the resource library.</li>
                    <li>Open a resource and use the option to recommend it to a student. Select the learner and save.</li>
                    <li>Recommended resources appear for that learner in their <strong>Recommended by your supervisor</strong> section.</li>
                  </ol>
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
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>Go to <Link to="/supervisor/cme-log" className="font-medium text-primary underline">CME Log</Link> (from the CME Summary widget or navigation).</li>
                    <li>Click to add a new session; enter date, duration, and activity type (e.g. coaching, feedback).</li>
                    <li>Save. This supports NCCPA Category II documentation for teaching and coaching time.</li>
                  </ol>
                </AccordionContent>
                </AccordionItem>
                <AccordionItem value="teaching-report">
                  <AccordionTrigger>How to view teaching statistics</AccordionTrigger>
                  <AccordionContent>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>On your dashboard, the <strong>Teaching Statistics</strong> widget shows assessments completed, learners coached, and related metrics.</li>
                    <li>Click through to the <Link to="/supervisor/cme-teaching-report" className="font-medium text-primary underline">CME Teaching Report</Link> for detailed documentation and export.</li>
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

export default SupervisorHelp;
