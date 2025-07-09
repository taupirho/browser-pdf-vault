import { Shield, Lock, Eye, Server, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function PrivacyIndicator() {
  const indicators = [
    {
      icon: Shield,
      title: "100% Private",
      description: "Files never leave your browser"
    },
    {
      icon: Lock,
      title: "Bank-Grade Encryption",
      description: "AES-256 encryption standard"
    },
    {
      icon: Eye,
      title: "We Can't See Your Files",
      description: "Zero server-side processing"
    },
    {
      icon: Zap,
      title: "Instant Processing",
      description: "No uploads, no waiting"
    }
  ];

  return (
    <div className="text-center space-y-6">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold bg-gradient-hero bg-clip-text text-transparent">
          Free, Secure PDF Password Protection
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Add strong passwords to your PDF documents with complete privacy. 
          All processing happens locally in your browser - your files never touch our servers and we can't see their contents.
        </p>
      </div>


      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {indicators.map((item, index) => (
          <div
            key={index}
            className="flex flex-col items-center text-center p-4 rounded-lg bg-card border border-border/50 shadow-card hover:shadow-trust/20 transition-all duration-300"
          >
            <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center mb-3">
              <item.icon className="h-6 w-6 text-primary-foreground" />
            </div>
            <h3 className="font-semibold text-sm mb-1">{item.title}</h3>
            <p className="text-xs text-muted-foreground">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}