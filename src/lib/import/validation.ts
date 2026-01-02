/**
 * EPA Import Validation
 * Validation and de-duplication logic for bulk EPA imports
 */

import { z } from 'zod';

import { supabase } from '@/integrations/supabase/client';

// ============================================================================
// SCHEMAS
// ============================================================================

export const epaRowSchema = z.object({
  code: z.string()
    .min(2, 'Code must be at least 2 characters')
    .max(32, 'Code must be at most 32 characters')
    .transform(val => val.trim().toUpperCase()),
  
  title: z.string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must be at most 200 characters')
    .transform(val => val.trim()),
  
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(5000, 'Description must be at most 5000 characters')
    .transform(val => val.trim()),
  
  ksa: z.any().optional(),
  
  version: z.string()
    .optional()
    .default('v1')
    .transform(val => val || 'v1'),
  
  status: z.enum(['draft', 'active', 'retired'])
    .optional()
    .default('active'),
});

export type EPARowInput = z.input<typeof epaRowSchema>;
export type EPARowOutput = z.output<typeof epaRowSchema>;

// ============================================================================
// VALIDATION RESULTS
// ============================================================================

export interface ValidationError {
  row: number;
  field?: string;
  message: string;
}

export interface DuplicateEPA {
  row: number;
  code: string;
  existingId: string;
  existingVersion: string;
  suggestedVersion: string;
}

export interface ValidationResult {
  valid: EPARowOutput[];
  errors: ValidationError[];
  duplicates: DuplicateEPA[];
  totalRows: number;
  validCount: number;
  errorCount: number;
  duplicateCount: number;
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate array of EPA rows
 */
export function validateRows(rows: any[]): ValidationResult {
  const valid: EPARowOutput[] = [];
  const errors: ValidationError[] = [];
  
  rows.forEach((row, index) => {
    const result = epaRowSchema.safeParse(row);
    
    if (result.success) {
      valid.push(result.data);
    } else {
      result.error.issues.forEach(issue => {
        errors.push({
          row: index + 1,
          field: issue.path.join('.'),
          message: issue.message,
        });
      });
    }
  });
  
  return {
    valid,
    errors,
    duplicates: [], // Will be populated by checkDuplicates
    totalRows: rows.length,
    validCount: valid.length,
    errorCount: errors.length,
    duplicateCount: 0,
  };
}

/**
 * Check for duplicate EPA codes within specialty
 */
export async function checkDuplicates(
  validRows: EPARowOutput[],
  specialtyId: string
): Promise<DuplicateEPA[]> {
  try {
    // Get existing EPAs for this specialty
    const { data: existingEPAs, error } = await supabase
      .from('epas')
      .select('id, code, version')
      .eq('specialty_id', specialtyId);
    
    if (error) throw error;
    
    const duplicates: DuplicateEPA[] = [];
    const existingCodes = new Map(
      (existingEPAs || []).map(epa => [epa.code, epa])
    );
    
    validRows.forEach((row, index) => {
      const existing = existingCodes.get(row.code);
      if (existing) {
        // Parse existing version number
        const versionNum = parseInt(existing.version.replace(/\D/g, '') || '1');
        const suggestedVersion = `v${versionNum + 1}`;
        
        duplicates.push({
          row: index + 1,
          code: row.code,
          existingId: existing.id,
          existingVersion: existing.version,
          suggestedVersion,
        });
      }
    });
    
    return duplicates;
  } catch (error) {
    console.error('Error checking duplicates:', error);
    return [];
  }
}

/**
 * Combine validation and duplicate checking
 */
export async function validateImport(
  rows: any[],
  specialtyId: string
): Promise<ValidationResult> {
  // Step 1: Validate schema
  const validation = validateRows(rows);
  
  // Step 2: Check for duplicates
  const duplicates = await checkDuplicates(validation.valid, specialtyId);
  
  return {
    ...validation,
    duplicates,
    duplicateCount: duplicates.length,
  };
}

// ============================================================================
// DE-DUPLICATION ACTIONS
// ============================================================================

export type DedupeAction = 'skip' | 'update' | 'create_version';

export interface DedupeChoice {
  row: number;
  code: string;
  action: DedupeAction;
  newVersion?: string;
}

/**
 * Apply de-duplication choices to filter rows
 */
export function applyDedupeChoices(
  validRows: EPARowOutput[],
  duplicates: DuplicateEPA[],
  choices: DedupeChoice[]
): {
  toCreate: EPARowOutput[];
  toUpdate: Array<{ id: string; data: EPARowOutput }>;
  toSkip: number[];
} {
  const choiceMap = new Map(choices.map(c => [c.row - 1, c]));
  const duplicateIndexes = new Set(duplicates.map(d => d.row - 1));
  
  const toCreate: EPARowOutput[] = [];
  const toUpdate: Array<{ id: string; data: EPARowOutput }> = [];
  const toSkip: number[] = [];
  
  validRows.forEach((row, index) => {
    const isDuplicate = duplicateIndexes.has(index);
    
    if (!isDuplicate) {
      // Not a duplicate - create new
      toCreate.push(row);
    } else {
      // Handle duplicate based on user choice
      const choice = choiceMap.get(index);
      const duplicate = duplicates.find(d => d.row - 1 === index);
      
      if (!choice || !duplicate) {
        toSkip.push(index);
        return;
      }
      
      switch (choice.action) {
        case 'skip':
          toSkip.push(index);
          break;
        
        case 'update':
          toUpdate.push({
            id: duplicate.existingId,
            data: row,
          });
          break;
        
        case 'create_version':
          toCreate.push({
            ...row,
            version: choice.newVersion || duplicate.suggestedVersion,
          });
          break;
      }
    }
  });
  
  return { toCreate, toUpdate, toSkip };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Sanitize and clean row data
 */
export function sanitizeRow(row: any): any {
  const cleaned: any = {};
  
  for (const [key, value] of Object.entries(row)) {
    if (typeof value === 'string') {
      // Trim whitespace, normalize line breaks
      cleaned[key] = value.trim().replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    } else {
      cleaned[key] = value;
    }
  }
  
  return cleaned;
}

/**
 * Parse KSA field (can be semicolon-separated or JSON)
 */
export function parseKSA(ksaField: string | undefined): any {
  if (!ksaField) return null;
  
  // Try parsing as JSON first
  try {
    return JSON.parse(ksaField);
  } catch {
    // Not JSON - try parsing as semicolon-separated list
    const parts = ksaField.split(';').map(s => s.trim()).filter(Boolean);
    
    if (parts.length === 0) return null;
    
    // Try to detect "Knowledge:", "Skills:", etc.
    const ksa: any = {};
    
    parts.forEach(part => {
      if (part.toLowerCase().startsWith('knowledge:')) {
        ksa.knowledge = [part.substring(10).trim()];
      } else if (part.toLowerCase().startsWith('skills:')) {
        ksa.skills = [part.substring(7).trim()];
      } else if (part.toLowerCase().startsWith('attitudes:')) {
        ksa.attitudes = [part.substring(10).trim()];
      }
    });
    
    return Object.keys(ksa).length > 0 ? ksa : { text: ksaField };
  }
}

/**
 * Format validation error for display
 */
export function formatValidationError(error: ValidationError): string {
  if (error.field) {
    return `Row ${error.row}: ${error.field} - ${error.message}`;
  }
  return `Row ${error.row}: ${error.message}`;
}


