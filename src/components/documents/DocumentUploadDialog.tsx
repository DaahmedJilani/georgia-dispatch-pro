import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Upload } from "lucide-react";

interface DocumentUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  companyId: string;
}

export const DocumentUploadDialog = ({ open, onOpenChange, onSuccess, companyId }: DocumentUploadDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState("other");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast({
        title: "Error",
        description: "Please select a file",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${companyId}/${Date.now()}-${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName);

      // Create document record
      const { error: dbError } = await supabase.from("documents").insert([
        {
          company_id: companyId,
          file_name: file.name,
          file_path: fileName,
          document_type: documentType,
          file_size: file.size,
          uploaded_by: (await supabase.auth.getUser()).data.user?.id,
        },
      ]);

      if (dbError) throw dbError;

      toast({
        title: "Success",
        description: "Document uploaded successfully",
      });

      setFile(null);
      setDocumentType("other");
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="document_type">Document Type *</Label>
            <Select value={documentType} onValueChange={setDocumentType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="invoice">Invoice</SelectItem>
                <SelectItem value="bol">Bill of Lading</SelectItem>
                <SelectItem value="pod">Proof of Delivery</SelectItem>
                <SelectItem value="contract">Contract</SelectItem>
                <SelectItem value="insurance">Insurance</SelectItem>
                <SelectItem value="rate_confirmation">Rate Confirmation</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="file">File *</Label>
            <Input
              id="file"
              type="file"
              required
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            />
            {file && (
              <p className="text-sm text-muted-foreground mt-1">
                Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              <Upload className="w-4 h-4 mr-2" />
              {loading ? "Uploading..." : "Upload"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};