import { useState, useEffect } from 'react';

import { format } from 'date-fns';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import {
  searchStudentByEmail,
  getSupervisorInstitutions,
  getProgramsForInstitution,
  getSupervisorsForInstitution,
  upsertStudentAssignment,
  updateStudentAssignment,
  canSupervisorAssignStudent,
  type StudentAssignmentWithDetails,
} from '@/lib/student-assignments';


interface AddAssignStudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignment?: StudentAssignmentWithDetails | null;
  onSuccess: () => void;
}

const AddAssignStudentDialog = ({
  open,
  onOpenChange,
  assignment,
  onSuccess,
}: AddAssignStudentDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);

  // Step 1: Email search
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<{
    exists: boolean;
    profile?: any;
  } | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // Step 2: Assignment details
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [supervisors, setSupervisors] = useState<any[]>([]);
  const [formData, setFormData] = useState<{
    institution_id: string | undefined;
    program_id: string;
    supervisor_id: string | undefined;
    is_primary: boolean;
    start_date: string;
    end_date: string;
    note: string;
  }>({
    institution_id: undefined, // Use undefined for controlled Select component
    program_id: 'none', // Use 'none' instead of empty string for Select compatibility
    supervisor_id: undefined, // Use undefined for controlled Select component
    is_primary: true,
    start_date: format(new Date(), 'yyyy-MM-dd'),
    end_date: '',
    note: '',
  });

  useEffect(() => {
    if (open) {
      if (assignment) {
        // Edit mode - populate form
        setSelectedStudentId(assignment.student_id);
        setEmail(assignment.student_email || '');
        setFormData({
          institution_id: assignment.institution_id || undefined,
          program_id: assignment.program_id || 'none', // Use 'none' instead of empty string
          supervisor_id: assignment.supervisor_id || undefined,
          is_primary: assignment.is_primary,
          start_date: assignment.start_date || format(new Date(), 'yyyy-MM-dd'),
          end_date: assignment.end_date || '',
          note: assignment.note || '',
        });
        setStep(2);
        loadStep2Data(assignment.institution_id);
      } else {
        // New assignment - reset
        resetForm();
      }
    }
  }, [open, assignment]);

  const resetForm = () => {
    setStep(1);
    setEmail('');
    setFirstName('');
    setLastName('');
    setSearchResult(null);
    setSelectedStudentId(null);
    setFormData({
      institution_id: undefined, // Use undefined instead of empty string for controlled component
      program_id: 'none', // Use 'none' instead of empty string
      supervisor_id: user?.id || undefined, // Use undefined instead of empty string
      is_primary: true,
      start_date: format(new Date(), 'yyyy-MM-dd'),
      end_date: '',
      note: '',
    });
  };

  const loadStep2Data = async (institutionId?: string) => {
    if (!user) return;

    try {
      // Load institutions
      const insts = await getSupervisorInstitutions(user.id);
      console.log('Loaded institutions:', insts);
      setInstitutions(insts || []);

      // If editing, load programs and supervisors for the institution
      if (institutionId) {
        const [progs, sups] = await Promise.all([
          getProgramsForInstitution(institutionId),
          getSupervisorsForInstitution(institutionId),
        ]);
        console.log('Loaded programs:', progs, 'supervisors:', sups);
        setPrograms(progs || []);
        setSupervisors(sups || []);
      } else {
        // Clear programs and supervisors if no institution
        setPrograms([]);
        setSupervisors([]);
      }
    } catch (error) {
      console.error('Error loading step 2 data:', error);
      setInstitutions([]);
      setPrograms([]);
      setSupervisors([]);
    }
  };

  const handleSearchEmail = async () => {
    if (!email.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter an email address',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSearching(true);
      const result = await searchStudentByEmail(email.trim());
      setSearchResult(result);

      if (result.exists && result.profile) {
        setSelectedStudentId(result.profile.id);
        // Check if student has student role
        const hasStudentRole = result.profile.roles?.includes('student') || false;
        if (!hasStudentRole) {
          toast({
            title: 'Warning',
            description: 'This email belongs to a user who does not have the student role. They may need to be assigned the student role first.',
            variant: 'default',
          });
          // Still allow proceeding - the assignment can be made
        }
      }
    } catch (error: any) {
      console.error('Error searching email:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to search for student',
        variant: 'destructive',
      });
    } finally {
      setSearching(false);
    }
  };

  const handleCreateNewStudent = async () => {
    if (!email.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter an email address',
        variant: 'destructive',
      });
      return;
    }

    if (!firstName.trim() && !lastName.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter at least a first or last name',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      const { createStudentAccount } = await import('@/lib/student-assignments');
      
      // Get supervisor's institution if available
      let institutionId: string | null = null;
      if (user) {
        const { getSupervisorInstitutions } = await import('@/lib/student-assignments');
        const insts = await getSupervisorInstitutions(user.id);
        if (insts.length > 0) {
          institutionId = insts[0].id;
        }
      }

      const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ') || undefined;
      
      const result = await createStudentAccount({
        email: email.trim(),
        full_name: fullName,
        institution_id: institutionId,
      });

      if (result.success && result.student_id) {
        setSelectedStudentId(result.student_id);
        
        if (result.invited) {
          toast({
            title: 'Invitation Sent',
            description: result.message || 'An invitation email has been sent to the student. They can complete their account setup and then you can assign them.',
            duration: 6000,
          });
        } else {
          toast({
            title: 'Success',
            description: result.message || 'Student account created successfully',
          });
        }
        
        // Refresh search to show the new student
        await handleSearchEmail();
        // Proceed to step 2 if account exists (not just invited)
        if (!result.invited || result.student_id) {
          await loadStep2Data();
          setStep(2);
        }
      } else {
        // Failed to create/invite
        toast({
          title: 'Error',
          description: result.message || 'Failed to create student account or send invitation',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Error creating student:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create student account',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInstitutionChange = async (institutionId: string) => {
    // Update institution and reset program
    const cleanInstitutionId = institutionId === 'none' ? undefined : institutionId;
    setFormData(prev => ({ ...prev, institution_id: cleanInstitutionId, program_id: 'none' }));
    
    // Clear programs and supervisors while loading
    setPrograms([]);
    setSupervisors([]);
    
    if (!cleanInstitutionId) {
      return; // Don't load data if no institution selected
    }
    
    try {
      const [progs, sups] = await Promise.all([
        getProgramsForInstitution(cleanInstitutionId),
        getSupervisorsForInstitution(cleanInstitutionId),
      ]);
      setPrograms(progs || []);
      setSupervisors(sups || []);
      
      // Set default supervisor to current user if available
      if (user && sups && sups.find((s: any) => s.id === user.id)) {
        setFormData(prev => ({ ...prev, supervisor_id: user.id }));
      } else if (sups && sups.length > 0) {
        setFormData(prev => ({ ...prev, supervisor_id: sups[0].id }));
      } else {
        // No supervisors found, clear supervisor_id
        setFormData(prev => ({ ...prev, supervisor_id: undefined }));
      }
    } catch (error) {
      console.error('Error loading institution data:', error);
      setPrograms([]);
      setSupervisors([]);
    }
  };

  const handleSubmit = async () => {
    if (!user || !selectedStudentId) {
      toast({
        title: 'Error',
        description: 'Student not selected',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.institution_id || !formData.supervisor_id) {
      toast({
        title: 'Validation Error',
        description: 'Please select institution and supervisor',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);

      // Check permissions
      const permissionCheck = await canSupervisorAssignStudent(
        formData.supervisor_id,
        selectedStudentId,
        formData.institution_id
      );

      if (!permissionCheck.canAssign) {
        toast({
          title: 'Permission Denied',
          description: permissionCheck.reason || 'You do not have permission to assign this student',
          variant: 'destructive',
        });
        return;
      }

      if (assignment) {
        // Update existing assignment
        await updateStudentAssignment(assignment.id, {
          institution_id: formData.institution_id,
          program_id: formData.program_id === 'none' ? null : formData.program_id || null,
          is_primary: formData.is_primary,
          start_date: formData.start_date || null,
          end_date: formData.end_date || null,
          note: formData.note || null,
        });
        toast({
          title: 'Success',
          description: 'Assignment updated successfully',
        });
      } else {
        // Create new assignment
        await upsertStudentAssignment({
          student_id: selectedStudentId,
          supervisor_id: formData.supervisor_id,
          institution_id: formData.institution_id,
          program_id: formData.program_id === 'none' ? null : formData.program_id || null,
          is_primary: formData.is_primary,
          start_date: formData.start_date || null,
          end_date: formData.end_date || null,
          note: formData.note || null,
        });
        toast({
          title: 'Success',
          description: 'Student assigned successfully',
        });
      }

      onSuccess();
      resetForm();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving assignment:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save assignment',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {assignment ? 'Edit Assignment' : 'Add / Assign Student'}
          </DialogTitle>
          <DialogDescription>
            {step === 1
              ? 'Search for an existing student or create a new one'
              : 'Assign the student to an institution, program, and supervisor'}
          </DialogDescription>
        </DialogHeader>

        {step === 1 ? (
          <div className="space-y-4 py-4">
            <div>
              <Label>Email Address</Label>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="student@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearchEmail();
                    }
                  }}
                />
                <Button onClick={handleSearchEmail} disabled={searching}>
                  {searching ? 'Searching...' : 'Search'}
                </Button>
              </div>
            </div>

            {searchResult && (
              <Alert>
                <AlertDescription>
                  {searchResult.exists ? (
                    <div className="space-y-2">
                      <p className="font-medium">
                        We found an existing learner with this email:
                      </p>
                      <div className="space-y-1">
                        <p>
                          <strong>Name:</strong> {searchResult.profile?.full_name || 'Not set'}
                        </p>
                        <p>
                          <strong>Email:</strong> {searchResult.profile?.email}
                        </p>
                        {searchResult.profile?.roles && (
                          <div className="flex gap-2">
                            <strong>Roles:</strong>
                            {searchResult.profile.roles.map((role: string) => (
                              <Badge key={role} variant="outline">
                                {role}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <p className="mt-2 text-sm">
                        Do you want to associate this learner with you and a program?
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="font-medium">
                        No existing learner found with this email.
                      </p>
                      <p className="text-sm">
                        No existing learner found with this email. You can create a new student account.
                      </p>
                      <div className="mt-2 space-y-2">
                        <Label>First Name</Label>
                        <Input
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          placeholder="First name"
                        />
                        <Label>Last Name</Label>
                        <Input
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          placeholder="Last name"
                        />
                      </div>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {searchResult && (
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSearchResult(null)}>
                  Cancel
                </Button>
                {searchResult.exists ? (
                  <Button
                    onClick={() => {
                      if (selectedStudentId) {
                        loadStep2Data();
                        setStep(2);
                      }
                    }}
                    disabled={!selectedStudentId}
                    className="bg-gradient-primary hover:opacity-90"
                  >
                    Continue to Assignment
                  </Button>
                ) : (
                  <Button
                    onClick={handleCreateNewStudent}
                    disabled={loading || !firstName.trim() && !lastName.trim()}
                    className="bg-gradient-primary hover:opacity-90"
                  >
                    {loading ? 'Creating...' : 'Create Student Account'}
                  </Button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div>
              <Label>Student</Label>
              <Input
                value={assignment ? `${assignment.student_name} (${assignment.student_email})` : email}
                disabled
                className="bg-muted"
              />
            </div>

            <div>
              <Label>Institution *</Label>
              <Select
                value={formData.institution_id || undefined}
                onValueChange={handleInstitutionChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select institution" />
                </SelectTrigger>
                <SelectContent>
                  {institutions.map(inst => (
                    <SelectItem key={inst.id} value={inst.id}>
                      {inst.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {institutions.length === 0 && (
                <div className="mt-2 rounded-md border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-800 dark:bg-yellow-900/20">
                  <p className="text-xs font-medium text-yellow-800 dark:text-yellow-200">
                    No institutions available
                  </p>
                  <p className="mt-1 text-xs text-yellow-700 dark:text-yellow-300">
                    Your supervisor account needs to be assigned to an institution. Please contact your administrator to assign an institution to your account.
                  </p>
                </div>
              )}
            </div>

            <div>
              <Label>Program of Study</Label>
              <Select
                value={formData.program_id || 'none'}
                onValueChange={(value) => {
                  const cleanValue = value === 'none' ? 'none' : value;
                  setFormData({ ...formData, program_id: cleanValue });
                }}
                disabled={!formData.institution_id || institutions.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select program (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {programs.map(prog => (
                    <SelectItem key={prog.id} value={prog.id}>
                      {prog.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!formData.institution_id && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Select an institution first
                </p>
              )}
            </div>

            <div>
              <Label>Primary Supervisor *</Label>
              <Select
                value={formData.supervisor_id || undefined}
                onValueChange={(value) => {
                  const cleanValue = value === 'none' ? undefined : value;
                  setFormData({ ...formData, supervisor_id: cleanValue });
                }}
                disabled={!formData.institution_id || institutions.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select supervisor" />
                </SelectTrigger>
                <SelectContent>
                  {supervisors.map(sup => (
                    <SelectItem key={sup.id} value={sup.id}>
                      {sup.full_name || sup.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!formData.institution_id && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Select an institution first
                </p>
              )}
              {formData.institution_id && supervisors.length === 0 && (
                <p className="mt-1 text-xs text-muted-foreground">
                  No supervisors found for this institution
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>
              <div>
                <Label>End Date (Optional)</Label>
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label>Note (Optional)</Label>
              <Textarea
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                placeholder="e.g., 2025 ENT rotation, block 2"
                rows={3}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          {step === 2 && (
            <Button
              variant="outline"
              onClick={() => {
                if (assignment) {
                  onOpenChange(false);
                } else {
                  setStep(1);
                }
              }}
            >
              {assignment ? 'Cancel' : 'Back'}
            </Button>
          )}
          {step === 1 ? (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={loading || !formData.institution_id || !formData.supervisor_id}
              className="bg-gradient-primary hover:opacity-90"
            >
              {loading ? 'Saving...' : assignment ? 'Update' : 'Assign Student'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddAssignStudentDialog;

