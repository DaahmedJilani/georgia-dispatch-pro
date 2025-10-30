import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, Check, X, Loader2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface ContractTemplate {
  id: string;
  name: string;
  version: number;
  file_name: string;
  is_active: boolean;
  created_at: string;
  document_url: string;
}

export const ContractTemplateManager = () => {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [templateName, setTemplateName] = useState('');

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('contract_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error: any) {
      console.error('Error fetching templates:', error);
      toast({
        title: 'Error',
        description: 'Failed to load contract templates',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast({
          title: 'Invalid File',
          description: 'Please select a PDF file',
          variant: 'destructive',
        });
        return;
      }
      setSelectedFile(file);
      if (!templateName) {
        setTemplateName(file.name.replace('.pdf', ''));
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !templateName) {
      toast({
        title: 'Missing Information',
        description: 'Please provide a template name and select a file',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('user_id', user.id)
        .single();

      if (!profile?.company_id) throw new Error('Company not found');

      // Upload file to storage
      const fileName = `${profile.company_id}/${Date.now()}-${selectedFile.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('contract-templates')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('contract-templates')
        .getPublicUrl(fileName);

      // Get next version number
      const { data: existingTemplates } = await supabase
        .from('contract_templates')
        .select('version')
        .eq('company_id', profile.company_id)
        .eq('name', templateName)
        .order('version', { ascending: false })
        .limit(1);

      const nextVersion = existingTemplates && existingTemplates.length > 0
        ? existingTemplates[0].version + 1
        : 1;

      // Create template record
      const { error: insertError } = await supabase
        .from('contract_templates')
        .insert({
          company_id: profile.company_id,
          name: templateName,
          version: nextVersion,
          file_name: selectedFile.name,
          document_url: urlData.publicUrl,
          is_active: true,
          created_by: user.id,
        });

      if (insertError) throw insertError;

      toast({
        title: 'Success',
        description: 'Contract template uploaded successfully',
      });

      setSelectedFile(null);
      setTemplateName('');
      fetchTemplates();
    } catch (error: any) {
      console.error('Error uploading template:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to upload template',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const toggleActiveStatus = async (templateId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('contract_templates')
        .update({ is_active: !currentStatus })
        .eq('id', templateId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Template ${!currentStatus ? 'activated' : 'deactivated'}`,
      });

      fetchTemplates();
    } catch (error: any) {
      console.error('Error updating template:', error);
      toast({
        title: 'Error',
        description: 'Failed to update template status',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Upload New Contract Template</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="template-name">Template Name</Label>
            <Input
              id="template-name"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="e.g., Carrier Agreement"
            />
          </div>
          <div>
            <Label htmlFor="file-upload">Contract PDF</Label>
            <div className="flex gap-2">
              <Input
                id="file-upload"
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
              />
              {selectedFile && (
                <Badge variant="secondary">
                  <FileText className="h-3 w-3 mr-1" />
                  {selectedFile.name}
                </Badge>
              )}
            </div>
          </div>
          <Button onClick={handleUpload} disabled={uploading || !selectedFile || !templateName}>
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload Template
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contract Templates</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Template Name</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>File Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No templates uploaded yet
                  </TableCell>
                </TableRow>
              ) : (
                templates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium">{template.name}</TableCell>
                    <TableCell>v{template.version}</TableCell>
                    <TableCell>{template.file_name}</TableCell>
                    <TableCell>
                      {template.is_active ? (
                        <Badge variant="default" className="bg-green-600">
                          <Check className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <X className="h-3 w-3 mr-1" />
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{new Date(template.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(template.document_url, '_blank')}
                        >
                          View
                        </Button>
                        <Button
                          variant={template.is_active ? 'ghost' : 'default'}
                          size="sm"
                          onClick={() => toggleActiveStatus(template.id, template.is_active)}
                        >
                          {template.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
