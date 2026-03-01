/**
 * Admin Help page – instructions for performing admin tasks
 */

import { HelpCircle, Home, Building2, Users, FileText, Upload, Lightbulb, Settings } from "lucide-react";
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
                  Go to <Link to="/admin" className="font-medium text-primary underline">Overview</Link> to see key metrics, quick actions, and recent activity. You can customize which widgets appear by clicking “Customize” and reordering, adding, or removing dashboard widgets.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="activity">
                <AccordionTrigger>How to check the activity log</AccordionTrigger>
                <AccordionContent>
                  Go to <Link to="/admin/activity" className="font-medium text-primary underline">Activity Log</Link> to view a chronological list of system events, including user actions, admin changes, and important updates.
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
                  Go to <Link to="/admin/institutions" className="font-medium text-primary underline">Institutions</Link>. Add an institution with name and optional details. Edit or deactivate institutions as needed. Institutions are top-level organizational units.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="departments">
                <AccordionTrigger>How to manage departments</AccordionTrigger>
                <AccordionContent>
                  Go to <Link to="/admin/departments" className="font-medium text-primary underline">Departments</Link>. Create departments and link them to institutions. Assign users and programs to departments for organizational hierarchy.
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
                  Go to <Link to="/admin/users" className="font-medium text-primary underline">Users</Link> to view all users. You can assign roles (learner, supervisor, admin), update profiles, and manage access. Use the search and filters to find specific users.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="supervisors">
                <AccordionTrigger>How to add or manage supervisors</AccordionTrigger>
                <AccordionContent>
                  Go to <Link to="/admin/supervisors" className="font-medium text-primary underline">Supervisors</Link> to list supervisors. Users must have the supervisor role. Use <Link to="/admin/supervisor-assignments" className="font-medium text-primary underline">Supervisor Assignments</Link> to assign supervisors to students or programs.
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
                  Go to <Link to="/admin/specialties" className="font-medium text-primary underline">Specialties</Link> to define medical or training specialties. Specialties are used to organize procedures and filter content.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="epas">
                <AccordionTrigger>How to manage EPAs</AccordionTrigger>
                <AccordionContent>
                  Go to <Link to="/admin/epas" className="font-medium text-primary underline">EPAs</Link> to create and edit Entrustable Professional Activities. Each EPA has a title, description, and can be linked to milestones. Use <Link to="/admin/epas/import" className="font-medium text-primary underline">Import EPAs</Link> to bulk-import from CSV.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="procedure-library">
                <AccordionTrigger>How to use the Procedure Library</AccordionTrigger>
                <AccordionContent>
                  Go to <Link to="/admin/procedure-library" className="font-medium text-primary underline">Procedure Library</Link> to manage procedure-based assessments. Click “New procedure” to create one. For each procedure you can set metadata (code, title, specialty, indications, contraindications, tags), build the assessment form with sections and items (checklist, free text, likert, etc.), and publish when ready. Use the WYSIWYG form builder to add sections and items, then click in the live preview to edit.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="program-assessments">
                <AccordionTrigger>How to configure program assessments</AccordionTrigger>
                <AccordionContent>
                  Go to <Link to="/admin/program-assessments" className="font-medium text-primary underline">Program Assessments</Link> to assign procedures to program cohorts. Select a cohort and choose which procedures from the library apply to that program.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="button-definitions">
                <AccordionTrigger>How to configure button definitions</AccordionTrigger>
                <AccordionContent>
                  Go to <Link to="/admin/button-definitions" className="font-medium text-primary underline">Button definitions</Link> to create global button configs (label, icon, action, visibility rules). Each definition specifies what happens when the button is clicked (e.g., navigate, open modal).
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="button-sets">
                <AccordionTrigger>How to configure button sets</AccordionTrigger>
                <AccordionContent>
                  Go to <Link to="/admin/button-sets" className="font-medium text-primary underline">Button sets</Link> to group button definitions for card, form, or workflow contexts. Add definitions to a set, reorder them, and attach sets to procedures or program-procedures.
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
                  Go to <Link to="/admin/epas/import" className="font-medium text-primary underline">Import EPAs</Link>. Upload a CSV file with columns matching the EPA schema (e.g., title, description, code). The importer will validate and create or update EPAs. Check for validation errors before confirming.
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
                  Go to <Link to="/admin/coaching" className="font-medium text-primary underline">Coaching Corner</Link> to add tips, videos, and other coaching content. Content can be pinned, categorized, and shown to learners and supervisors.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="resources">
                <AccordionTrigger>How to manage Resources</AccordionTrigger>
                <AccordionContent>
                  Go to <Link to="/admin/resources" className="font-medium text-primary underline">Resources</Link> to add learning resources (links, documents). Set visibility (student, supervisor, or both) and organize by category. Supervisors can recommend resources to students.
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
                  Go to <Link to="/admin/promo-codes" className="font-medium text-primary underline">Promo Codes</Link> to create and manage discount codes for subscriptions. Create codes with optional expiry and usage limits.
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
