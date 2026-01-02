/**
 * CSV/TSV Parser
 * Parse CSV and TSV files for EPA import
 */

import Papa from 'papaparse';

import { sanitizeRow, parseKSA } from '../validation';

export interface ParsedRow {
  code: string;
  title: string;
  description: string;
  ksa?: any;
  version?: string;
  status?: 'draft' | 'active' | 'retired';
}

export interface ParseResult {
  rows: ParsedRow[];
  headers: string[];
  errors: string[];
}

// Common header name variations (case-insensitive)
const HEADER_MAPPINGS: Record<string, string[]> = {
  code: ['code', 'epa code', 'epa_code', 'epa id', 'id', 'epa number'],
  title: ['title', 'name', 'epa title', 'epa_name', 'epa name'],
  description: ['description', 'desc', 'details', 'summary', 'overview'],
  ksa: ['ksa', 'competencies', 'knowledge skills attitudes', 'competency'],
  version: ['version', 'ver', 'v', 'revision'],
  status: ['status', 'state', 'active', 'stage'],
};

/**
 * Normalize header name to canonical field name
 */
function normalizeHeader(header: string): string | null {
  const normalized = header.toLowerCase().trim();
  
  for (const [canonical, variants] of Object.entries(HEADER_MAPPINGS)) {
    if (variants.includes(normalized)) {
      return canonical;
    }
  }
  
  return null;
}

/**
 * Create header mapping from detected headers
 */
export function createHeaderMapping(headers: string[]): Map<string, string> {
  const mapping = new Map<string, string>();
  
  headers.forEach(header => {
    const canonical = normalizeHeader(header);
    if (canonical) {
      mapping.set(header, canonical);
    }
  });
  
  return mapping;
}

/**
 * Parse CSV file
 */
export function parseCSV(file: File): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
      complete: (results) => {
        try {
          const headers = results.meta.fields || [];
          const headerMapping = createHeaderMapping(headers);
          const errors: string[] = [];
          
          // Check required fields are present
          const hasCode = Array.from(headerMapping.values()).includes('code');
          const hasTitle = Array.from(headerMapping.values()).includes('title');
          const hasDescription = Array.from(headerMapping.values()).includes('description');
          
          if (!hasCode) {
            errors.push('Missing required column: Code (or variants like "EPA Code", "ID")');
          }
          if (!hasTitle) {
            errors.push('Missing required column: Title (or variants like "Name", "EPA Title")');
          }
          if (!hasDescription) {
            errors.push('Missing required column: Description (or variants like "Details", "Summary")');
          }
          
          if (errors.length > 0) {
            resolve({ rows: [], headers, errors });
            return;
          }
          
          // Map rows to canonical schema
          const rows: ParsedRow[] = results.data.map((row: any) => {
            const sanitized = sanitizeRow(row);
            const mapped: any = {};
            
            for (const [originalHeader, value] of Object.entries(sanitized)) {
              const canonical = headerMapping.get(originalHeader);
              if (canonical && value) {
                if (canonical === 'ksa') {
                  mapped[canonical] = parseKSA(String(value));
                } else {
                  mapped[canonical] = value;
                }
              }
            }
            
            return mapped as ParsedRow;
          });
          
          resolve({ rows, headers, errors: [] });
        } catch (error: any) {
          reject(new Error(`Failed to parse CSV: ${error.message}`));
        }
      },
      error: (error) => {
        reject(new Error(`CSV parsing error: ${error.message}`));
      },
    });
  });
}

/**
 * Parse TSV file (tab-separated)
 */
export function parseTSV(file: File): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      delimiter: '\t',
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
      complete: (results) => {
        try {
          const headers = results.meta.fields || [];
          const headerMapping = createHeaderMapping(headers);
          const errors: string[] = [];
          
          // Check required fields
          const hasCode = Array.from(headerMapping.values()).includes('code');
          const hasTitle = Array.from(headerMapping.values()).includes('title');
          const hasDescription = Array.from(headerMapping.values()).includes('description');
          
          if (!hasCode || !hasTitle || !hasDescription) {
            errors.push('Missing required columns (Code, Title, Description)');
          }
          
          if (errors.length > 0) {
            resolve({ rows: [], headers, errors });
            return;
          }
          
          // Map rows
          const rows: ParsedRow[] = results.data.map((row: any) => {
            const sanitized = sanitizeRow(row);
            const mapped: any = {};
            
            for (const [originalHeader, value] of Object.entries(sanitized)) {
              const canonical = headerMapping.get(originalHeader);
              if (canonical && value) {
                if (canonical === 'ksa') {
                  mapped[canonical] = parseKSA(String(value));
                } else {
                  mapped[canonical] = value;
                }
              }
            }
            
            return mapped as ParsedRow;
          });
          
          resolve({ rows, headers, errors: [] });
        } catch (error: any) {
          reject(new Error(`Failed to parse TSV: ${error.message}`));
        }
      },
      error: (error) => {
        reject(new Error(`TSV parsing error: ${error.message}`));
      },
    });
  });
}

/**
 * Parse CSV/TSV from text content
 */
export function parseCSVText(content: string, delimiter: ',' | '\t' = ','): ParseResult {
  const results = Papa.parse(content, {
    header: true,
    delimiter,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
  });
  
  const headers = results.meta.fields || [];
  const headerMapping = createHeaderMapping(headers);
  const errors: string[] = [];
  
  // Check required fields
  const hasCode = Array.from(headerMapping.values()).includes('code');
  const hasTitle = Array.from(headerMapping.values()).includes('title');
  const hasDescription = Array.from(headerMapping.values()).includes('description');
  
  if (!hasCode || !hasTitle || !hasDescription) {
    errors.push('Missing required columns (Code, Title, Description)');
    return { rows: [], headers, errors };
  }
  
  // Map rows
  const rows: ParsedRow[] = results.data.map((row: any) => {
    const sanitized = sanitizeRow(row);
    const mapped: any = {};
    
    for (const [originalHeader, value] of Object.entries(sanitized)) {
      const canonical = headerMapping.get(originalHeader);
      if (canonical && value) {
        if (canonical === 'ksa') {
          mapped[canonical] = parseKSA(String(value));
        } else {
          mapped[canonical] = value;
        }
      }
    }
    
    return mapped as ParsedRow;
  });
  
  return { rows, headers, errors: [] };
}

/**
 * Detect file type from File object
 */
export function detectFileType(file: File): 'csv' | 'tsv' | 'unknown' {
  const name = file.name.toLowerCase();
  
  if (name.endsWith('.csv')) return 'csv';
  if (name.endsWith('.tsv') || name.endsWith('.txt')) return 'tsv';
  
  return 'unknown';
}

/**
 * Auto-parse file based on extension
 */
export async function parseFile(file: File): Promise<ParseResult> {
  const type = detectFileType(file);
  
  switch (type) {
    case 'csv':
      return parseCSV(file);
    case 'tsv':
      return parseTSV(file);
    default:
      throw new Error(`Unsupported file type. Please use .csv or .tsv files.`);
  }
}


