import { Check, X } from 'lucide-react';
import { SUBSCRIPTION_TIERS } from '@/lib/subscription-features';

interface FeatureListProps {
  tier: 'basic' | 'pro';
  compact?: boolean;
}

export function FeatureList({ tier, compact = false }: FeatureListProps) {
  const tierInfo = SUBSCRIPTION_TIERS[tier];

  if (compact) {
    return (
      <div className="flex flex-wrap gap-1">
        {tierInfo.features.driver_portal && (
          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
            Driver Portal
          </span>
        )}
        {tierInfo.features.messages && (
          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
            Messages
          </span>
        )}
        {tierInfo.features.fleet_map && (
          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
            Fleet Map
          </span>
        )}
        {tierInfo.features.invoices && (
          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
            Invoices
          </span>
        )}
        {!tierInfo.features.driver_portal &&
          !tierInfo.features.messages &&
          !tierInfo.features.fleet_map &&
          !tierInfo.features.invoices && (
            <span className="text-xs text-muted-foreground">Core Features Only</span>
          )}
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {tierInfo.includedFeatures.map((feature, index) => (
        <li key={index} className="flex items-start gap-2">
          <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
          <span className="text-sm">{feature}</span>
        </li>
      ))}
    </ul>
  );
}

export function FeatureComparison() {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="space-y-4 p-6 border rounded-lg">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Basic</h3>
          <span className="text-2xl font-bold">$20/mo</span>
        </div>
        <FeatureList tier="basic" />
      </div>
      <div className="space-y-4 p-6 border rounded-lg border-primary bg-primary/5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Pro</h3>
          <span className="text-2xl font-bold">$50/mo</span>
        </div>
        <FeatureList tier="pro" />
      </div>
    </div>
  );
}
