import Navigation from "@/components/Navigation";
import { Truck, Target, Shield, Zap } from "lucide-react";

const AboutUs = () => {
  const values = [
    {
      icon: Target,
      title: "Our Mission",
      description: "To simplify dispatch operations for logistics companies through innovative technology and intelligent automation.",
    },
    {
      icon: Shield,
      title: "Reliability",
      description: "Built on enterprise-grade infrastructure, ensuring your operations run smoothly 24/7 with 99.9% uptime.",
    },
    {
      icon: Zap,
      title: "Innovation",
      description: "Leveraging AI and modern technology to continuously improve and streamline your dispatch workflows.",
    },
    {
      icon: Truck,
      title: "Industry Focus",
      description: "Purpose-built for logistics companies, with features designed by dispatch professionals for dispatch professionals.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-16">
        {/* Header */}
        <section className="max-w-4xl mx-auto text-center mb-16">
          <h1 className="text-4xl lg:text-5xl font-bold mb-6 text-foreground">
            About Georgia Industrials
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            We're a team dedicated to transforming the logistics industry through smart technology. 
            Fleet by Georgia Industrials was born from real-world dispatch challenges and built to solve them.
          </p>
        </section>

        {/* Story Section */}
        <section className="max-w-4xl mx-auto mb-16">
          <div className="bg-card border border-border rounded-lg p-8 shadow-sm">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Our Story</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Founded by logistics professionals who experienced firsthand the challenges of managing 
              dispatch operations with outdated tools, Georgia Industrials set out to create a modern, 
              comprehensive solution that scales with your business.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Fleet is the result of years of industry experience combined with cutting-edge technology. 
              We've built a platform that handles everything from load management and GPS tracking to 
              automated invoicing and analytics—all in one place.
            </p>
          </div>
        </section>

        {/* Values Grid */}
        <section className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-foreground">
            What Drives Us
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            {values.map((value) => {
              const Icon = value.icon;
              return (
                <div
                  key={value.title}
                  className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-foreground">{value.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{value.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* CTA Section */}
        <section className="max-w-4xl mx-auto mt-16 text-center">
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">
              Ready to Transform Your Dispatch Operations?
            </h2>
            <p className="text-muted-foreground mb-6">
              Join leading logistics companies using Fleet to optimize their operations.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-secondary py-8 text-secondary-foreground mt-16">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm">
            © 2025 Georgia Industrials. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default AboutUs;
