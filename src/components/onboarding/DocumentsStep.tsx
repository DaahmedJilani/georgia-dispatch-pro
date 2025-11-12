import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, FileText, CheckCircle } from 'lucide-react';
import { uploadFile } from '@/utils/fileUpload';
import { useToast } from '@/hooks/use-toast';

interface Attachment {
  attachment_type: string;
  file_name: string;
  file_url: string;
  file_size?: number;
}

interface DocumentsStepProps {
  attachments: Attachment[];
  companyId: string;
  onAttachmentAdd: (attachment: Attachment) => void;
}

export const DocumentsStep = ({ attachments, companyId, onAttachmentAdd }: DocumentsStepProps) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState<{ [key: string]: boolean }>({});

  const handleFileUpload = async (type: string, file: File) => {
    setUploading({ ...uploading, [type]: true });
    try {
      const result = await uploadFile(file, `carrier-documents/${companyId}`);
      onAttachmentAdd({
        attachment_type: type,
        file_name: file.name,
        file_url: result.path,
        file_size: file.size,
      });
      toast({
        title: 'Success',
        description: 'Document uploaded successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUploading({ ...uploading, [type]: false });
    }
  };

  const hasDocument = (type: string) => attachments.some(a => a.attachment_type === type);

  const documentTypes = [
    { type: 'w9', label: 'W9 Form', required: true },
    { type: 'insurance', label: 'Certificate of Insurance', required: true },
    { type: 'mc_authority', label: 'MC Authority', required: true },
    { type: 'signed_agreement', label: 'Signed Agreement', required: true },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Carrier Documents</h3>
        <p className="text-sm text-muted-foreground">Upload required documents for carrier onboarding</p>
      </div>

      <div className="grid gap-4">
        {documentTypes.map((doc) => (
          <Card key={doc.type} className={hasDocument(doc.type) ? 'border-green-500' : ''}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  {hasDocument(doc.type) ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <FileText className="h-5 w-5 text-muted-foreground" />
                  )}
                  <div>
                    <Label className="text-base">
                      {doc.label}
                      {doc.required && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    {hasDocument(doc.type) && (
                      <p className="text-xs text-green-600">
                        ✓ {attachments.find(a => a.attachment_type === doc.type)?.file_name}
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <Input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(doc.type, e.target.files[0])}
                    disabled={uploading[doc.type]}
                    className="hidden"
                    id={`upload-${doc.type}`}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={uploading[doc.type]}
                    asChild
                  >
                    <label htmlFor={`upload-${doc.type}`} className="cursor-pointer">
                      <Upload className="h-4 w-4 mr-2" />
                      {uploading[doc.type] ? 'Uploading...' : hasDocument(doc.type) ? 'Replace' : 'Upload'}
                    </label>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <Label className="text-base">Additional Documents (Optional)</Label>
              </div>
              <div>
                <Input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload('other', e.target.files[0])}
                  disabled={uploading.other}
                  className="hidden"
                  id="upload-other"
                  multiple
                />
                <Button
                  variant="outline"
                  size="sm"
                  disabled={uploading.other}
                  asChild
                >
                  <label htmlFor="upload-other" className="cursor-pointer">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
                  </label>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {attachments.filter(a => a.attachment_type === 'other').length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Additional Documents:</h4>
          <div className="space-y-1">
            {attachments
              .filter(a => a.attachment_type === 'other')
              .map((att, idx) => (
                <p key={idx} className="text-sm text-muted-foreground flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  {att.file_name}
                </p>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};