import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type StudentSupervisorAssignment = Database['public']['Tables']['student_supervisor_assignments']['Row'];
type StudentSupervisorAssignmentInsert = Database['public']['Tables']['student_supervisor_assignments']['Insert'];
type StudentSupervisorAssignmentUpdate = Database['public']['Tables']['student_supervisor_assignments']['Update'];

export interface StudentAssignmentWithDetails extends StudentSupervisorAssignment {
  student_name?: string;
  student_email?: string;
  institution_name?: string;
  program_name?: string;
  primary_supervisor_name?: string;
}

export interface StudentSearchResult {
  exists: boolean;
  profile?: {
    id: string;
    email: string;
    full_name: string | null;
    roles?: string[];
  };
}

/**
 * Search for existing student by email
 */
export async function searchStudentByEmail(email: string): Promise<StudentSearchResult> {
  try {
    // First get the profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    if (profileError && profileError.code !== 'PGRST116') {
      throw profileError;
    }

    if (!profile) {
      return { exists: false };
    }

    // Then get the roles separately
    const { data: rolesData, error: rolesError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', profile.id);

    if (rolesError) {
      console.error('Error fetching roles:', rolesError);
      // Don't throw - just return without roles
    }

    const roles = (rolesData || []).map((r: any) => r.role);

    return {
      exists: true,
      profile: {
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        roles,
      },
    };
  } catch (error: any) {
    console.error('Error searching student:', error);
    throw error;
  }
}

/**
 * Create a new student account or send invitation (supervisor can call this)
 * This will:
 * - Create profile if auth user exists
 * - Assign student role
 * - Link to institution if provided
 * - If student doesn't exist, send invitation email via Edge Function
 */
export async function createStudentAccount(data: {
  email: string;
  full_name?: string;
  institution_id?: string | null;
}): Promise<{ success: boolean; message: string; student_id: string | null; invited?: boolean }> {
  // Use database function directly (Edge Function can be added later for invitations)
  // This ensures it works even without Edge Function deployment
  try {
    const { data: dbResult, error: dbError } = await supabase.rpc('create_student_account', {
      p_email: data.email,
      p_full_name: data.full_name || null,
      p_institution_id: data.institution_id || null,
    });

    if (dbError) {
      throw dbError;
    }

    if (dbResult && dbResult.length > 0) {
      const result = dbResult[0];
      return {
        success: result.success,
        message: result.message || 'Student account processed successfully.',
        student_id: result.student_id,
        invited: false,
      };
    }

    throw new Error('Unexpected response from database function');
  } catch (error: any) {
    console.error('Error creating student account:', error);
    throw error;
  }
}

/**
 * Get supervisor's accessible institutions
 */
export async function getSupervisorInstitutions(supervisorId: string): Promise<any[]> {
  try {
    // Get supervisor's profile to find their institution
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('institution_id')
      .eq('id', supervisorId)
      .single();

    if (profileError) throw profileError;

    if (!profile?.institution_id) {
      return [];
    }

    // Get the institution
    const { data: institution, error: institutionError } = await supabase
      .from('institutions')
      .select('id, name, created_at, updated_at')
      .eq('id', profile.institution_id)
      .single();

    if (institutionError) throw institutionError;

    return institution ? [institution] : [];
  } catch (error: any) {
    console.error('Error loading supervisor institutions:', error);
    return [];
  }
}

/**
 * Get programs (specialties) for an institution
 */
export async function getProgramsForInstitution(institutionId: string | null): Promise<any[]> {
  if (!institutionId) return [];

  try {
    // For now, return all active specialties
    // In the future, you might want to link specialties to institutions
    const { data, error } = await supabase
      .from('specialties')
      .select('id, name, code, description, is_active, created_at, updated_at')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return data || [];
  } catch (error: any) {
    console.error('Error loading programs:', error);
    return [];
  }
}

/**
 * Get supervisors for an institution
 */
export async function getSupervisorsForInstitution(institutionId: string): Promise<any[]> {
  try {
    // First get all supervisors with the institution
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, email, institution_id')
      .eq('institution_id', institutionId);

    if (profilesError) throw profilesError;

    if (!profiles || profiles.length === 0) {
      return [];
    }

    // Then filter by supervisor role
    const supervisorIds = profiles.map(p => p.id);
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('user_id')
      .in('user_id', supervisorIds)
      .eq('role', 'supervisor');

    if (rolesError) throw rolesError;

    const supervisorUserIds = new Set((roles || []).map(r => r.user_id));
    const supervisors = profiles
      .filter(p => supervisorUserIds.has(p.id))
      .map(p => ({
        id: p.id,
        full_name: p.full_name,
        email: p.email,
      }))
      .sort((a, b) => (a.full_name || a.email).localeCompare(b.full_name || b.email));

    return supervisors;
  } catch (error: any) {
    console.error('Error loading supervisors:', error);
    return [];
  }
}

/**
 * Get student assignments for a supervisor
 */
export async function getSupervisorStudentAssignments(
  supervisorId: string,
  filters?: {
    institutionId?: string | null;
    programId?: string | null;
    status?: 'active' | 'inactive' | 'all';
    searchQuery?: string;
  }
): Promise<StudentAssignmentWithDetails[]> {
  try {
    // First get the assignments
    let query = supabase
      .from('student_supervisor_assignments')
      .select('*')
      .eq('supervisor_id', supervisorId)
      .order('start_date', { ascending: false, nullsFirst: false });

    if (filters?.institutionId) {
      query = query.eq('institution_id', filters.institutionId);
    }

    if (filters?.programId) {
      query = query.eq('program_id', filters.programId);
    }

    if (filters?.status === 'active') {
      const today = new Date().toISOString().split('T')[0];
      // Filter for active assignments: end_date is null OR end_date >= today
      query = query.or(`end_date.is.null,end_date.gte.${today}`);
    } else if (filters?.status === 'inactive') {
      const today = new Date().toISOString().split('T')[0];
      // Filter for inactive assignments: end_date is not null AND end_date < today
      query = query.not('end_date', 'is', null).lt('end_date', today);
    }

    const { data: assignmentsData, error } = await query;

    if (error) {
      // If table doesn't exist, return empty array instead of throwing
      if (error.message?.includes('does not exist') || error.code === '42P01') {
        console.warn('student_supervisor_assignments table does not exist. Please run the migration.');
        return [];
      }
      throw error;
    }

    if (!assignmentsData || assignmentsData.length === 0) {
      return [];
    }

    // Fetch related data
    const studentIds = [...new Set(assignmentsData.map((a: any) => a.student_id))];
    const institutionIds = [...new Set(assignmentsData.map((a: any) => a.institution_id))];
    const programIds = [...new Set(assignmentsData.map((a: any) => a.program_id).filter(Boolean))];
    const supervisorIds = [...new Set(assignmentsData.map((a: any) => a.supervisor_id))];

    const [students, institutions, programs, supervisors] = await Promise.all([
      supabase.from('profiles').select('id, full_name, email').in('id', studentIds),
      supabase.from('institutions').select('id, name').in('id', institutionIds),
      programIds.length > 0
        ? supabase.from('specialties').select('id, name').in('id', programIds)
        : Promise.resolve({ data: [], error: null }),
      supabase.from('profiles').select('id, full_name').in('id', supervisorIds),
    ]);

    const studentsMap = new Map((students.data || []).map(s => [s.id, s]));
    const institutionsMap = new Map((institutions.data || []).map(i => [i.id, i]));
    const programsMap = new Map((programs.data || []).map(p => [p.id, p]));
    const supervisorsMap = new Map((supervisors.data || []).map(s => [s.id, s]));

    // Transform the data
    const assignments = assignmentsData.map((item: any) => {
      const student = studentsMap.get(item.student_id);
      const institution = institutionsMap.get(item.institution_id);
      const program = item.program_id ? programsMap.get(item.program_id) : null;
      const supervisor = supervisorsMap.get(item.supervisor_id);

      return {
        ...item,
        student_name: student?.full_name || 'Unknown',
        student_email: student?.email || '',
        institution_name: institution?.name || 'Unknown',
        program_name: program?.name || 'Unknown',
        primary_supervisor_name: supervisor?.full_name || 'Unknown',
      };
    });

    // Apply search filter if provided
    if (filters?.searchQuery) {
      const searchLower = filters.searchQuery.toLowerCase();
      return assignments.filter((a: StudentAssignmentWithDetails) =>
        a.student_name?.toLowerCase().includes(searchLower) ||
        a.student_email?.toLowerCase().includes(searchLower)
      );
    }

    return assignments;
  } catch (error: any) {
    console.error('Error loading student assignments:', error);
    // If it's a table not found error (404 from REST API or SQL error), return empty array instead of throwing
    if (
      error.message?.includes('does not exist') || 
      error.code === '42P01' ||
      error.status === 404 ||
      error.statusCode === 404 ||
      (error.message && typeof error.message === 'string' && error.message.includes('404'))
    ) {
      console.warn('student_supervisor_assignments table does not exist. Please run the migration: supabase/migrations/20251117_student_supervisor_assignments.sql');
      return [];
    }
    throw error;
  }
}

/**
 * Create or update student-supervisor assignment
 */
export async function upsertStudentAssignment(
  assignment: {
    student_id: string;
    supervisor_id: string;
    institution_id: string;
    program_id?: string | null;
    is_primary: boolean;
    start_date?: string | null;
    end_date?: string | null;
    note?: string | null;
  }
): Promise<StudentSupervisorAssignment> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const insert: StudentSupervisorAssignmentInsert = {
      student_id: assignment.student_id,
      supervisor_id: assignment.supervisor_id,
      institution_id: assignment.institution_id,
      program_id: assignment.program_id || null,
      is_primary: assignment.is_primary,
      start_date: assignment.start_date || null,
      end_date: assignment.end_date || null,
      note: assignment.note || null,
      created_by: user.id,
    };

    // Try to find existing assignment
    const { data: existing } = await supabase
      .from('student_supervisor_assignments')
      .select('id')
      .eq('student_id', assignment.student_id)
      .eq('supervisor_id', assignment.supervisor_id)
      .eq('institution_id', assignment.institution_id)
      .eq('program_id', assignment.program_id || null)
      .maybeSingle();

    if (existing) {
      // Update existing
      const update: StudentSupervisorAssignmentUpdate = {
        is_primary: assignment.is_primary,
        start_date: assignment.start_date || null,
        end_date: assignment.end_date || null,
        note: assignment.note || null,
      };

      const { data, error } = await supabase
        .from('student_supervisor_assignments')
        .update(update)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      // Insert new
      const { data, error } = await supabase
        .from('student_supervisor_assignments')
        .insert(insert)
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  } catch (error: any) {
    console.error('Error upserting assignment:', error);
    throw error;
  }
}

/**
 * Update student assignment
 */
export async function updateStudentAssignment(
  assignmentId: string,
  updates: {
    institution_id?: string;
    program_id?: string | null;
    is_primary?: boolean;
    start_date?: string | null;
    end_date?: string | null;
    note?: string | null;
  }
): Promise<StudentSupervisorAssignment> {
  try {
    const update: StudentSupervisorAssignmentUpdate = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('student_supervisor_assignments')
      .update(update)
      .eq('id', assignmentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error('Error updating assignment:', error);
    throw error;
  }
}

/**
 * End student assignment (set end_date to today)
 */
export async function endStudentAssignment(assignmentId: string): Promise<void> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const { error } = await supabase
      .from('student_supervisor_assignments')
      .update({ end_date: today })
      .eq('id', assignmentId);

    if (error) throw error;
  } catch (error: any) {
    console.error('Error ending assignment:', error);
    throw error;
  }
}

/**
 * Check if supervisor has access to student's institution
 */
export async function canSupervisorAssignStudent(
  supervisorId: string,
  studentId: string,
  institutionId: string
): Promise<{ canAssign: boolean; reason?: string }> {
  try {
    // Get supervisor's institution
    const { data: supervisorProfile } = await supabase
      .from('profiles')
      .select('institution_id')
      .eq('id', supervisorId)
      .single();

    if (!supervisorProfile?.institution_id) {
      return {
        canAssign: false,
        reason: 'Supervisor is not assigned to an institution',
      };
    }

    // Check if supervisor belongs to the target institution
    if (supervisorProfile.institution_id !== institutionId) {
      return {
        canAssign: false,
        reason: 'You can only assign students within your own institution',
      };
    }

    // Check if student already belongs to a different institution
    const { data: studentProfile } = await supabase
      .from('profiles')
      .select('institution_id')
      .eq('id', studentId)
      .single();

    if (studentProfile?.institution_id && studentProfile.institution_id !== institutionId) {
      return {
        canAssign: false,
        reason: 'This student is associated with a different institution. Contact your program administrator.',
      };
    }

    return { canAssign: true };
  } catch (error: any) {
    console.error('Error checking assignment permission:', error);
    return {
      canAssign: false,
      reason: 'Error checking permissions',
    };
  }
}

