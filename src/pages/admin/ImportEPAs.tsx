/**
 * Import EPAs Page
 * Simplified CSV/TSV import wizard for bulk EPA import
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, CheckCircle, AlertCircle, Download } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ProtectedAdminRoute } from '@/components/admin/ProtectedAdminRoute';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { parseFile, ParseResult } from '@/lib/import/parsers/csv';
import { validateImport, ValidationResult, DedupeChoice } from '@/lib/import/validation';
import { commitEPAImport } from '@/lib/import/commit';
import { TEMPLATE_DOWNLOADS } from '@/lib/import/templates';

type Step = 'upload' | 'preview' | 'validate' | 'commit' | 'complete';

interface Specialty {
  id: string;
  name: string;
  code: string;
}

const ImportEPAs = () => {
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('');
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [dedupeChoices, setDedupeChoices] = useState<Map<number, DedupeChoice>>(new Map());
  const [importing, setImporting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Load specialties on mount
  useEffect(() => {
    loadSpecialties();
  }, []);

  const loadSpecialties = async () => {
    const { data } = await supabase
      .from('specialties')
      .select('id, name, code')
      .eq('is_active', true)
      .order('name');
    
    setSpecialties(data || []);
    if (data && data.length > 0) {
      setSelectedSpecialty(data[0].id);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    try {
      setFile(selectedFile);
      
      // Parse file
      const result = await parseFile(selectedFile);
      
      if (result.errors.length > 0) {
        toast({
          title: 'Parse Errors',
          description: result.errors.join('; '),
          variant: 'destructive',
        });
        return;
      }

      setParseResult(result);
      setStep('preview');
      
      toast({
        title: 'File Parsed',
        description: `Successfully parsed ${result.rows.length} rows`,
      });
    } catch (error: any) {
      console.error('Error parsing file:', error);
      toast({
        title: 'Parse Error',
        description: error.message || 'Failed to parse file',
        variant: 'destructive',
      });
    }
  };

  const handleValidate = async () => {
    if (!parseResult || !selectedSpecialty) return;

    try {
      const result = await validateImport(parseResult.rows, selectedSpecialty);
      setValidationResult(result);
      
      // Initialize default dedupe choices (skip all)
      const choices = new Map<number, DedupeChoice>();
      result.duplicates.forEach(dup => {
        choices.set(dup.row - 1, {
          row: dup.row,
          code: dup.code,
          action: 'skip',
        });
      });
      setDedupeChoices(choices);
      
      setStep('validate');
      
      toast({
        title: 'Validation Complete',
        description: `${result.validCount} valid, ${result.errorCount} errors, ${result.duplicateCount} duplicates`,
      });
    } catch (error: any) {
      console.error('Error validating:', error);
      toast({
        title: 'Validation Error',
        description: error.message || 'Failed to validate rows',
        variant: 'destructive',
      });
    }
  };

  const handleImport = async () => {
    if (!validationResult || !selectedSpecialty) return;

    setImporting(true);
    try {
      const result = await commitEPAImport(
        validationResult.valid,
        selectedSpecialty,
        dedupeChoices
      );

      if (result.success) {
        setStep('complete');
        toast({
          title: 'Import Successful',
          description: `Created: ${result.created}, Updated: ${result.updated}, Skipped: ${result.skipped}`,
        });
      } else {
        toast({
          title: 'Import Errors',
          description: result.errors.join('; '),
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Error importing:', error);
      toast({
        title: 'Import Failed',
        description: error.message || 'Failed to import EPAs',
        variant: 'destructive',
      });
    } finally {
      setImporting(false);
    }
  };

  const setDedupeChoice = (rowIndex: number, action: 'skip' | 'update' | 'create_version', newVersion?: string) => {
    const duplicate = validationResult?.duplicates.find(d => d.row - 1 === rowIndex);
    if (!duplicate) return;

    const newChoices = new Map(dedupeChoices);
    newChoices.set(rowIndex, {
      row: duplicate.row,
      code: duplicate.code,
      action,
      newVersion,
    });
    setDedupeChoices(newChoices);
  };

  return (
    <ProtectedAdminRoute>
      <AdminLayout>
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-foreground">Import EPAs</h1>
            <p className="mt-2 text-muted-foreground">
              Bulk import EPAs from CSV or TSV files
            </p>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-2">
            {(['upload', 'preview', 'validate', 'commit'] as const).map((s, index) => (
              <div key={s} className="flex items-center">
                {index > 0 && <div className={`h-0.5 w-8 ${step === s || (['preview', 'validate', 'commit', 'complete'].includes(step) && index <= 3) ? 'bg-primary' : 'bg-muted'}`} />}
                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${step === s ? 'bg-primary text-primary-foreground' : (['preview', 'validate', 'commit', 'complete'].includes(step) && index <= 3) ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                  {index + 1}
                </div>
              </div>
            ))}
          </div>

          {/* Step 1: Upload */}
          {step === 'upload' && (
            <Card>
              <CardHeader>
                <CardTitle>Step 1: Upload File</CardTitle>
                <CardDescription>
                  Upload a CSV or TSV file containing EPA data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Template Downloads */}
                <div className="rounded-lg border bg-muted/50 p-4">
                  <h3 className="mb-3 font-semibold">Download Templates:</h3>
                  <div className="flex flex-wrap gap-2">
                    {TEMPLATE_DOWNLOADS.map(template => (
                      <Button
                        key={template.format}
                        variant="outline"
                        size="sm"
                        onClick={() => template.download()}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        {template.label}
                      </Button>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Download a template to see the required format
                  </p>
                </div>

                {/* File Upload */}
                <div>
                  <Label htmlFor="file-upload">Select File:</Label>
                  <div className="mt-2">
                    <input
                      id="file-upload"
                      type="file"
                      accept=".csv,.tsv,.txt"
                      onChange={handleFileSelect}
                      className="block w-full text-sm text-muted-foreground file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
                    />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Supported: .csv, .tsv files
                  </p>
                </div>

                {file && (
                  <div className="rounded-lg border bg-green-50 p-3 dark:bg-green-900/20">
                    <p className="text-sm font-medium text-green-900 dark:text-green-100">
                      ✓ File selected: {file.name}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 2: Preview */}
          {step === 'preview' && parseResult && (
            <Card>
              <CardHeader>
                <CardTitle>Step 2: Preview & Select Specialty</CardTitle>
                <CardDescription>
                  Parsed {parseResult.rows.length} rows from {file?.name}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="specialty">Assign to Specialty:</Label>
                  <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
                    <SelectTrigger id="specialty">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {specialties.map(spec => (
                        <SelectItem key={spec.id} value={spec.id}>
                          {spec.name} ({spec.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Preview Table */}
                <div className="overflow-x-auto rounded-md border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="p-2 text-left">Code</th>
                        <th className="p-2 text-left">Title</th>
                        <th className="p-2 text-left">Description</th>
                        <th className="p-2 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parseResult.rows.slice(0, 5).map((row, index) => (
                        <tr key={index} className="border-t">
                          <td className="p-2 font-mono">{row.code}</td>
                          <td className="p-2">{row.title}</td>
                          <td className="p-2 text-muted-foreground">{row.description?.substring(0, 50)}...</td>
                          <td className="p-2">
                            <Badge variant="secondary">{row.status || 'active'}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {parseResult.rows.length > 5 && (
                  <p className="text-center text-sm text-muted-foreground">
                    ... and {parseResult.rows.length - 5} more rows
                  </p>
                )}

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep('upload')}>
                    ← Back
                  </Button>
                  <Button onClick={handleValidate}>
                    Next: Validate →
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Validate */}
          {step === 'validate' && validationResult && (
            <Card>
              <CardHeader>
                <CardTitle>Step 3: Validation Results</CardTitle>
                <CardDescription>
                  Review and resolve any issues before importing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Summary */}
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-lg border bg-green-50 p-4 dark:bg-green-900/20">
                    <div className="text-2xl font-bold text-green-700 dark:text-green-400">
                      {validationResult.validCount}
                    </div>
                    <p className="text-sm text-green-600 dark:text-green-300">Valid Rows</p>
                  </div>
                  <div className="rounded-lg border bg-orange-50 p-4 dark:bg-orange-900/20">
                    <div className="text-2xl font-bold text-orange-700 dark:text-orange-400">
                      {validationResult.duplicateCount}
                    </div>
                    <p className="text-sm text-orange-600 dark:text-orange-300">Duplicates</p>
                  </div>
                  <div className="rounded-lg border bg-red-50 p-4 dark:bg-red-900/20">
                    <div className="text-2xl font-bold text-red-700 dark:text-red-400">
                      {validationResult.errorCount}
                    </div>
                    <p className="text-sm text-red-600 dark:text-red-300">Errors</p>
                  </div>
                </div>

                {/* Errors */}
                {validationResult.errors.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-semibold text-red-700 dark:text-red-400">
                      <AlertCircle className="mr-2 inline h-4 w-4" />
                      Errors ({validationResult.errors.length})
                    </h3>
                    <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-900/20">
                      {validationResult.errors.slice(0, 10).map((error, index) => (
                        <p key={index} className="text-sm text-red-800 dark:text-red-200">
                          Row {error.row}: {error.message}
                        </p>
                      ))}
                      {validationResult.errors.length > 10 && (
                        <p className="text-sm italic text-red-600">
                          ... and {validationResult.errors.length - 10} more errors
                        </p>
                      )}
                    </div>
                    <p className="text-sm text-red-600 dark:text-red-400">
                      Please fix errors in your file before importing
                    </p>
                  </div>
                )}

                {/* Duplicates */}
                {validationResult.duplicates.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-orange-700 dark:text-orange-400">
                      Duplicate EPAs ({validationResult.duplicates.length})
                    </h3>
                    <div className="space-y-3">
                      {validationResult.duplicates.map((dup) => {
                        const choice = dedupeChoices.get(dup.row - 1);
                        return (
                          <div
                            key={dup.row}
                            className="rounded-md border bg-card p-4"
                          >
                            <div className="mb-2 flex items-center gap-2">
                              <Badge variant="outline" className="font-mono">
                                {dup.code}
                              </Badge>
                              <span className="text-sm">
                                Row {dup.row} - Already exists (version: {dup.existingVersion})
                              </span>
                            </div>
                            <RadioGroup
                              value={choice?.action || 'skip'}
                              onValueChange={(value) =>
                                setDedupeChoice(
                                  dup.row - 1,
                                  value as 'skip' | 'update' | 'create_version',
                                  dup.suggestedVersion
                                )
                              }
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="skip" id={`skip-${dup.row}`} />
                                <Label htmlFor={`skip-${dup.row}`}>Skip this row</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="update" id={`update-${dup.row}`} />
                                <Label htmlFor={`update-${dup.row}`}>
                                  Update existing EPA
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="create_version" id={`version-${dup.row}`} />
                                <Label htmlFor={`version-${dup.row}`}>
                                  Create new version ({dup.suggestedVersion})
                                </Label>
                              </div>
                            </RadioGroup>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep('preview')}>
                    ← Back
                  </Button>
                  <Button
                    onClick={() => setStep('commit')}
                    disabled={validationResult.errorCount > 0}
                  >
                    {validationResult.errorCount > 0
                      ? 'Fix Errors First'
                      : 'Next: Review →'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Commit Confirmation */}
          {step === 'commit' && validationResult && (
            <Card>
              <CardHeader>
                <CardTitle>Step 4: Confirm Import</CardTitle>
                <CardDescription>
                  Review the import summary before committing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Specialty */}
                <div className="rounded-lg bg-muted p-4">
                  <Label className="text-xs text-muted-foreground">Importing to:</Label>
                  <p className="text-lg font-semibold">
                    {specialties.find(s => s.id === selectedSpecialty)?.name}
                  </p>
                </div>

                {/* Summary */}
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-lg border p-4">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {validationResult.valid.filter((_, i) =>
                        !validationResult.duplicates.find(d => d.row - 1 === i) ||
                        dedupeChoices.get(i)?.action !== 'skip'
                      ).length}
                    </div>
                    <p className="text-sm text-muted-foreground">To Create/Update</p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {Array.from(dedupeChoices.values()).filter(c => c.action === 'skip').length}
                    </div>
                    <p className="text-sm text-muted-foreground">To Skip</p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {Array.from(dedupeChoices.values()).filter(c => c.action === 'create_version').length}
                    </div>
                    <p className="text-sm text-muted-foreground">New Versions</p>
                  </div>
                </div>

                {/* Warning */}
                <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900/50 dark:bg-yellow-900/20">
                  <p className="text-sm text-yellow-900 dark:text-yellow-100">
                    ⚠️ This action cannot be undone. All changes will be logged in the activity log.
                  </p>
                </div>

                {/* Actions */}
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep('validate')}>
                    ← Back
                  </Button>
                  <Button onClick={handleImport} disabled={importing}>
                    {importing ? 'Importing...' : 'Import EPAs →'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 5: Complete */}
          {step === 'complete' && (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle className="mx-auto h-16 w-16 text-green-600 dark:text-green-400" />
                <h2 className="mt-4 text-2xl font-bold">Import Complete!</h2>
                <p className="mt-2 text-muted-foreground">
                  EPAs have been successfully imported
                </p>
                <div className="mt-6 flex justify-center gap-3">
                  <Button onClick={() => navigate('/admin/epas')}>
                    View EPAs
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setStep('upload');
                      setFile(null);
                      setParseResult(null);
                      setValidationResult(null);
                      setDedupeChoices(new Map());
                    }}
                  >
                    Import More
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </AdminLayout>
    </ProtectedAdminRoute>
  );
};

export default ImportEPAs;


