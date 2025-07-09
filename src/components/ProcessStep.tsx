import { Upload, Key, Shield, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ProcessStep() {
  const steps = [
    {
      icon: Upload,
      title: "1. Select PDF",
      description: "Choose your PDF file. It stays in your browser memory.",
      color: "text-primary"
    },
    {
      icon: Key,
      title: "2. Generate Password",
      description: "A secure 15-character password is created using crypto APIs.",
      color: "text-secondary"
    },
    {
      icon: Shield,
      title: "3. Encrypt Document",
      description: "Your PDF is encrypted with AES-256 protection locally.",
      color: "text-trust"
    },
    {
      icon: Download,
      title: "4. Download Protected PDF",
      description: "Get your password-protected PDF ready for safe sharing.",
      color: "text-primary"
    }
  ];

  return (
    <Card className="shadow-card bg-gradient-card border-border/50">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">How It Works</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => (
            <div key={index} className="text-center space-y-3">
              <div className="relative">
                <div className={`w-16 h-16 mx-auto rounded-full bg-gradient-primary flex items-center justify-center shadow-glow`}>
                  <step.icon className="h-8 w-8 text-primary-foreground" />
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-primary/50 to-transparent -translate-x-8" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-base mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}