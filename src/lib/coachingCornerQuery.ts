/**
 * Resilient coaching_corner reads for DBs with partial migrations (missing columns) or no table.
 */
import { supabase } from '@/integrations/supabase/client';
import type { PostgrestError } from '@supabase/supabase-js';

const SELECT_WITH_TAGS =
  'id, created_by, role_scope, title, body, content_type, video_url, tags, priority, pinned, created_at, start_at, end_at, audience, is_active';

const SELECT_BASE =
  'id, created_by, role_scope, title, body, content_type, video_url, pinned, created_at, start_at, end_at, audience, is_active';

const SELECT_MINIMAL =
  'id, created_by, role_scope, title, body, content_type, video_url, pinned, created_at, start_at, end_at, is_active';

const ACTIVE_SELECT_ATTEMPTS = [SELECT_WITH_TAGS, SELECT_BASE, SELECT_MINIMAL] as const;

function errorStatus(error: PostgrestError): number | undefined {
  return (error as PostgrestError & { status?: number }).status;
}

function errorText(error: PostgrestError): string {
  const e = error as PostgrestError & { details?: string };
  return `${error.message ?? ''} ${e.details ?? ''}`.toLowerCase();
}

function isRelationOrTableMissing(error: PostgrestError): boolean {
  const status = errorStatus(error);
  const m = errorText(error);
  const code = error.code ?? '';

  // Unknown column — retry narrower SELECT, not "no table"
  if (code === 'PGRST204') return false;
  if (m.includes('column')) return false;

  return (
    status === 404 ||
    code === '42P01' ||
    code === 'PGRST205' ||
    (m.includes('relation') && m.includes('does not exist')) ||
    m.includes('could not find the table') ||
    (m.includes('schema cache') && m.includes('table'))
  );
}

export type CoachingCornerActiveRow = {
  id: string;
  created_by: string;
  role_scope: 'admin' | 'supervisor';
  title: string;
  body: string | null;
  content_type: 'text' | 'youtube' | 'instagram';
  video_url: string | null;
  tags: string[] | null;
  priority: number | null;
  pinned: boolean;
  created_at: string;
  start_at: string | null;
  end_at: string | null;
  audience: 'all' | 'supervisors' | 'learners';
  is_active: boolean;
};

function normalizeRow(r: Record<string, unknown>): CoachingCornerActiveRow {
  return {
    id: String(r.id),
    created_by: String(r.created_by ?? ''),
    role_scope: ((r.role_scope as CoachingCornerActiveRow['role_scope']) === 'supervisor' ? 'supervisor' : 'admin'),
    title: String(r.title),
    body: (r.body as string | null) ?? null,
    content_type: (r.content_type as CoachingCornerActiveRow['content_type']) ?? 'text',
    video_url: (r.video_url as string | null) ?? null,
    tags: (r.tags as string[] | null) ?? null,
    priority: typeof r.priority === 'number' ? r.priority : null,
    pinned: Boolean(r.pinned),
    created_at: String(r.created_at),
    start_at: (r.start_at as string | null) ?? null,
    end_at: (r.end_at as string | null) ?? null,
    audience: ((r.audience as CoachingCornerActiveRow['audience']) || 'all') as CoachingCornerActiveRow['audience'],
    is_active: r.is_active !== false,
  };
}

/**
 * Active coaching_corner rows, trying narrower SELECT lists when PostgREST returns 400 (unknown column).
 */
export async function fetchCoachingCornerActiveRows(): Promise<CoachingCornerActiveRow[]> {
  for (let i = 0; i < ACTIVE_SELECT_ATTEMPTS.length; i++) {
    const selectList = ACTIVE_SELECT_ATTEMPTS[i];
    const { data, error } = await supabase
      .from('coaching_corner')
      .select(selectList)
      .eq('is_active', true)
      .order('pinned', { ascending: false })
      .order('start_at', { ascending: false });

    if (!error && data) {
      return (data as Record<string, unknown>[]).map((row) => normalizeRow(row));
    }

    if (error && isRelationOrTableMissing(error)) {
      console.warn('coaching_corner unavailable (table missing or not exposed). Returning no rows.');
      return [];
    }

    const hasMoreAttempts = i < ACTIVE_SELECT_ATTEMPTS.length - 1;
    if (error && hasMoreAttempts) {
      continue;
    }

    if (error) {
      console.error('coaching_corner query failed:', error);
    }
  }

  console.warn('coaching_corner: all select fallbacks failed; returning no rows.');
  return [];
}

export function coachingCornerRelationMissing(error: PostgrestError | null): boolean {
  return !!error && isRelationOrTableMissing(error);
}
