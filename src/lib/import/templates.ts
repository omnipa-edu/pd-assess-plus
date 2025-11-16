/**
 * EPA Template Generation
 * Generate downloadable templates for EPA bulk import
 */

export interface EPATemplateRow {
  code: string;
  title: string;
  description: string;
  ksa: string;
  version: string;
  status: string;
}

const SAMPLE_ROWS: EPATemplateRow[] = [
  {
    code: 'EPA-1.1',
    title: 'Taking a focused clinical history',
    description: 'The resident will gather relevant clinical information from patients through effective history-taking, demonstrating appropriate communication skills and clinical reasoning.',
    ksa: 'Knowledge: Medical interviewing techniques; Skills: Active listening, rapport building; Attitudes: Patient-centered care, empathy',
    version: 'v1',
    status: 'active'
  },
  {
    code: 'EPA-1.2',
    title: 'Performing a physical examination',
    description: 'The resident will conduct systematic and thorough physical examinations, identifying normal and abnormal findings relevant to the clinical context.',
    ksa: 'Knowledge: Anatomy, pathophysiology; Skills: Examination techniques, pattern recognition; Attitudes: Respect for patient dignity, attention to detail',
    version: 'v1',
    status: 'active'
  },
  {
    code: 'EPA-2.1',
    title: 'Formulating a differential diagnosis',
    description: 'The resident will synthesize clinical information to generate an appropriate differential diagnosis, considering likelihood and severity of potential conditions.',
    ksa: 'Knowledge: Disease presentations, epidemiology; Skills: Clinical reasoning, pattern recognition; Attitudes: Intellectual curiosity, systematic approach',
    version: 'v1',
    status: 'draft'
  }
];

// ============================================================================
// CSV TEMPLATE
// ============================================================================

/**
 * Generate CSV template
 */
export function generateCSVTemplate(): Blob {
  const headers = ['Code', 'Title', 'Description', 'KSA', 'Version', 'Status'];
  
  const rows = SAMPLE_ROWS.map(row => [
    row.code,
    row.title,
    row.description,
    row.ksa,
    row.version,
    row.status
  ]);
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => 
      row.map(cell => 
        // Escape commas and quotes in CSV
        `"${String(cell).replace(/"/g, '""')}"`
      ).join(',')
    )
  ].join('\n');
  
  return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
}

/**
 * Download CSV template
 */
export function downloadCSVTemplate(filename = 'epa-import-template.csv') {
  const blob = generateCSVTemplate();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

// ============================================================================
// TSV TEMPLATE (Tab-Separated)
// ============================================================================

/**
 * Generate TSV template
 */
export function generateTSVTemplate(): Blob {
  const headers = ['Code', 'Title', 'Description', 'KSA', 'Version', 'Status'];
  
  const rows = SAMPLE_ROWS.map(row => [
    row.code,
    row.title,
    row.description,
    row.ksa,
    row.version,
    row.status
  ]);
  
  const tsvContent = [
    headers.join('\t'),
    ...rows.map(row => row.join('\t'))
  ].join('\n');
  
  return new Blob([tsvContent], { type: 'text/tab-separated-values;charset=utf-8;' });
}

/**
 * Download TSV template
 */
export function downloadTSVTemplate(filename = 'epa-import-template.tsv') {
  const blob = generateTSVTemplate();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

// ============================================================================
// PLAIN TEXT TEMPLATE (Markdown-style)
// ============================================================================

/**
 * Generate plain text template with instructions
 */
export function generateTextTemplate(): Blob {
  const content = `# EPA Import Template

## Instructions
1. Fill in each EPA on a separate row
2. Required fields: Code, Title, Description
3. Optional fields: KSA, Version, Status
4. KSA can be: JSON object OR "Knowledge:...; Skills:...; Attitudes:..."
5. Status must be one of: draft, active, retired

## Template Format (Copy rows below)

Code\tTitle\tDescription\tKSA\tVersion\tStatus
EPA-1.1\tTaking a clinical history\tThe resident will...\tKnowledge:...; Skills:...; Attitudes:...\tv1\tactive
EPA-1.2\tPhysical examination\tThe resident will...\tKnowledge:...; Skills:...; Attitudes:...\tv1\tactive

## Example EPAs

${SAMPLE_ROWS.map(row => `
### ${row.code}: ${row.title}
**Description:** ${row.description}
**KSA:** ${row.ksa}
**Version:** ${row.version}
**Status:** ${row.status}
`).join('\n')}

---
*Save this file as .txt or .tsv and import via Admin Console*
`;
  
  return new Blob([content], { type: 'text/plain;charset=utf-8;' });
}

/**
 * Download text template
 */
export function downloadTextTemplate(filename = 'epa-import-template.txt') {
  const blob = generateTextTemplate();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

// ============================================================================
// TEMPLATE BUTTON COMPONENT HELPER
// ============================================================================

export const TEMPLATE_DOWNLOADS = [
  {
    label: 'CSV Template',
    format: 'csv' as const,
    download: downloadCSVTemplate,
    description: 'Comma-separated values (Excel, Google Sheets)',
  },
  {
    label: 'TSV Template',
    format: 'tsv' as const,
    download: downloadTSVTemplate,
    description: 'Tab-separated values (Excel, plain text)',
  },
  {
    label: 'Text Template',
    format: 'txt' as const,
    download: downloadTextTemplate,
    description: 'Plain text with instructions',
  },
];


