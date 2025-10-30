import DashboardLayout from '@/components/DashboardLayout';
import { ContractTemplateManager } from '@/components/admin/ContractTemplateManager';

export default function ContractManagement() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Contract Management</h1>
          <p className="text-muted-foreground">
            Upload and manage contract templates for carrier onboarding
          </p>
        </div>
        <ContractTemplateManager />
      </div>
    </DashboardLayout>
  );
}
