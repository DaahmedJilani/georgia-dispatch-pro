import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Scan, CheckCircle, AlertCircle } from "lucide-react";

interface PODExtractorProps {
  documentId: string;
  fileUrl: string;
  onDataExtracted?: (data: any) => void;
}

export const PODExtractor = ({ documentId, fileUrl, onDataExtracted }: PODExtractorProps) => {
  const { toast } = useToast();
  const [extracting, setExtracting] = useState(false);
  const [extractedData, setExtractedData] = useState<any | null>(null);

  const extractData = async () => {
    try {
      setExtracting(true);

      // Get the full URL for the document
      const { data: urlData } = await supabase.storage
        .from('documents')
        .createSignedUrl(fileUrl, 3600);

      if (!urlData?.signedUrl) {
        throw new Error('Could not generate document URL');
      }

      const { data, error } = await supabase.functions.invoke('extract-pod-data', {
        body: {
          imageUrl: urlData.signedUrl,
          documentId,
        },
      });

      if (error) throw error;

      if (data.success) {
        setExtractedData(data.data);
        toast({
          title: "Data Extracted",
          description: "POD data has been successfully extracted",
        });

        if (onDataExtracted) {
          onDataExtracted(data.data);
        }
      }
    } catch (error: any) {
      toast({
        title: "Extraction Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setExtracting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Scan className="w-5 h-5" />
          POD Data Extraction
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!extractedData ? (
          <Button onClick={extractData} disabled={extracting}>
            {extracting ? (
              <>
                <Scan className="w-4 h-4 mr-2 animate-spin" />
                Extracting Data...
              </>
            ) : (
              <>
                <Scan className="w-4 h-4 mr-2" />
                Extract POD Data with AI
              </>
            )}
          </Button>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              <span className="font-semibold">Data Extracted Successfully</span>
            </div>

            <div className="grid gap-3">
              {extractedData.delivery_date && (
                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <span className="text-sm font-medium">Delivery Date:</span>
                  <span className="text-sm">
                    {new Date(extractedData.delivery_date).toLocaleDateString()}
                  </span>
                </div>
              )}

              {extractedData.delivery_time && (
                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <span className="text-sm font-medium">Delivery Time:</span>
                  <span className="text-sm">{extractedData.delivery_time}</span>
                </div>
              )}

              {extractedData.recipient_name && (
                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <span className="text-sm font-medium">Recipient:</span>
                  <span className="text-sm">{extractedData.recipient_name}</span>
                </div>
              )}

              {extractedData.recipient_signature !== null && (
                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <span className="text-sm font-medium">Signature:</span>
                  <Badge variant={extractedData.recipient_signature ? "default" : "secondary"}>
                    {extractedData.recipient_signature ? "Present" : "Not Present"}
                  </Badge>
                </div>
              )}

              {extractedData.location && (
                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <span className="text-sm font-medium">Location:</span>
                  <span className="text-sm">{extractedData.location}</span>
                </div>
              )}

              {extractedData.condition && (
                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <span className="text-sm font-medium">Condition:</span>
                  <Badge variant={extractedData.condition === 'good' ? 'default' : 'destructive'}>
                    {extractedData.condition}
                  </Badge>
                </div>
              )}

              {extractedData.notes && (
                <div className="p-2 bg-muted rounded">
                  <span className="text-sm font-medium block mb-1">Notes:</span>
                  <span className="text-sm text-muted-foreground">{extractedData.notes}</span>
                </div>
              )}
            </div>

            <Button variant="outline" size="sm" onClick={extractData}>
              <Scan className="w-4 h-4 mr-2" />
              Re-extract Data
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
