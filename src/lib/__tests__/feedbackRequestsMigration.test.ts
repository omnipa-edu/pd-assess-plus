import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  resolve(process.cwd(), 'supabase/migrations/202603271100_harden_supervisor_feedback_request_updates.sql'),
  'utf8'
);

describe('supervisor feedback request update hardening migration', () => {
  it('keeps assignment and request details immutable during client updates', () => {
    expect(migration).toContain('CREATE TRIGGER enforce_supervisor_feedback_request_client_update');
    expect(migration).toContain('NEW.student_id IS DISTINCT FROM OLD.student_id');
    expect(migration).toContain('NEW.supervisor_id IS DISTINCT FROM OLD.supervisor_id');
    expect(migration).toContain('NEW.message IS DISTINCT FROM OLD.message');
    expect(migration).toContain('NEW.metadata IS DISTINCT FROM OLD.metadata');
    expect(migration).toContain('supervisor_feedback_request_immutable_fields');
  });

  it('limits student updates to cancelling their own open requests', () => {
    expect(migration).toContain('students_may_only_cancel_open_feedback_requests');
    expect(migration).toContain("status = 'cancelled'::public.supervisor_feedback_request_status");
  });
});
