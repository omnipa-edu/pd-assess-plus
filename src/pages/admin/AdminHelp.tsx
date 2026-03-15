/**
 * Admin Help page – instructions for performing admin tasks
 */

import { HelpCircle, Home, Building2, Users, FileText, Upload, Lightbulb, Settings, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { ProtectedAdminRoute } from "@/components/admin/ProtectedAdminRoute";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const ADMIN_DEFINITIONS: { term: string; definition: string }[] = [
  { term: "Activity log", definition: "Chronological record of system events and user/admin actions." },
  { term: "Button definition", definition: "A reusable config for one button: label, icon, action type, and optional visibility rules." },
  { term: "Button set", definition: "A named group of button definitions for a context (e.g. card, form), assignable to procedures or program-procedures." },
  { term: "Coaching Corner", definition: "Curated tips, videos, and coaching content shown to learners and supervisors." },
  { term: "Department", definition: "Sub-unit of an institution; used for organizing users and programs." },
  { term: "EPA", definition: "Entrustable Professional Activity; a unit of work that can be entrusted to a trainee once they demonstrate competence." },
  { term: "Institution", definition: "Top-level organizational unit (e.g. hospital, university)." },
  { term: "Procedure", definition: "A defined clinical or training activity with metadata and an assessment form (sections/items)." },
  { term: "Procedure Library", definition: "Central list of procedures; create, edit, and publish procedures and their forms here." },
  { term: "Program Assessment", definition: "Configuration that maps procedures to a specific program cohort so supervisors can run those assessments for that cohort." },
  { term: "Program / cohort", definition: "A training program or cohort; procedures can be assigned per cohort for assessments." },
  { term: "Promo code", definition: "Discount code for subscriptions, with optional expiry and usage limits." },
  { term: "Specialty", definition: "Medical or training specialty used to organize procedures and filter content." },
  { term: "Supervisor assignment", definition: "Link between a supervisor and a learner (or program) so the supervisor can assess and coach that learner." },
  { term: "WYSIWYG", definition: "\"What you see is what you get\"; the procedure form builder shows a live preview as you edit." },
];

const AdminHelp = () => (
  <ProtectedAdminRoute>
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold text-foreground">
            <HelpCircle className="h-8 w-8 text-primary" />
            Admin Help
          </h1>
          <p className="mt-2 text-muted-foreground">
            Instructions for managing your organization, users, and assessment framework
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Definitions
            </CardTitle>
            <CardDescription>Key terms used in the admin console</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-3 sm:grid-cols-2">
              {ADMIN_DEFINITIONS.map(({ term, definition }) => (
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
              <Home className="h-5 w-5" />
              Dashboard
            </CardTitle>
            <CardDescription>Overview, activity log, and dashboard customization</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="overview">
                <AccordionTrigger>How to view the admin overview</AccordionTrigger>
                <AccordionContent>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>Go to <Link to="/admin" className="font-medium text-primary underline">Overview</Link>.</li>
                    <li>Review key metrics, quick actions, and recent activity on the page.</li>
                    <li>To change which widgets appear, click <strong>Customize</strong>, then reorder, add, or remove dashboard widgets and click <strong>Save</strong>.</li>
                  </ol>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="activity">
                <AccordionTrigger>How to check the activity log</AccordionTrigger>
                <AccordionContent>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>Go to <Link to="/admin/activity" className="font-medium text-primary underline">Activity Log</Link>.</li>
                    <li>Browse the chronological list of system events (user actions, admin changes, and other updates).</li>
                    <li>Use search or filters if available to find specific events.</li>
                  </ol>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Organization
            </CardTitle>
            <CardDescription>Institutions and departments</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="institutions">
                <AccordionTrigger>How to manage institutions</AccordionTrigger>
                <AccordionContent>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>Go to <Link to="/admin/institutions" className="font-medium text-primary underline">Institutions</Link>.</li>
                    <li>Click <strong>Add institution</strong> (or equivalent) and enter the institution name and any optional details.</li>
                    <li>To edit, open an institution and update its fields, then save.</li>
                    <li>To deactivate, use the edit form or status control if available.</li>
                  </ol>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="departments">
                <AccordionTrigger>How to manage departments</AccordionTrigger>
                <AccordionContent>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>Go to <Link to="/admin/departments" className="font-medium text-primary underline">Departments</Link>.</li>
                    <li>Click to create a new department and enter its name.</li>
                    <li>Link the department to an institution using the institution selector.</li>
                    <li>Assign users and programs to departments as needed for your organizational hierarchy.</li>
                  </ol>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              People
            </CardTitle>
            <CardDescription>Users and supervisors</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="users">
                <AccordionTrigger>How to manage users</AccordionTrigger>
                <AccordionContent>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>Go to <Link to="/admin/users" className="font-medium text-primary underline">Users</Link>.</li>
                    <li>Use search and filters to find specific users.</li>
                    <li>Open a user to assign roles (learner, supervisor, admin), update profile fields, or manage access.</li>
                    <li>Save your changes.</li>
                  </ol>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="supervisors">
                <AccordionTrigger>How to add or manage supervisors</AccordionTrigger>
                <AccordionContent>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>Ensure the user has the <strong>supervisor</strong> role (manage via <Link to="/admin/users" className="font-medium text-primary underline">Users</Link>).</li>
                    <li>Go to <Link to="/admin/supervisors" className="font-medium text-primary underline">Supervisors</Link> to see the list of supervisors.</li>
                    <li>Go to <Link to="/admin/supervisor-assignments" className="font-medium text-primary underline">Supervisor Assignments</Link> to assign supervisors to students or programs.</li>
                    <li>Select the supervisor and the learner (or program), then save the assignment.</li>
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
              Assessment Framework
            </CardTitle>
            <CardDescription>Specialties, EPAs, procedures, and button configuration</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="specialties">
                <AccordionTrigger>How to manage specialties</AccordionTrigger>
                <AccordionContent>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>Go to <Link to="/admin/specialties" className="font-medium text-primary underline">Specialties</Link>.</li>
                    <li>Add a new specialty or edit an existing one; enter name and any required fields.</li>
                    <li>Save. Specialties are used to organize procedures and filter content elsewhere in the app.</li>
                  </ol>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="epas">
                <AccordionTrigger>How to manage EPAs</AccordionTrigger>
                <AccordionContent>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>Go to <Link to="/admin/epas" className="font-medium text-primary underline">EPAs</Link> to create or edit EPAs.</li>
                    <li>Click to add a new EPA; enter title, description, and code. Link to milestones if your setup uses them.</li>
                    <li>Save. To bulk-import EPAs, go to <Link to="/admin/epas/import" className="font-medium text-primary underline">Import EPAs</Link>.</li>
                    <li>Upload a CSV with columns matching the EPA schema (e.g. title, description, code); fix any validation errors, then confirm the import.</li>
                  </ol>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="procedure-library">
                <AccordionTrigger>How to use the Procedure Library</AccordionTrigger>
                <AccordionContent>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>Go to <Link to="/admin/procedure-library" className="font-medium text-primary underline">Procedure Library</Link>.</li>
                    <li>Click <strong>New procedure</strong>.</li>
                    <li>In <strong>Metadata</strong>, enter code, title, description, specialty, indications, contraindications, and tags.</li>
                    <li>In <strong>Assessment form</strong>, use the form builder: click <strong>Add section</strong>, then <strong>Add item</strong> in each section; choose item types (e.g. checklist, free text, likert).</li>
                    <li>Use the live preview on the right to click and edit section or item labels.</li>
                    <li>Click <strong>Save new version</strong> to save a draft.</li>
                    <li>When ready, click <strong>Publish</strong> so the procedure is active.</li>
                  </ol>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="program-assessments">
                <AccordionTrigger>How to configure program assessments</AccordionTrigger>
                <AccordionContent>
                  <p className="mb-3 text-sm text-muted-foreground">
                    Program Assessments is the admin setup that powers supervisor
                    <Link to="/supervisor/run-assessment" className="ml-1 font-medium text-primary underline">
                      Run Assessment
                    </Link>
                    . Supervisors only see procedures assigned to the selected cohort.
                  </p>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>Go to <Link to="/admin/program-assessments" className="font-medium text-primary underline">Program Assessments</Link>.</li>
                    <li>Select the program or cohort you want to configure.</li>
                    <li>Choose which procedures from the Procedure Library apply to that cohort.</li>
                    <li>Save. Supervisors use these assignments in <Link to="/supervisor/run-assessment" className="font-medium text-primary underline">Run Assessment</Link> for that cohort.</li>
                    <li>If a procedure is not assigned to a cohort here, it will not appear in Run Assessment for that cohort.</li>
                  </ol>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="button-definitions">
                <AccordionTrigger>How to configure button definitions</AccordionTrigger>
                <AccordionContent>
                  <p className="mb-3 text-sm text-muted-foreground">
                    Use button definitions when you need a reusable single action (for example a procedure-specific quick action, form helper, or navigation control) that can be applied consistently across multiple workflows.
                  </p>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>Go to <Link to="/admin/button-definitions" className="font-medium text-primary underline">Button definitions</Link>.</li>
                    <li>Create a new definition or edit an existing one.</li>
                    <li>Set label, icon, variant, size, and tooltip. Set <strong>action type</strong> (e.g. NAVIGATE, OPEN_MODAL, SET_FIELD_VALUE) and <strong>action payload</strong> (e.g. route path or modal name).</li>
                    <li>Optionally add visibility rules (roles, screen size, procedure status).</li>
                    <li>Save. The definition can then be added to button sets.</li>
                  </ol>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="button-sets">
                <AccordionTrigger>How to configure button sets</AccordionTrigger>
                <AccordionContent>
                  <p className="mb-3 text-sm text-muted-foreground">
                    Use button sets to group related definitions by context (card, form, workflow). Start with a shared baseline set, then apply procedure-level or program-level overrides only when a cohort needs different actions.
                  </p>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>Go to <Link to="/admin/button-sets" className="font-medium text-primary underline">Button sets</Link>.</li>
                    <li>Create a new set or open an existing one; set name, description, and context (card, form, or workflow).</li>
                    <li>Add button definitions to the set and reorder them with the controls provided.</li>
                    <li>Attach the set to a procedure (procedure-level) or to a program-procedure (program-level override) as needed.</li>
                    <li>Save. The buttons will appear in the chosen context for the assigned procedure or program-procedure.</li>
                  </ol>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Analytics &amp; Quality
            </CardTitle>
            <CardDescription>Readiness, calibration, and accreditation reporting status</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="accreditation-status">
                <AccordionTrigger>Accreditation (implemented)</AccordionTrigger>
                <AccordionContent>
                  <p className="mb-3 text-sm text-muted-foreground">
                    <Link to="/admin/accreditation" className="font-medium text-primary underline">Accreditation</Link> is functional today. You can choose a reporting range, generate an accreditation evidence pack, and download the result as a file for review and submission.
                  </p>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>Open <Link to="/admin/accreditation" className="font-medium text-primary underline">Accreditation</Link>.</li>
                    <li>Select date range and optional specialty filter.</li>
                    <li>Generate the pack, then download the produced export file.</li>
                  </ol>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="calibration-status">
                <AccordionTrigger>Calibration (limited / coming soon)</AccordionTrigger>
                <AccordionContent>
                  <p className="mb-3 text-sm text-muted-foreground">
                    <Link to="/admin/calibration" className="font-medium text-primary underline">Calibration</Link> currently provides layout and filter scaffolding, but reporting data integration is still in progress. Treat this as a preview of planned supervisor alignment analytics.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    This page may not appear in the sidebar yet; use the direct route while integration is being completed.
                  </p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="readiness-status">
                <AccordionTrigger>Readiness (limited / coming soon)</AccordionTrigger>
                <AccordionContent>
                  <p className="mb-3 text-sm text-muted-foreground">
                    <Link to="/admin/readiness" className="font-medium text-primary underline">Readiness</Link> currently shows a page shell for stalled learner monitoring, with full analytics data wiring still in progress.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    This page may not appear in the sidebar yet; use the direct route while integration is being completed.
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Data Management
            </CardTitle>
            <CardDescription>Importing data</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="import-epas">
                <AccordionTrigger>How to import EPAs from CSV</AccordionTrigger>
                <AccordionContent>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>Go to <Link to="/admin/epas/import" className="font-medium text-primary underline">Import EPAs</Link>.</li>
                    <li>Prepare a CSV with columns matching the EPA schema (e.g. title, description, code).</li>
                    <li>Upload the file. Review any validation errors and fix them in your CSV or in the importer.</li>
                    <li>Confirm the import to create or update EPAs.</li>
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
              Content
            </CardTitle>
            <CardDescription>Coaching Corner and Resources</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="coaching">
                <AccordionTrigger>How to manage Coaching Corner</AccordionTrigger>
                <AccordionContent>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>Go to <Link to="/admin/coaching" className="font-medium text-primary underline">Coaching Corner</Link>.</li>
                    <li>Add a new item: enter title, body text, and optional video link or media.</li>
                    <li>Set category and visibility (e.g. learner, supervisor, both). Optionally pin the item so it appears first.</li>
                    <li>Save. Content will appear in the Coaching Corner for the selected audience.</li>
                  </ol>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="resources">
                <AccordionTrigger>How to manage Resources</AccordionTrigger>
                <AccordionContent>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>Go to <Link to="/admin/resources" className="font-medium text-primary underline">Resources</Link>.</li>
                    <li>Add a new resource: enter title, URL or upload, type (e.g. article, video), and category.</li>
                    <li>Set visibility to student, supervisor, or both.</li>
                    <li>Save. The resource will appear in the library; supervisors can recommend it to students.</li>
                  </ol>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Billing
            </CardTitle>
            <CardDescription>Promo codes</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="promo-codes">
                <AccordionTrigger>How to manage promo codes</AccordionTrigger>
                <AccordionContent>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>Go to <Link to="/admin/promo-codes" className="font-medium text-primary underline">Promo Codes</Link>.</li>
                    <li>Click to create a new promo code; enter the code string and any discount or eligibility rules.</li>
                    <li>Set optional expiry date and usage limits.</li>
                    <li>Save. Users can apply the code at subscription or checkout.</li>
                  </ol>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  </ProtectedAdminRoute>
);

export default AdminHelp;
