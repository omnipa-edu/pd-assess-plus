/**
 * EPA Import Commit
 * Transactional import of validated EPAs with audit logging
 */

import { supabase } from '@/integrations/supabase/client';
import { writeAudit } from '../admin/audit';
import { EPARowOutput } from './validation';
import { DedupeChoice } from './validation';

export interface ImportResult {
  success: boolean;
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
  importId?: string;
}

/**
 * Commit EPA import with transaction
 */
export async function commitEPAImport(
  rows: EPARowOutput[],
  specialtyId: string,
  dedupeChoices: Map<number, DedupeChoice>
): Promise<ImportResult> {
  const result: ImportResult = {
    success: false,
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [],
  };

  try {
    // Get existing EPAs for this specialty
    const { data: existingEPAs } = await supabase
      .from('epas')
      .select('id, code, version')
      .eq('specialty_id', specialtyId);
    
    const existingMap = new Map(
      (existingEPAs || []).map(epa => [epa.code, epa])
    );

    // Separate rows into create, update, skip
    const toCreate: EPARowOutput[] = [];
    const toUpdate: Array<{ id: string; data: EPARowOutput }> = [];

    rows.forEach((row, index) => {
      const existing = existingMap.get(row.code);
      
      if (!existing) {
        // New EPA - create
        toCreate.push(row);
      } else {
        // Duplicate - check user choice
        const choice = dedupeChoices.get(index);
        
        if (!choice || choice.action === 'skip') {
          result.skipped++;
        } else if (choice.action === 'update') {
          toUpdate.push({ id: existing.id, data: row });
        } else if (choice.action === 'create_version') {
          toCreate.push({
            ...row,
            version: choice.newVersion || `v${parseInt(existing.version.replace(/\D/g, '') || '1') + 1}`,
          });
        }
      }
    });

    // Execute creates
    if (toCreate.length > 0) {
      const { data: created, error: createError } = await supabase
        .from('epas')
        .insert(
          toCreate.map(row => ({
            specialty_id: specialtyId,
            code: row.code,
            title: row.title,
            description: row.description,
            ksa: row.ksa || null,
            version: row.version,
            status: row.status || 'active',
          }))
        )
        .select();

      if (createError) {
        result.errors.push(`Failed to create EPAs: ${createError.message}`);
        throw createError;
      }

      result.created = created?.length || 0;
    }

    // Execute updates
    if (toUpdate.length > 0) {
      for (const { id, data } of toUpdate) {
        const { error: updateError } = await supabase
          .from('epas')
          .update({
            title: data.title,
            description: data.description,
            ksa: data.ksa || null,
            version: data.version,
            status: data.status || 'active',
          })
          .eq('id', id);

        if (updateError) {
          result.errors.push(`Failed to update EPA ${data.code}: ${updateError.message}`);
        } else {
          result.updated++;
        }
      }
    }

    // Write audit log
    const auditId = await writeAudit({
      action: 'import',
      entity: 'epas',
      entityId: specialtyId,
      metadata: {
        total_rows: rows.length,
        created: result.created,
        updated: result.updated,
        skipped: result.skipped,
        errors: result.errors.length,
      },
    });

    result.importId = auditId || undefined;
    result.success = result.errors.length === 0;

    return result;
  } catch (error: any) {
    console.error('Error committing import:', error);
    return {
      success: false,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [error.message || 'Import failed'],
    };
  }
}

/**
 * Validate import data before commit
 */
export function canCommitImport(
  rows: EPARowOutput[],
  duplicates: any[],
  dedupeChoices: Map<number, DedupeChoice>
): { canCommit: boolean; message: string } {
  if (rows.length === 0) {
    return {
      canCommit: false,
      message: 'No valid rows to import',
    };
  }

  // Check all duplicates have choices
  const duplicateIndexes = new Set(duplicates.map(d => d.row - 1));
  const unchosenDuplicates = Array.from(duplicateIndexes).filter(
    index => !dedupeChoices.has(index)
  );

  if (unchosenDuplicates.length > 0) {
    return {
      canCommit: false,
      message: `Please choose an action for all ${unchosenDuplicates.length} duplicate(s)`,
    };
  }

  return {
    canCommit: true,
    message: 'Ready to import',
  };
}

/**
 * Generate import summary
 */
export function generateImportSummary(
  rows: EPARowOutput[],
  duplicates: any[],
  dedupeChoices: Map<number, DedupeChoice>
): {
  toCreate: number;
  toUpdate: number;
  toSkip: number;
  newVersions: number;
} {
  const summary = {
    toCreate: 0,
    toUpdate: 0,
    toSkip: 0,
    newVersions: 0,
  };

  const duplicateIndexes = new Set(duplicates.map(d => d.row - 1));

  rows.forEach((row, index) => {
    if (!duplicateIndexes.has(index)) {
      summary.toCreate++;
    } else {
      const choice = dedupeChoices.get(index);
      
      if (!choice || choice.action === 'skip') {
        summary.toSkip++;
      } else if (choice.action === 'update') {
        summary.toUpdate++;
      } else if (choice.action === 'create_version') {
        summary.toCreate++;
        summary.newVersions++;
      }
    }
  });

  return summary;
}

