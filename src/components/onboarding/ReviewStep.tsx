import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle } from 'lucide-react';

interface Driver {
  name: string;
  phone: string;
  license_number: string;
  cdl_class: string;
  experience_years: number;
}

interface Attachment {
  attachment_type: string;
  file_name: string;
}

interface CarrierData {
  name: string;
  mc_number: string;
  dot_number: string;
  address: string;
  contact_name: string;
  contact_email: string;
  phone: string;
  insurance_expiry: string;
  preferred_routes: string;
  notes: string;
}

interface ReviewStepProps {
  carrier: CarrierData;
  drivers: Driver[];
  attachments: Attachment[];
}

export const ReviewStep = ({ carrier, drivers, attachments }: ReviewStepProps) => {
  const hasDocument = (type: string) => attachments.some(a => a.attachment_type === type);
  const requiredDocs = ['w9', 'insurance', 'mc_authority', 'signed_agreement'];
  const allDocsUploaded = requiredDocs.every(hasDocument);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Review & Submit</h3>
        <p className="text-sm text-muted-foreground">
          Please review all information before submitting. You can go back to make changes if needed.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Carrier Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="font-medium">Carrier Name:</span> {carrier.name}</div>
            <div><span className="font-medium">Contact Name:</span> {carrier.contact_name}</div>
            <div><span className="font-medium">MC Number:</span> {carrier.mc_number || 'N/A'}</div>
            <div><span className="font-medium">DOT Number:</span> {carrier.dot_number || 'N/A'}</div>
            <div><span className="font-medium">Email:</span> {carrier.contact_email}</div>
            <div><span className="font-medium">Phone:</span> {carrier.phone}</div>
          </div>
          {carrier.preferred_routes && (
            <div className="pt-2 border-t">
              <span className="font-medium text-sm">Preferred Routes:</span>
              <p className="text-sm text-muted-foreground mt-1">{carrier.preferred_routes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Drivers ({drivers.length})</CardTitle>
            {drivers.length === 0 && (
              <Badge variant="destructive">No drivers added</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {drivers.length > 0 ? (
            <div className="space-y-3">
              {drivers.map((driver, idx) => (
                <div key={idx} className="p-3 border rounded-lg">
                  <div className="font-medium">{driver.name}</div>
                  <div className="grid grid-cols-2 gap-2 mt-2 text-sm text-muted-foreground">
                    <div>License: {driver.license_number}</div>
                    <div>CDL Class: {driver.cdl_class}</div>
                    <div>Phone: {driver.phone}</div>
                    <div>Experience: {driver.experience_years} years</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No drivers added yet</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Documents</CardTitle>
            {allDocsUploaded ? (
              <Badge variant="default" className="bg-green-600">All Required Documents Uploaded</Badge>
            ) : (
              <Badge variant="destructive">Missing Required Documents</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              { type: 'w9', label: 'W9 Form' },
              { type: 'insurance', label: 'Certificate of Insurance' },
              { type: 'mc_authority', label: 'MC Authority' },
              { type: 'signed_agreement', label: 'Signed Agreement' },
            ].map((doc) => (
              <div key={doc.type} className="flex items-center justify-between text-sm">
                <span>{doc.label}</span>
                {hasDocument(doc.type) ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-xs">{attachments.find(a => a.attachment_type === doc.type)?.file_name}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-destructive">
                    <XCircle className="h-4 w-4" />
                    <span>Not uploaded</span>
                  </div>
                )}
              </div>
            ))}
            {attachments.filter(a => a.attachment_type === 'other').length > 0 && (
              <div className="pt-2 border-t">
                <div className="font-medium text-sm mb-1">Additional Documents:</div>
                {attachments
                  .filter(a => a.attachment_type === 'other')
                  .map((att, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      {att.file_name}
                    </div>
                  ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {!allDocsUploaded && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            ⚠️ Some required documents are missing. You can still save as draft, but submission requires all documents.
          </p>
        </div>
      )}
    </div>
  );
};