export const SUBSCRIPTION_TIERS = {
  basic: {
    name: 'Basic',
    price: 20,
    features: {
      driver_portal: false,
      messages: false,
      fleet_map: false,
      invoices: false,
    },
    includedFeatures: [
      'Admin Dashboard',
      'Sales Dashboard',
      'Dispatch Dashboard',
      'Treasury Dashboard',
      'Loads Management',
      'Drivers Management',
      'Carriers Management',
      'Brokers Management',
      'Documents',
      'Analytics',
    ],
  },
  pro: {
    name: 'Pro',
    price: 50,
    features: {
      driver_portal: true,
      messages: true,
      fleet_map: true,
      invoices: true,
    },
    includedFeatures: [
      'Everything in Basic',
      'Driver Portal',
      'Messages',
      'Fleet Map (GPS Tracking)',
      'Invoices',
    ],
  },
} as const;

export type SubscriptionTier = keyof typeof SUBSCRIPTION_TIERS;
export type SubscriptionFeatures = {
  driver_portal: boolean;
  messages: boolean;
  fleet_map: boolean;
  invoices: boolean;
};
