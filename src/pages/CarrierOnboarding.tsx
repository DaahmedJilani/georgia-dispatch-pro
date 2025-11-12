import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, Save, Send, FileCheck } from 'lucide-react';
import { CarrierInfoStep } from '@/components/onboarding/CarrierInfoStep';
import { DriversStep } from '@/components/onboarding/DriversStep';
import { DocumentsStep } from '@/components/onboarding/DocumentsStep';
import { ReviewStep } from '@/components/onboarding/ReviewStep';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CarrierData {
  id?: string;
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
  company_id: string;
}

interface Driver {
  id?: string;
  name: string;
  phone: string;
  license_number: string;
  license_expiration: string;
  cdl_class: string;
  experience_years: number;
  license_file_url?: string;
  medical_card_url?: string;
  signed_agreement_url?: string;
}

interface Attachment {
  attachment_type: string;
  file_name: string;
  file_url: string;
  file_size?: number;
}

const STEPS = [
  { id: 1, title: 'Carrier Info', description: 'Basic carrier details' },
  { id: 2, title: 'Drivers', description: 'Add driver information' },
  { id: 3, title: 'Documents', description: 'Upload required documents' },
  { id: 4, title: 'Review', description: 'Review and submit' },
];

export default function CarrierOnboarding() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [companyId, setCompanyId] = useState<string>('');
  
  const [carrierData, setCarrierData] = useState<CarrierData>({
    name: '',
    mc_number: '',
    dot_number: '',
    address: '',
    contact_name: '',
    contact_email: '',
    phone: '',
    insurance_expiry: '',
    preferred_routes: '',
    notes: '',
    company_id: '',
  });

  const [drivers, setDrivers] = useState<Driver[]>([{
    name: '',
    phone: '',
    license_number: '',
    license_expiration: '',
    cdl_class: '',
    experience_years: 0,
  }]);

  const [attachments, setAttachments] = useState<Attachment[]>([]);

  useEffect(() => {
    fetchUserCompany();
    const carrierId = searchParams.get('carrier_id');
    if (carrierId) {
      loadCarrierData(carrierId);
    }
  }, [searchParams]);

  const fetchUserCompany = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/auth');
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('user_id', user.id)
      .single();

    if (profile?.company_id) {
      setCompanyId(profile.company_id);
      setCarrierData(prev => ({ ...prev, company_id: profile.company_id }));
    }
  };

  const loadCarrierData = async (carrierId: string) => {
    const { data: carrier } = await supabase
      .from('carriers')
      .select('*')
      .eq('id', carrierId)
      .single();

    if (carrier) {
      setCarrierData({
        id: carrier.id,
        name: carrier.name,
        mc_number: carrier.mc_number || '',
        dot_number: carrier.dot_number || '',
        address: carrier.address || '',
        contact_name: carrier.contact_name || '',
        contact_email: carrier.email || '',
        phone: carrier.phone || '',
        insurance_expiry: carrier.insurance_expiry || '',
        preferred_routes: carrier.preferred_routes || '',
        notes: carrier.notes || '',
        company_id: carrier.company_id,
      });

      // Load drivers
      const { data: existingDrivers } = await supabase
        .from('drivers')
        .select('*')
        .eq('carrier_id', carrierId);

      if (existingDrivers && existingDrivers.length > 0) {
        setDrivers(existingDrivers.map(d => ({
          id: d.id,
          name: `${d.first_name} ${d.last_name}`,
          phone: d.phone || '',
          license_number: d.license_number || '',
          license_expiration: d.license_expiry || '',
          cdl_class: d.cdl_class || '',
          experience_years: d.experience_years || 0,
          license_file_url: d.license_file_url,
          medical_card_url: d.medical_card_url,
          signed_agreement_url: d.signed_agreement_url,
        })));
      }

      // Load attachments
      const { data: existingAttachments } = await supabase
        .from('carrier_attachments')
        .select('*')
        .eq('carrier_id', carrierId);

      if (existingAttachments) {
        setAttachments(existingAttachments.map(a => ({
          attachment_type: a.attachment_type,
          file_name: a.file_name,
          file_url: a.file_url,
          file_size: a.file_size,
        })));
      }
    }
  };

  const handleCarrierChange = (field: keyof CarrierData, value: string) => {
    setCarrierData(prev => ({ ...prev, [field]: value }));
  };

  const handleDriverChange = (index: number, field: keyof Driver, value: any) => {
    setDrivers(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleAddDriver = () => {
    setDrivers(prev => [...prev, {
      name: '',
      phone: '',
      license_number: '',
      license_expiration: '',
      cdl_class: '',
      experience_years: 0,
    }]);
  };

  const handleRemoveDriver = (index: number) => {
    setDrivers(prev => prev.filter((_, i) => i !== index));
  };

  const handleAttachmentAdd = (attachment: Attachment) => {
    setAttachments(prev => [...prev, attachment]);
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!carrierData.name || !carrierData.contact_name || !carrierData.contact_email || !carrierData.phone) {
          toast({
            title: 'Validation Error',
            description: 'Please fill in all required carrier information',
            variant: 'destructive',
          });
          return false;
        }
        return true;
      case 2:
        if (drivers.length === 0) {
          toast({
            title: 'Validation Error',
            description: 'Please add at least one driver',
            variant: 'destructive',
          });
          return false;
        }
        for (const driver of drivers) {
          if (!driver.name || !driver.phone || !driver.license_number || !driver.license_expiration || !driver.cdl_class) {
            toast({
              title: 'Validation Error',
              description: 'Please fill in all required driver information',
              variant: 'destructive',
            });
            return false;
          }
        }
        return true;
      case 3:
        return true; // Documents are optional for draft
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSave = async (isDraft: boolean) => {
    if (!isDraft && !validateStep(currentStep)) return;

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await supabase.functions.invoke('save-carrier-onboarding', {
        body: {
          carrier: carrierData,
          drivers,
          attachments,
          isDraft,
        },
      });

      if (response.error) throw response.error;

      toast({
        title: 'Success',
        description: isDraft ? 'Draft saved successfully' : 'Onboarding submitted successfully',
      });

      if (!isDraft) {
        // Generate PDF after successful submission
        await supabase.functions.invoke('generate-onboarding-pdf', {
          body: { carrier_id: response.data.carrier_id },
        });
        
        navigate('/carriers');
      }
    } catch (error: any) {
      console.error('Error saving onboarding:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save onboarding data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const progress = (currentStep / STEPS.length) * 100;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Carrier Onboarding</h1>
            <p className="text-muted-foreground">Complete the onboarding process for a new carrier</p>
          </div>
          <Button variant="ghost" onClick={() => navigate('/carriers')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Carriers
          </Button>
        </div>

        {/* Progress Bar */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-2">
                {STEPS.map((step, index) => (
                  <div
                    key={step.id}
                    className={`flex-1 text-center ${index > 0 ? 'ml-2' : ''}`}
                  >
                    <div className={`text-sm font-medium ${currentStep >= step.id ? 'text-primary' : 'text-muted-foreground'}`}>
                      Step {step.id}
                    </div>
                    <div className={`text-xs ${currentStep >= step.id ? 'text-primary' : 'text-muted-foreground'}`}>
                      {step.title}
                    </div>
                  </div>
                ))}
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Step Content */}
        <Card>
          <CardContent className="pt-6">
            {currentStep === 1 && (
              <CarrierInfoStep data={carrierData} onChange={handleCarrierChange} />
            )}
            {currentStep === 2 && (
              <DriversStep
                drivers={drivers}
                companyId={companyId}
                onChange={handleDriverChange}
                onAdd={handleAddDriver}
                onRemove={handleRemoveDriver}
              />
            )}
            {currentStep === 3 && (
              <DocumentsStep
                attachments={attachments}
                companyId={companyId}
                onAttachmentAdd={handleAttachmentAdd}
              />
            )}
            {currentStep === 4 && (
              <ReviewStep
                carrier={carrierData}
                drivers={drivers}
                attachments={attachments}
              />
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1 || loading}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => handleSave(true)}
              disabled={loading}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Progress
            </Button>

            {currentStep < STEPS.length ? (
              <Button onClick={handleNext} disabled={loading}>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={() => handleSave(false)} disabled={loading}>
                <Send className="h-4 w-4 mr-2" />
                Submit & Generate PDF
              </Button>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}