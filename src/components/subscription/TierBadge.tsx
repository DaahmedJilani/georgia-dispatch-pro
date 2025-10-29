import { Badge } from '@/components/ui/badge';
import { SUBSCRIPTION_TIERS } from '@/lib/subscription-features';

interface TierBadgeProps {
  tier: 'basic' | 'pro';
  showPrice?: boolean;
}

export function TierBadge({ tier, showPrice = true }: TierBadgeProps) {
  const tierInfo = SUBSCRIPTION_TIERS[tier];
  const variant = tier === 'pro' ? 'default' : 'secondary';

  return (
    <Badge variant={variant}>
      {tierInfo.name}
      {showPrice && ` ($${tierInfo.price}/mo)`}
    </Badge>
  );
}
