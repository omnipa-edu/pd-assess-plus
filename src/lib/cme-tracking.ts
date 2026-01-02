import { format } from 'date-fns';

import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { logger } from '@/lib/logger';

type CMESession = Database['public']['Tables']['supervisor_cme_sessions']['Row'];
type CMESessionInsert = Database['public']['Tables']['supervisor_cme_sessions']['Insert'];
type CMESessionUpdate = Database['public']['Tables']['supervisor_cme_sessions']['Update'];

export type ActivityType = CMESession['activity_type'];
export type SourceType = CMESession['source'];

export interface CMESessionWithWBA extends CMESession {
  wba_link?: string;
}

export interface CMESummary {
  totalMinutes: number;
  totalHours: number;
  totalSessions: number;
  averageHoursPerWeek: number;
  breakdownByActivity: Record<ActivityType, { minutes: number; hours: number; count: number }>;
}

export interface CMEFilter {
  startDate?: Date;
  endDate?: Date;
  activityType?: ActivityType | 'all';
  source?: SourceType | 'all';
}

/**
 * Get CME sessions for a supervisor with optional filters
 */
export async function getSupervisorCMESessions(
  supervisorId: string,
  filters?: CMEFilter
): Promise<CMESession[]> {
  let query = supabase
    .from('supervisor_cme_sessions')
    .select('id, supervisor_id, org_id, source, wba_id, wba_type, activity_type, minutes, description, session_date, created_at, updated_at')
    .eq('supervisor_id', supervisorId)
    .order('session_date', { ascending: false });

  if (filters?.startDate) {
    query = query.gte('session_date', filters.startDate.toISOString().split('T')[0]);
  }

  if (filters?.endDate) {
    query = query.lte('session_date', filters.endDate.toISOString().split('T')[0]);
  }

  if (filters?.activityType && filters.activityType !== 'all') {
    query = query.eq('activity_type', filters.activityType);
  }

  if (filters?.source && filters.source !== 'all') {
    query = query.eq('source', filters.source);
  }

  const { data, error } = await query;

  if (error) {
    // Handle case where table doesn't exist (404) gracefully
    const errorStr = JSON.stringify(error).toLowerCase();
    const ERROR_CODE_TABLE_NOT_FOUND = 'PGRST116';
    const is404 = error.code === ERROR_CODE_TABLE_NOT_FOUND || 
                  error.message?.includes('relation') || 
                  error.message?.includes('does not exist') ||
                  error.message?.includes('404') ||
                  errorStr.includes('404') ||
                  errorStr.includes('not found');
    
    if (is404) {
      logger.warn('CME sessions table not found. This feature may not be set up yet. Please run migration: 20251115_supervisor_cme_tracking.sql');
      return [];
    }
    logger.error('Error fetching CME sessions', error);
    throw error;
  }

  return data || [];
}

/**
 * Create a manual CME session entry
 */
export async function createManualCMESession(
  supervisorId: string,
  orgId: string | null,
  data: {
    activity_type: ActivityType;
    minutes: number;
    description?: string;
    session_date: string;
  }
): Promise<CMESession> {
  const insert: CMESessionInsert = {
    supervisor_id: supervisorId,
    org_id: orgId,
    source: 'manual',
    activity_type: data.activity_type,
    minutes: data.minutes,
    description: data.description || null,
    session_date: data.session_date,
    wba_id: null,
    wba_type: null,
  };

  const { data: session, error } = await supabase
    .from('supervisor_cme_sessions')
    .insert(insert)
    .select()
    .single();

  if (error) {
    logger.error('Error creating manual CME session', error);
    throw error;
  }

  return session;
}

/**
 * Update a CME session
 * For auto_wba entries: only minutes and description can be edited
 * For manual entries: all fields can be edited
 */
export async function updateCMESession(
  sessionId: string,
  updates: {
    activity_type?: ActivityType;
    minutes?: number;
    description?: string;
    session_date?: string;
  }
): Promise<CMESession> {
  const update: CMESessionUpdate = {
    ...updates,
    updated_at: new Date().toISOString(),
  };

  const { data: session, error } = await supabase
    .from('supervisor_cme_sessions')
    .update(update)
    .eq('id', sessionId)
    .select()
    .single();

  if (error) {
    logger.error('Error updating CME session', error);
    throw error;
  }

  return session;
}

/**
 * Delete a CME session (only manual entries can be deleted)
 */
export async function deleteCMESession(sessionId: string): Promise<void> {
  // First check if it's a manual entry
  const { data: session, error: fetchError } = await supabase
    .from('supervisor_cme_sessions')
    .select('source')
    .eq('id', sessionId)
    .single();

  if (fetchError) {
    throw new Error('Session not found');
  }

  if (session.source !== 'manual') {
    throw new Error('Only manual entries can be deleted');
  }

  const { error } = await supabase
    .from('supervisor_cme_sessions')
    .delete()
    .eq('id', sessionId);

  if (error) {
    logger.error('Error deleting CME session', error);
    throw error;
  }
}

/**
 * Calculate CME summary statistics
 */
export function calculateCMESummary(sessions: CMESession[], year?: number): CMESummary {
  const filteredSessions = year
    ? sessions.filter(s => {
        const sessionYear = new Date(s.session_date).getFullYear();
        return sessionYear === year;
      })
    : sessions;

  const totalMinutes = filteredSessions.reduce((sum, s) => sum + s.minutes, 0);
  const totalHours = totalMinutes / 60;
  const totalSessions = filteredSessions.length;

  // Calculate average hours per week
  let averageHoursPerWeek = 0;
  if (filteredSessions.length > 0) {
    const dates = filteredSessions.map(s => new Date(s.session_date));
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
    const weeksDiff = Math.max(1, Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24 * 7)));
    averageHoursPerWeek = totalHours / weeksDiff;
  }

  // Breakdown by activity type
  const breakdownByActivity: Record<ActivityType, { minutes: number; hours: number; count: number }> = {
    direct_observation: { minutes: 0, hours: 0, count: 0 },
    chart_review: { minutes: 0, hours: 0, count: 0 },
    end_of_rotation: { minutes: 0, hours: 0, count: 0 },
    narrative_feedback: { minutes: 0, hours: 0, count: 0 },
    group_teaching: { minutes: 0, hours: 0, count: 0 },
    other: { minutes: 0, hours: 0, count: 0 },
  };

  filteredSessions.forEach(session => {
    const activity = session.activity_type;
    if (breakdownByActivity[activity]) {
      breakdownByActivity[activity].minutes += session.minutes;
      breakdownByActivity[activity].hours += session.minutes / 60;
      breakdownByActivity[activity].count += 1;
    }
  });

  return {
    totalMinutes,
    totalHours,
    totalSessions,
    averageHoursPerWeek,
    breakdownByActivity,
  };
}

/**
 * Get activity type label for display
 */
export function getActivityTypeLabel(activityType: ActivityType): string {
  const labels: Record<ActivityType, string> = {
    direct_observation: 'Direct Observation',
    chart_review: 'Chart Review',
    end_of_rotation: 'End-of-Rotation',
    narrative_feedback: 'Narrative Feedback',
    group_teaching: 'Group Teaching',
    other: 'Other',
  };
  return labels[activityType] || activityType;
}

/**
 * Format date range for display
 */
export function formatDateRange(startDate: Date, endDate: Date): string {
  const start = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const end = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return `${start} - ${end}`;
}

/**
 * Export sessions to CSV format
 */
export function exportSessionsToCSV(sessions: CMESession[]): string {
  const headers = ['Date', 'Activity Type', 'Minutes', 'Description', 'Source', 'WBA ID'];
  const rows = sessions.map(session => [
    session.session_date,
    getActivityTypeLabel(session.activity_type),
    session.minutes.toString(),
    session.description || '',
    session.source === 'auto_wba' ? 'Auto' : 'Manual',
    session.wba_id || '',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  return csvContent;
}

/**
 * Download CSV file
 */
export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Generate and download PDF report
 */
export async function exportSessionsToPDF(
  sessions: CMESession[],
  supervisorName: string,
  supervisorCredentials: string | null,
  institutionName: string | null,
  startDate: Date,
  endDate: Date,
  summary: CMESummary
): Promise<void> {
  // Dynamic import to avoid SSR issues
  const { jsPDF } = await import('jspdf');
  
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPos = margin;

  // Helper function to add a new page if needed
  const checkPageBreak = (requiredSpace: number) => {
    if (yPos + requiredSpace > pageHeight - margin) {
      doc.addPage();
      yPos = margin;
    }
  };

  // Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('CME Activity Report', margin, yPos);
  yPos += 10;

  // Supervisor Information
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Supervisor: ${supervisorName}`, margin, yPos);
  yPos += 6;
  if (supervisorCredentials) {
    doc.text(`Credentials: ${supervisorCredentials}`, margin, yPos);
    yPos += 6;
  }
  if (institutionName) {
    doc.text(`Institution: ${institutionName}`, margin, yPos);
    yPos += 6;
  }
  yPos += 4;

  // Date Range
  doc.text(`Date Range: ${formatDateRange(startDate, endDate)}`, margin, yPos);
  yPos += 10;

  // Summary Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Summary', margin, yPos);
  yPos += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(`Total Hours: ${summary.totalHours.toFixed(1)} hours (${summary.totalMinutes} minutes)`, margin, yPos);
  yPos += 6;
  doc.text(`Total Sessions: ${summary.totalSessions}`, margin, yPos);
  yPos += 6;
  doc.text(`Average: ${summary.averageHoursPerWeek.toFixed(1)} hours per week`, margin, yPos);
  yPos += 10;

  // Activity Breakdown
  doc.setFont('helvetica', 'bold');
  doc.text('Activity Breakdown:', margin, yPos);
  yPos += 6;

  doc.setFont('helvetica', 'normal');
  Object.entries(summary.breakdownByActivity)
    .filter(([_, data]) => data.count > 0)
    .forEach(([activity, data]) => {
      checkPageBreak(6);
      doc.text(
        `  ${getActivityTypeLabel(activity as ActivityType)}: ${data.hours.toFixed(1)} hours (${data.count} sessions)`,
        margin,
        yPos
      );
      yPos += 6;
    });
  yPos += 10;

  // Sessions Table Header
  checkPageBreak(20);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Sessions', margin, yPos);
  yPos += 8;

  // Table headers
  const colWidths = [30, 50, 25, 25, 25, 35];
  const headers = ['Date', 'Activity', 'Min', 'Source', 'Description'];
  let xPos = margin;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  headers.forEach((header, i) => {
    doc.text(header, xPos, yPos);
    xPos += colWidths[i];
  });
  yPos += 6;

  // Table rows
  doc.setFont('helvetica', 'normal');
  sessions.forEach((session) => {
    checkPageBreak(8);
    xPos = margin;
    const date = new Date(session.session_date);
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    
    // Split long descriptions
    const description = (session.description || '').substring(0, 40);
    const activityLabel = getActivityTypeLabel(session.activity_type).substring(0, 20);
    const source = session.source === 'auto_wba' ? 'Auto' : 'Manual';

    doc.text(dateStr, xPos, yPos);
    xPos += colWidths[0];
    doc.text(activityLabel, xPos, yPos);
    xPos += colWidths[1];
    doc.text(session.minutes.toString(), xPos, yPos);
    xPos += colWidths[2];
    doc.text(source, xPos, yPos);
    xPos += colWidths[3];
    doc.text(description, xPos, yPos, { maxWidth: colWidths[4] });
    yPos += 6;
  });

  yPos += 10;
  checkPageBreak(60);

  // Disclaimer
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Disclaimer', margin, yPos);
  yPos += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const disclaimerText = [
    'THIS REPORT IS PROVIDED FOR DOCUMENTATION PURPOSES ONLY. It is intended to help you track',
    'time spent in educational activities such as observation, feedback, and coaching. This platform',
    'does not grant CME credit. You are responsible for determining whether these activities qualify',
    'as AMA PRA Category II Credit™ or NCCPA Category II CME and for claiming credit in accordance',
    'with your certifying body\'s rules.'
  ];

  disclaimerText.forEach((line) => {
    checkPageBreak(6);
    doc.text(line, margin, yPos, { maxWidth: pageWidth - 2 * margin });
    yPos += 5;
  });

  yPos += 8;
  checkPageBreak(40);

  // Attestation
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Attestation', margin, yPos);
  yPos += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const attestationText = [
    'I attest that the activities and time documented in this report are, to the best of my',
    'knowledge, accurate and reflect my educational supervision and coaching activities for the',
    'period indicated.'
  ];

  attestationText.forEach((line) => {
    doc.text(line, margin, yPos, { maxWidth: pageWidth - 2 * margin });
    yPos += 5;
  });

  yPos += 10;
  checkPageBreak(30);

  // Signature lines
  doc.setFontSize(10);
  doc.text('Supervisor Name: ___________________________', margin, yPos);
  yPos += 8;
  doc.text('Signature: ___________________________', margin, yPos);
  yPos += 8;
  doc.text('Date: ___________________________', margin, yPos);

  // Save PDF
  const startDateStr = format(startDate, 'yyyy-MM-dd');
  const endDateStr = format(endDate, 'yyyy-MM-dd');
  const filename = `cme-report-${startDateStr}-to-${endDateStr}.pdf`;
  doc.save(filename);
}


