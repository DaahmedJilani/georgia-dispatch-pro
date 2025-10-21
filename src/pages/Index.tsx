import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Truck, BarChart3, Users, MapPin, FileText, Zap } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      }
    });
  }, [navigate]);

  const features = [
    {
      icon: Truck,
      title: "Load Management",
      description: "Create, assign, and track loads with real-time updates",
    },
    {
      icon: MapPin,
      title: "GPS Tracking",
      description: "Monitor driver locations and routes in real-time",
    },
    {
      icon: Users,
      title: "Multi-Tenant",
      description: "Secure data isolation for each dispatch company",
    },
    {
      icon: FileText,
      title: "Document Management",
      description: "Upload and manage BOLs, PODs, and invoices",
    },
    {
      icon: Zap,
      title: "AI-Powered",
      description: "Smart suggestions and automated invoice generation",
    },
    {
      icon: BarChart3,
      title: "Analytics",
      description: "Track performance, revenue, and operational metrics",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden gradient-primary text-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="container relative mx-auto px-4 py-24 lg:py-32">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-accent/20 backdrop-blur-sm mb-6">
              <Truck className="w-10 h-10" />
            </div>
            <h1 className="text-5xl lg:text-7xl font-bold tracking-tight">
              Fleet by Georgia Industrials
            </h1>
            <p className="text-xl lg:text-2xl text-white/90 max-w-2xl mx-auto">
              Smart Dispatch. Simplified.
            </p>
            <p className="text-lg text-white/80 max-w-3xl mx-auto">
              Professional dispatch management platform for logistics companies. Multi-tenant SaaS
              solution with real-time tracking, load management, and AI-powered features.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button
                size="lg"
                variant="secondary"
                onClick={() => navigate("/auth")}
                className="text-lg px-8 py-6"
              >
                Get Started
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/auth")}
                className="text-lg px-8 py-6 border-white text-white hover:bg-white/10"
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Everything You Need to Manage Your Fleet
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Built for dispatch companies of all sizes, from single-truck operations to large fleets
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="glass-card p-6 transition-smooth hover:shadow-lg group"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-smooth">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 gradient-primary text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Ready to Streamline Your Dispatch Operations?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join leading dispatch companies using Fleet to optimize their operations
          </p>
          <Button
            size="lg"
            variant="secondary"
            onClick={() => navigate("/auth")}
            className="text-lg px-8 py-6"
          >
            Start Your Free Trial
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-secondary py-8 text-secondary-foreground">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm">
            © 2025 Fleet by Georgia Industrials. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
