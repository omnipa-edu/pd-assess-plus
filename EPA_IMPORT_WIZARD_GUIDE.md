# EPA Import Wizard - Implementation Guide

**Status:** Not Yet Implemented (Phase 2)  
**Complexity:** High (7 interconnected tasks)  
**Estimated Effort:** 8-12 hours  
**Priority:** Medium (core CRUD functional without it)

---

## 📋 Overview

The EPA Import Wizard is a **5-step multi-format bulk import system** that allows admins to import dozens or hundreds of EPAs from:
- Microsoft Word (.docx)
- Microsoft Excel (.xlsx)
- CSV/TSV files
- Google Docs (via share link)
- Google Sheets (via share link)

---

## 🎯 Remaining Tasks

### **Task 11: Import Wizard UI** (3-4 hours)
Build the 5-step stepper interface.

**Components Needed:**
- `ImportWizard.tsx` - Main wizard container
- `Stepper.tsx` - Progress indicator (Step 1 of 5)
- `StepSource.tsx` - File upload / link paste
- `StepPreview.tsx` - Show parsed rows
- `StepMap.tsx` - Field mapping interface
- `StepValidate.tsx` - Validation results
- `StepCommit.tsx` - Final confirmation & commit

**Route:** `/admin/epas/import`

### **Task 12: File Parsers** (2-3 hours)
Implement parsers for DOCX, XLSX, CSV/TSV.

**Dependencies to Install:**
```bash
npm install mammoth xlsx papaparse
npm install -D @types/papaparse
```

**Files to Create:**
- `src/lib/import/parsers/docx.ts` - Parse Word documents
- `src/lib/import/parsers/xlsx.ts` - Parse Excel spreadsheets
- `src/lib/import/parsers/csv.ts` - Parse CSV/TSV files
- `src/lib/import/normalize.ts` - Convert all formats to standard schema

**Output Schema:**
```typescript
interface ParsedEPARow {
  code: string;
  title: string;
  description: string;
  ksa?: string | object;
  version?: string;
  status?: 'draft' | 'active' | 'retired';
}
```

### **Task 13: Google Integration** (2-3 hours)
Optional: Parse Google Docs and Google Sheets.

**Approach:**
1. **With Service Account:** Use Google Drive/Sheets API
   - Requires `GOOGLE_SERVICE_ACCOUNT_EMAIL` and `GOOGLE_SERVICE_ACCOUNT_KEY`
   - Use Supabase Edge Function for server-side API calls
2. **Without Service Account:** Show fallback instructions
   - "Please download as DOCX/CSV and upload the file"

**Files to Create:**
- `src/lib/import/parsers/gdoc.ts`
- `src/lib/import/parsers/gsheet.ts`
- `supabase/functions/parse-google-doc/index.ts`
- `supabase/functions/parse-google-sheet/index.ts`

### **Task 14: Field Mapper** (1-2 hours)
Build UI for mapping detected columns to EPA fields.

**Component:** `src/components/import/FieldMapper.tsx`

**Features:**
- Drag-and-drop or dropdown mapping
- Auto-detection of common column names
- Save mapping preset for reuse
- Preview mapped data

**Mapping Logic:**
```typescript
interface FieldMapping {
  [detectedColumn: string]: 'code' | 'title' | 'description' | 'ksa' | 'version' | 'status' | null;
}

// Example:
{
  "EPA Code": "code",
  "EPA Title": "title",
  "Description": "description",
  "KSA List": "ksa",
  "Ver": "version",
  "Status": "status"
}
```

**Preset Storage:** Save to `import_mapping_presets` table.

### **Task 15: Validation & De-duplication** (1-2 hours)
Validate rows and handle duplicates.

**File:** `src/lib/import/validation.ts`

**Validation Rules (Zod):**
```typescript
const epaRowSchema = z.object({
  code: z.string().min(2).max(32),
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(5000),
  ksa: z.any().optional(),
  version: z.string().optional().default('v1'),
  status: z.enum(['draft', 'active', 'retired']).optional().default('active')
});
```

**De-duplication Logic:**
- Check (`specialty_id`, `code`) uniqueness
- Options for duplicates:
  1. **Skip:** Don't import duplicate
  2. **Update:** Update existing EPA
  3. **Create New Version:** Auto-increment version (v1 → v2)

**Output:**
```typescript
interface ValidationResult {
  valid: ParsedEPARow[];
  errors: { row: number; message: string }[];
  duplicates: { row: number; existing: EPA; action: 'skip' | 'update' | 'version' }[];
}
```

### **Task 16: Import Commit** (2-3 hours)
Transactional insert with audit logging.

**File:** `src/lib/import/commit.ts`

**Process:**
1. Start Supabase transaction
2. Insert/update EPAs based on de-dupe actions
3. Write audit log with import metadata
4. Return summary: `{ created: number, updated: number, skipped: number, errors: any[] }`
5. On error: rollback transaction

**Audit Metadata:**
```json
{
  "import_id": "uuid",
  "source_file": "epas.xlsx",
  "total_rows": 50,
  "created": 45,
  "updated": 3,
  "skipped": 2
}
```

### **Task 17: Template Downloads** (1-2 hours)
Generate downloadable EPA templates.

**Endpoint:** `/api/admin/templates/epa?format=xlsx|csv|docx`

**Create:** `src/lib/import/templates/`
- `excel.ts` - Generate .xlsx with headers
- `csv.ts` - Generate .csv with headers
- `docx.ts` - Generate .docx with styled table

**Template Headers:**
```
Code | Title | Description | KSA | Version | Status
```

**Example Rows:**
```
EPA-1.1 | Taking a clinical history | The resident will... | Knowledge:...; Skills:...; Attitudes:... | v1 | active
EPA-1.2 | Performing physical exam | The resident will... | Knowledge:...; Skills:...; Attitudes:... | v1 | draft
```

---

## 🔧 Implementation Steps

### Phase 1: Install Dependencies

```bash
npm install mammoth xlsx papaparse
npm install -D @types/papaparse
```

### Phase 2: Build Parsers (Bottom-Up)

1. Create normalization schema
2. Build CSV parser (simplest)
3. Build XLSX parser
4. Build DOCX parser
5. Add Google parsers (optional)

### Phase 3: Build UI (Top-Down)

1. Create Stepper component
2. Build Step 1 (Source selection)
3. Build Step 2 (Preview parsed data)
4. Build Step 3 (Field mapping)
5. Build Step 4 (Validation results)
6. Build Step 5 (Commit confirmation)

### Phase 4: Integration

1. Connect parsers to wizard
2. Add validation logic
3. Implement de-duplication
4. Build transactional commit
5. Add audit logging
6. Create error handling

### Phase 5: Templates

1. Build template generators
2. Create API endpoint
3. Add download buttons to wizard

### Phase 6: Testing

1. Test each parser with sample files
2. Test mapping presets
3. Test validation edge cases
4. Test de-duplication scenarios
5. Test transaction rollback
6. E2E test complete flow

---

## 📦 Required Dependencies

```json
{
  "dependencies": {
    "mammoth": "^1.7.0",      // DOCX parsing
    "xlsx": "^0.18.5",         // Excel parsing
    "papaparse": "^5.4.1",     // CSV parsing
    "zod": "^3.22.0"           // Validation (already installed)
  },
  "devDependencies": {
    "@types/papaparse": "^5.3.0"
  }
}
```

**Optional (Google Integration):**
```json
{
  "dependencies": {
    "googleapis": "^128.0.0"   // Google Drive/Sheets API
  }
}
```

---

## 🎨 UI/UX Mockup

### Step 1: Source Selection
```
┌─────────────────────────────────────┐
│ Import EPAs - Step 1 of 5          │
├─────────────────────────────────────┤
│ Choose Import Source:               │
│                                     │
│ ┌─────────────────────────────────┐│
│ │ 📁 Upload File                  ││
│ │                                 ││
│ │ Drag & drop or click to browse ││
│ │ Supports: .docx, .xlsx, .csv   ││
│ └─────────────────────────────────┘│
│                                     │
│ ┌─────────────────────────────────┐│
│ │ 🔗 Paste Google Link            ││
│ │                                 ││
│ │ [___________________________]   ││
│ │ Google Docs or Sheets share URL ││
│ └─────────────────────────────────┘│
│                                     │
│ 📥 Download Templates:              │
│ [Excel] [CSV] [Word]                │
│                                     │
│         [Cancel] [Next →]           │
└─────────────────────────────────────┘
```

### Step 2: Preview
```
┌─────────────────────────────────────┐
│ Import EPAs - Step 2 of 5          │
├─────────────────────────────────────┤
│ Parsed 50 rows from epas.xlsx       │
│                                     │
│ Select Specialty: [Internal Med ▼] │
│                                     │
│ Code     │ Title       │ Desc...    │
│──────────┼─────────────┼──────────  │
│ EPA-1.1  │ History...  │ The...     │
│ EPA-1.2  │ Physical... │ The...     │
│ ...                                 │
│                                     │
│    [← Back] [Cancel] [Next →]       │
└─────────────────────────────────────┘
```

### Step 3: Map Fields
```
┌─────────────────────────────────────┐
│ Import EPAs - Step 3 of 5          │
├─────────────────────────────────────┤
│ Map Columns to EPA Fields:          │
│                                     │
│ Detected Column    → EPA Field      │
│ ─────────────────────────────────   │
│ EPA Code           → Code ✓         │
│ EPA Title          → Title ✓        │
│ Description        → Description ✓  │
│ KSA List           → KSA ✓          │
│ Ver                → Version ✓      │
│ Status             → Status ✓       │
│                                     │
│ ☑ Save as preset "Internal Med"    │
│                                     │
│    [← Back] [Cancel] [Next →]       │
└─────────────────────────────────────┘
```

### Step 4: Validate
```
┌─────────────────────────────────────┐
│ Import EPAs - Step 4 of 5          │
├─────────────────────────────────────┤
│ Validation Results:                 │
│                                     │
│ ✅ 45 Valid rows                    │
│ ⚠️  3 Duplicates found              │
│ ❌ 2 Errors                          │
│                                     │
│ Duplicates:                         │
│ Row 12: EPA-1.1 exists              │
│  ○ Skip  ○ Update  ● New Version   │
│                                     │
│ Errors:                             │
│ Row 48: Missing title               │
│ Row 49: Code too short (1 char)     │
│                                     │
│    [← Back] [Fix Errors] [Next →]   │
└─────────────────────────────────────┘
```

### Step 5: Commit
```
┌─────────────────────────────────────┐
│ Import EPAs - Step 5 of 5          │
├─────────────────────────────────────┤
│ Ready to Import:                    │
│                                     │
│ Specialty: Internal Medicine        │
│                                     │
│ Summary:                            │
│ • 45 EPAs to create                 │
│ • 3 EPAs to update (new versions)   │
│ • 2 rows to skip (errors)           │
│                                     │
│ ⚠️  This action cannot be undone.   │
│ (but audit log will preserve data)  │
│                                     │
│    [← Back] [Cancel] [Import →]     │
└─────────────────────────────────────┘
```

---

## 🔨 Technical Architecture

### Parser Architecture

```typescript
// Base interface
interface IParser {
  canParse(file: File | string): boolean;
  parse(input: File | string): Promise<ParsedEPARow[]>;
}

// Implementations
class DOCXParser implements IParser { ... }
class XLSXParser implements IParser { ... }
class CSVParser implements IParser { ... }
class GoogleDocsParser implements IParser { ... }
class GoogleSheetsParser implements IParser { ... }
```

### Normalization Strategy

```typescript
// Flexible header detection
const HEADER_MAPPINGS = {
  code: ['code', 'epa code', 'epa_code', 'epa id', 'id'],
  title: ['title', 'name', 'epa title', 'epa_name'],
  description: ['description', 'desc', 'details', 'summary'],
  ksa: ['ksa', 'competencies', 'knowledge skills attitudes'],
  version: ['version', 'ver', 'v'],
  status: ['status', 'state', 'active']
};

function normalizeHeaders(detected: string[]): FieldMapping {
  // Case-insensitive matching
  // Return mapping object
}
```

### Validation Flow

```typescript
async function validateImport(
  rows: ParsedEPARow[],
  specialtyId: string
): Promise<ValidationResult> {
  // 1. Zod schema validation
  const validRows = rows.filter(row => epaRowSchema.safeParse(row).success);
  
  // 2. Check for duplicates
  const existing = await getExistingEPAs(specialtyId);
  const duplicates = findDuplicates(validRows, existing);
  
  // 3. Return categorized results
  return { valid, errors, duplicates };
}
```

### De-duplication Options

```typescript
type DedupeAction = 'skip' | 'update' | 'version';

interface DedupeChoice {
  rowIndex: number;
  existing: EPA;
  action: DedupeAction;
  newVersion?: string; // if action === 'version'
}

// UI allows per-row selection or bulk choice
```

### Transaction Commit

```typescript
async function commitImport(
  rows: ParsedEPARow[],
  specialtyId: string,
  dedupeChoices: DedupeChoice[]
): Promise<ImportResult> {
  const { data, error } = await supabase.rpc('import_epas_transaction', {
    specialty_id: specialtyId,
    rows: rows,
    dedupe_choices: dedupeChoices
  });
  
  // Audit log with metadata
  await writeAudit({
    action: 'import',
    entity: 'epas',
    entityId: specialtyId,
    metadata: {
      total_rows: rows.length,
      created: data.created,
      updated: data.updated,
      skipped: data.skipped
    }
  });
  
  return data;
}
```

---

## 📄 Template Generation

### Excel Template (.xlsx)

```typescript
import XLSX from 'xlsx';

function generateExcelTemplate(): Blob {
  const data = [
    ['Code', 'Title', 'Description', 'KSA', 'Version', 'Status'],
    ['EPA-1.1', 'Sample EPA Title', 'Detailed description...', 'Knowledge:...; Skills:...; Attitudes:...', 'v1', 'active'],
    ['EPA-1.2', 'Another EPA', 'Another description...', 'Knowledge:...; Skills:...; Attitudes:...', 'v1', 'draft']
  ];
  
  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'EPAs');
  
  const wbout = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  return new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}
```

### CSV Template

```typescript
import Papa from 'papaparse';

function generateCSVTemplate(): Blob {
  const data = [
    ['Code', 'Title', 'Description', 'KSA', 'Version', 'Status'],
    ['EPA-1.1', 'Sample EPA Title', 'Detailed description...', 'Knowledge:...; Skills:...; Attitudes:...', 'v1', 'active']
  ];
  
  const csv = Papa.unparse(data);
  return new Blob([csv], { type: 'text/csv' });
}
```

### Word Template (.docx)

```typescript
// Use a template .docx file with placeholders
// Or generate from scratch using docx library
import { Document, Packer, Paragraph, Table, TableRow, TableCell } from 'docx';

function generateWordTemplate(): Blob {
  const doc = new Document({
    sections: [{
      children: [
        new Paragraph({ text: 'EPA Import Template', heading: 'Heading1' }),
        new Table({
          rows: [
            new TableRow({ children: [ /* headers */ ] }),
            new TableRow({ children: [ /* example row */ ] })
          ]
        })
      ]
    }]
  });
  
  return Packer.toBlob(doc);
}
```

---

## 🧪 Testing Strategy

### Unit Tests (Vitest)

```typescript
describe('CSV Parser', () => {
  it('parses valid CSV with headers', async () => {
    const csv = 'Code,Title,Description\nEPA-1,Test,Desc';
    const result = await parseCSV(csv);
    expect(result).toHaveLength(1);
    expect(result[0].code).toBe('EPA-1');
  });
});

describe('Normalization', () => {
  it('maps variant headers to canonical fields', () => {
    const headers = ['epa code', 'EPA Title', 'desc'];
    const mapping = normalizeHeaders(headers);
    expect(mapping['epa code']).toBe('code');
  });
});

describe('Validation', () => {
  it('catches missing required fields', () => {
    const row = { code: 'EPA-1' }; // missing title, description
    const result = epaRowSchema.safeParse(row);
    expect(result.success).toBe(false);
  });
});

describe('De-duplication', () => {
  it('detects duplicates by code', async () => {
    const rows = [{ code: 'EPA-1', ... }];
    const existing = [{ code: 'EPA-1', ... }];
    const duplicates = findDuplicates(rows, existing);
    expect(duplicates).toHaveLength(1);
  });
});
```

### E2E Tests (Playwright)

```typescript
test('Import CSV workflow', async ({ page }) => {
  // 1. Navigate to import page
  await page.goto('/admin/epas/import');
  
  // 2. Upload CSV file
  await page.setInputFiles('input[type="file"]', 'sample-epas.csv');
  
  // 3. Select specialty
  await page.selectOption('select', 'Internal Medicine');
  await page.click('text=Next');
  
  // 4. Preview shows parsed rows
  await expect(page.locator('table')).toBeVisible();
  await page.click('text=Next');
  
  // 5. Field mapping auto-detected
  await expect(page.locator('text=Code ✓')).toBeVisible();
  await page.click('text=Next');
  
  // 6. Validation passes
  await expect(page.locator('text=✅ 10 Valid rows')).toBeVisible();
  await page.click('text=Next');
  
  // 7. Commit import
  await page.click('text=Import');
  await expect(page.locator('text=Success')).toBeVisible();
  
  // 8. Verify EPAs created
  await page.goto('/admin/epas');
  // ... verify count increased
});
```

---

## 🔒 Security Considerations

### File Upload Safety
1. **File size limits:** Max 10MB
2. **MIME type validation:** Only allowed formats
3. **Virus scanning:** Consider ClamAV integration
4. **Temporary storage:** Auto-delete after 24 hours
5. **No PHI:** EPAs are metadata, not patient data

### Google API
1. **Service account:** Use least-privilege scope
2. **Rate limiting:** Respect API quotas
3. **Fallback:** Always provide download instructions
4. **Timeout:** 30-second max for API calls

### Transaction Safety
1. **Atomic commits:** All-or-nothing imports
2. **Rollback on error:** No partial imports
3. **Audit logging:** Track all import attempts
4. **De-dupe confirmation:** Prevent accidental overwrites

---

## 📊 Estimated Complexity

| Task | Effort | Complexity | Dependencies |
|------|--------|------------|--------------|
| Import UI | 3-4h | Medium | Stepper component |
| Parsers (DOCX/XLSX/CSV) | 2-3h | Medium | mammoth, xlsx, papaparse |
| Google Integration | 2-3h | High | googleapis, service account |
| Field Mapper | 1-2h | Medium | Drag-drop or select UI |
| Validation | 1-2h | Low | Zod schemas |
| Import Commit | 2-3h | Medium | Supabase RPC, transactions |
| Templates | 1-2h | Low | docx, xlsx libraries |
| **TOTAL** | **12-19h** | **Medium-High** | **7 packages** |

---

## 💡 Simplification Options

### MVP (Minimum Viable Product)

**Phase 1:** CSV-only import (simplest)
- Only CSV/TSV parsing (no DOCX/Excel)
- No Google integration
- Manual field mapping (no auto-detection)
- Simple validation (no de-dupe)
- Reduces effort to **3-4 hours**

**Phase 2:** Add Excel support
- Add XLSX parser
- Keep CSV workflow
- Adds **1-2 hours**

**Phase 3:** Add Word support
- Add DOCX parser
- Adds **1-2 hours**

**Phase 4:** Full features
- Google integration
- Smart field mapping
- Advanced de-dupe
- Adds **4-6 hours**

---

## 📚 Resources

### Libraries Documentation
- **mammoth:** https://www.npmjs.com/package/mammoth
- **xlsx:** https://docs.sheetjs.com/
- **papaparse:** https://www.papaparse.com/
- **googleapis:** https://github.com/googleapis/google-api-nodejs-client

### Example Code
- **DOCX parsing:** See `mammoth` examples for table extraction
- **Excel parsing:** Use `XLSX.utils.sheet_to_json()` for headers
- **CSV parsing:** `Papa.parse()` with `header: true`

### Supabase Functions
- **Edge Functions:** For Google API integration (server-side)
- **RPC Functions:** For transactional imports
- **Storage:** For temporary file storage

---

## ✅ Definition of Done

### For Each Parser:
- [ ] Parses sample file correctly
- [ ] Handles malformed input gracefully
- [ ] Returns normalized schema
- [ ] Unit tests pass
- [ ] Error messages are user-friendly

### For Wizard:
- [ ] 5 steps all functional
- [ ] Can go back/forward
- [ ] State persists between steps
- [ ] Cancel clears all state
- [ ] Success redirects to EPA list

### For Complete Feature:
- [ ] End-to-end test passes
- [ ] Templates download correctly
- [ ] Audit logging works
- [ ] Documentation complete
- [ ] No console errors
- [ ] Mobile responsive
- [ ] Dark mode works

---

*This is a comprehensive guide for implementing the EPA Import Wizard in Phase 2.*
*Current admin console (55% complete) is fully functional without it.*

**Priority:** **Medium** (nice-to-have, not critical)  
**Effort:** **12-19 hours** (depending on scope)  
**Dependencies:** **7 npm packages**


