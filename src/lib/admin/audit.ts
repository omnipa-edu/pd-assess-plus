/**
 * Audit Logging Utilities
 * Write and retrieve audit log entries for admin actions
 */

import { supabase } from '@/integrations/supabase/client';

export type AuditAction = 'create' | 'update' | 'delete' | 'import' | 'bulk_update';

export interface AuditLogEntry {
  id: string;
  actor_user_id: string | null;
  action: AuditAction;
  entity: string;
  entity_id: string;
  diff: {
    before?: Record<string, any>;
    after?: Record<string, any>;
  } | null;
  metadata: Record<string, any> | null;
  created_at: string;
}

export interface WriteAuditParams {
  action: AuditAction;
  entity: string;
  entityId: string;
  diff?: {
    before?: Record<string, any>;
    after?: Record<string, any>;
  };
  metadata?: Record<string, any>;
}

/**
 * Write an audit log entry
 */
export async function writeAudit(params: WriteAuditParams): Promise<string | null> {
  try {
    const { data, error } = await supabase.rpc('write_audit_log', {
      p_action: params.action,
      p_entity: params.entity,
      p_entity_id: params.entityId,
      p_diff: params.diff || null,
      p_metadata: params.metadata || null
    });

    if (error) {
      console.error('Failed to write audit log:', error);
      return null;
    }

    return data as string;
  } catch (error) {
    console.error('Error writing audit log:', error);
    return null;
  }
}

/**
 * Get audit log entries for an entity
 */
export async function getAuditLog(entity: string, entityId?: string, limit = 50) {
  try {
    let query = supabase
      .from('audit_log')
      .select('*')
      .eq('entity', entity)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (entityId) {
      query = query.eq('entity_id', entityId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to fetch audit log:', error);
      return [];
    }

    return (data || []) as AuditLogEntry[];
  } catch (error) {
    console.error('Error fetching audit log:', error);
    return [];
  }
}

/**
 * Get recent audit activity (all entities)
 */
export async function getRecentActivity(limit = 50) {
  try {
    const { data, error } = await supabase
      .from('audit_log')
      .select('*')
      .order('created_at', { ascending: false})
      .limit(limit);

    if (error) {
      console.error('Failed to fetch recent activity:', error);
      return [];
    }

    return (data || []) as AuditLogEntry[];
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    return [];
  }
}

