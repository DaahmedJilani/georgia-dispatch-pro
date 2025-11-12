import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Upload, Download, CheckCircle2, XCircle, AlertCircle, FileSpreadsheet } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface BulkImportDialogProps {
  onSuccess?: () => void;
}

export const BulkImportDialog = ({ onSuccess }: BulkImportDialogProps) => {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'complete'>('upload');
  const { toast } = useToast();

  const downloadTemplate = () => {
    const template = `Carrier Name,MC Number,DOT Number,Address,Contact Name,Contact Email,Phone,Insurance Expiry,Preferred Routes,Notes
ABC Logistics,MC12345,DOT9876,123 Main St Dallas TX,John Doe,john@abc.com,555-555-5555,2025-12-31,TX-OK-AR,Hazmat certified
XYZ Transport,MC67890,DOT5432,456 Oak Ave Houston TX,Jane Smith,jane@xyz.com,555-123-4567,2025-11-30,TX-LA-MS,Flatbed specialist`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'carrier_import_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "File size must be less than 5MB",
          variant: "destructive"
        });
        return;
      }
      setFile(selectedFile);
      parseCSV(selectedFile);
    }
  };

  const parseCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        toast({
          title: "Error",
          description: "CSV file must contain at least a header and one data row",
          variant: "destructive"
        });
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim());
      const data = lines.slice(1).map((line, index) => {
        const values = line.split(',').map(v => v.trim());
        const row: any = { rowNumber: index + 2 };
        headers.forEach((header, i) => {
          const key = header.toLowerCase().replace(/ /g, '_');
          row[key] = values[i] || '';
        });
        
        // Validate required fields
        row.valid = !!row.carrier_name;
        row.error = !row.carrier_name ? 'Carrier name is required' : null;
        
        return row;
      });

      if (data.length > 1000) {
        toast({
          title: "Error",
          description: "Maximum 1000 carriers per import",
          variant: "destructive"
        });
        return;
      }

      setParsedData(data);
      setStep('preview');
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    try {
      setImporting(true);
      setStep('importing');

      const validCarriers = parsedData.filter(row => row.valid);
      const carriers = validCarriers.map(row => ({
        name: row.carrier_name,
        mc_number: row.mc_number || null,
        dot_number: row.dot_number || null,
        address: row.address || null,
        contact_name: row.contact_name || null,
        contact_email: row.contact_email || null,
        phone: row.phone || null,
        insurance_expiry: row.insurance_expiry || null,
        preferred_routes: row.preferred_routes || null,
        notes: row.notes || null
      }));

      const { data, error } = await supabase.functions.invoke('bulk-import-carriers', {
        body: { carriers }
      });

      if (error) throw error;

      setResults(data);
      setStep('complete');
      
      toast({
        title: "Import Complete",
        description: `${data.summary.successful} carriers imported successfully`
      });

      if (data.summary.successful > 0 && onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Import error:', error);
      toast({
        title: "Import Failed",
        description: error.message,
        variant: "destructive"
      });
      setStep('preview');
    } finally {
      setImporting(false);
    }
  };

  const resetDialog = () => {
    setFile(null);
    setParsedData([]);
    setResults(null);
    setStep('upload');
  };

  const validCount = parsedData.filter(row => row.valid).length;
  const invalidCount = parsedData.filter(row => !row.valid).length;

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen);
      if (!newOpen) resetDialog();
    }}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="h-4 w-4 mr-2" />
          Bulk Import
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Import Carriers</DialogTitle>
          <DialogDescription>
            Import multiple carriers from a CSV file
          </DialogDescription>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-4">
            <Alert>
              <FileSpreadsheet className="h-4 w-4" />
              <AlertDescription>
                Download the CSV template, fill it with your carrier data, and upload it here.
                Maximum 1000 carriers per import.
              </AlertDescription>
            </Alert>

            <Button onClick={downloadTemplate} variant="outline" className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Download CSV Template
            </Button>

            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <Input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="csv-upload"
              />
              <label htmlFor="csv-upload" className="cursor-pointer">
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm font-medium">Click to upload CSV file</p>
                <p className="text-xs text-muted-foreground mt-1">Maximum file size: 5MB</p>
              </label>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{parsedData.length}</p>
                    <p className="text-sm text-muted-foreground">Total Rows</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{validCount}</p>
                    <p className="text-sm text-muted-foreground">Valid</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">{invalidCount}</p>
                    <p className="text-sm text-muted-foreground">Invalid</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="border rounded-lg max-h-96 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Row</TableHead>
                    <TableHead>Carrier Name</TableHead>
                    <TableHead>MC Number</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead className="w-24">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedData.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell>{row.rowNumber}</TableCell>
                      <TableCell>{row.carrier_name}</TableCell>
                      <TableCell>{row.mc_number || 'N/A'}</TableCell>
                      <TableCell>{row.contact_email || 'N/A'}</TableCell>
                      <TableCell>
                        {row.valid ? (
                          <Badge variant="default" className="gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Valid
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="gap-1">
                            <XCircle className="h-3 w-3" />
                            Error
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {invalidCount > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {invalidCount} row(s) have validation errors and will be skipped
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button onClick={resetDialog} variant="outline" className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={handleImport} 
                disabled={validCount === 0 || importing}
                className="flex-1"
              >
                Import {validCount} Carrier(s)
              </Button>
            </div>
          </div>
        )}

        {step === 'importing' && (
          <div className="space-y-4 py-8">
            <div className="text-center">
              <p className="text-lg font-medium mb-4">Importing carriers...</p>
              <Progress value={undefined} className="w-full" />
            </div>
          </div>
        )}

        {step === 'complete' && results && (
          <div className="space-y-4">
            <Alert className="bg-green-500/10 border-green-500">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-600">
                Import completed successfully!
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{results.summary.total}</p>
                    <p className="text-sm text-muted-foreground">Total</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{results.summary.successful}</p>
                    <p className="text-sm text-muted-foreground">Successful</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">{results.summary.failed}</p>
                    <p className="text-sm text-muted-foreground">Failed</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {results.summary.failed > 0 && (
              <div className="border rounded-lg max-h-64 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Row</TableHead>
                      <TableHead>Error</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.results
                      .filter((r: any) => r.status === 'error')
                      .map((r: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell>{r.row}</TableCell>
                          <TableCell className="text-red-600">{r.error}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            )}

            <Button onClick={() => {
              resetDialog();
              setOpen(false);
            }} className="w-full">
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
