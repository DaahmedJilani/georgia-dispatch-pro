import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Truck, BarChart3, Users, MapPin, FileText, Zap } from "lucide-react";
import fleetLogo from "@/assets/fleet-logo.png";
import Navigation from "@/components/Navigation";
import { ParticleBackground } from "@/components/3d/ParticleBackground";
import { HolographicCard } from "@/components/3d/HolographicCard";
import { HolographicText } from "@/components/3d/HolographicText";
import { GlowButton } from "@/components/3d/GlowButton";
import { motion } from "framer-motion";

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
    <div className="min-h-screen relative">
      <ParticleBackground />
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-background">
        <div className="container relative mx-auto px-4 py-24 lg:py-32">
          <motion.div 
            className="max-w-4xl mx-auto text-center space-y-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center justify-center mb-6">
              <motion.img 
                src={fleetLogo} 
                alt="Fleet by Georgia Industrials Logo" 
                className="w-48 h-48 object-contain animate-float"
                whileHover={{ scale: 1.05 }}
              />
            </div>
            <HolographicText text="Fleet by Georgia Industrials" className="text-5xl lg:text-6xl" as="h1" />
            <p className="text-xl lg:text-2xl text-foreground/80 max-w-2xl mx-auto">
              Smart Dispatch. Simplified.
            </p>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Professional dispatch management platform for logistics companies. Multi-tenant SaaS
              solution with real-time tracking, load management, and AI-powered features.
            </p>
            <div className="flex justify-center pt-4">
              <GlowButton
                size="lg"
                onClick={() => navigate("/auth")}
                className="text-lg px-8 py-6"
                glowColor="cyan"
              >
                Get Started
              </GlowButton>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 gradient-primary text-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4 text-white">
              Everything You Need to Manage Your Fleet
            </h2>
            <p className="text-lg text-white/80 max-w-2xl mx-auto">
              Built for dispatch companies of all sizes, from single-truck operations to large fleets
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <HolographicCard key={feature.title}>
                  <motion.div
                    className="p-6"
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                  >
                    <div className="w-12 h-12 mb-4 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-500 p-2 animate-glow-pulse">
                      <Icon className="w-full h-full text-white" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3 text-white">{feature.title}</h3>
                    <p className="text-white/80">{feature.description}</p>
                  </motion.div>
                </HolographicCard>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4 text-foreground">
            Ready to Streamline Your Dispatch Operations?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join leading dispatch companies using Fleet to optimize their operations
          </p>
          <Button
            size="lg"
            variant="default"
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
            © 2025 All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
