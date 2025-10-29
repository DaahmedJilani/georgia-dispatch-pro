import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowUpCircle, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { FeatureComparison } from './FeatureList';

interface UpgradeRequiredProps {
  feature: string;
  description?: string;
}

export function UpgradeRequired({ feature, description }: UpgradeRequiredProps) {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card className="border-primary">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">{feature} Not Available</CardTitle>
          <CardDescription className="text-base">
            {description ||
              `${feature} is only available on the Pro plan ($50/month). Upgrade to unlock this feature and more.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center">
            <Button size="lg" onClick={() => navigate('/settings')}>
              <ArrowUpCircle className="mr-2 h-5 w-5" />
              Upgrade to Pro
            </Button>
          </div>

          <div className="pt-6">
            <h3 className="text-lg font-semibold mb-4 text-center">Compare Plans</h3>
            <FeatureComparison />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
