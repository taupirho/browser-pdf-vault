import { Shield, Lock, Eye, Zap, Server, Globe, Key, FileCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";

const About = () => {
  const securityFeatures = [
    {
      icon: Lock,
      title: "AES-256 Encryption",
      description: "Military-grade encryption standard used by governments and banks worldwide"
    },
    {
      icon: Eye,
      title: "Zero Knowledge",
      description: "We never see your files - all processing happens locally in your browser"
    },
    {
      icon: Server,
      title: "No Upload Required",
      description: "Files never leave your device, eliminating data breach risks"
    },
    {
      icon: Key,
      title: "Cryptographically Secure",
      description: "Passwords generated using browser's crypto.getRandomValues() API"
    }
  ];

  const howItWorks = [
    {
      step: 1,
      title: "File Selection",
      description: "You select a PDF file from your device using the browser's file picker"
    },
    {
      step: 2,
      title: "Local Processing",
      description: "The PDF is loaded into your browser's memory using the pdf-lib library"
    },
    {
      step: 3,
      title: "Secure Password Generation",
      description: "A cryptographically secure password is generated using Web Crypto API"
    },
    {
      step: 4,
      title: "AES-256 Encryption",
      description: "The PDF is encrypted using AES-256 standard with your generated password"
    },
    {
      step: 5,
      title: "Secure Download",
      description: "The encrypted PDF is offered for download, original file is cleared from memory"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Shield className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-xl">SecurePDF</span>
            </Link>
            <div className="flex items-center gap-2">
              <Link to="/">
                <Button variant="ghost">Back to Home</Button>
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-12">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold">About SecurePDF</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A privacy-first, browser-based PDF password protection tool that keeps your documents secure without compromising your privacy.
            </p>
          </div>

          {/* Mission Statement */}
          <Card className="shadow-card bg-card border-border/50">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-4 text-foreground">Our Mission</h2>
              <p className="text-lg leading-relaxed text-foreground">
                SecurePDF was created to address a critical gap in online security tools. While many PDF protection services require uploading your sensitive documents to unknown servers, we believe your private files should never leave your control. Our browser-based approach ensures maximum security and privacy while maintaining the convenience of a web-based tool.
              </p>
            </CardContent>
          </Card>

          {/* Security Features */}
          <section className="space-y-6">
            <h2 className="text-3xl font-bold text-center">Why Browser-Based Security Matters</h2>
            <div className="grid gap-6 md:grid-cols-2">
              {securityFeatures.map((feature, index) => (
                <Card key={index} className="shadow-card bg-card border-border/50">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center flex-shrink-0">
                        <feature.icon className="h-5 w-5 text-primary-foreground" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg mb-2 text-foreground">{feature.title}</h3>
                        <p className="text-muted-foreground">{feature.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* How It Works */}
          <section className="space-y-6">
            <h2 className="text-3xl font-bold text-center">How SecurePDF Works</h2>
            <div className="space-y-4">
              {howItWorks.map((step, index) => (
                <Card key={index} className="shadow-card bg-card border-border/50">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center flex-shrink-0 text-primary-foreground font-bold">
                        {step.step}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg mb-2 text-foreground">{step.title}</h3>
                        <p className="text-muted-foreground">{step.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Technical Details */}
          <Card className="shadow-card bg-card border-border/50">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-4 text-foreground">Technical Implementation</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-foreground">Encryption Standard</h3>
                  <p className="text-muted-foreground">
                    SecurePDF uses AES-256 encryption through the pdf-lib-plus-encrypt library, implementing the same encryption standard used by the U.S. government for classified information and by banks for financial transactions.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-foreground">Password Generation</h3>
                  <p className="text-muted-foreground">
                    Passwords are generated using the Web Crypto API's crypto.getRandomValues() method, ensuring cryptographically secure randomness. Each password contains a mix of uppercase, lowercase, numbers, and special characters.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-foreground">Memory Management</h3>
                  <p className="text-muted-foreground">
                    Your original PDF is loaded into browser memory temporarily, processed, and then immediately cleared. No copies are retained, cached, or transmitted over the network.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-foreground">Open Source Foundation</h3>
                  <p className="text-muted-foreground">
                    Built on open-source libraries including pdf-lib for PDF manipulation and standard Web APIs for cryptographic operations, ensuring transparency and auditability.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Privacy Commitment */}
          <Card className="shadow-card bg-card border-border/50">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-4 text-foreground">Our Privacy Commitment</h2>
              <div className="space-y-4">
                <p className="text-lg text-foreground">
                  Privacy is not just a feature—it's our foundational principle. Here's our commitment to you:
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <FileCheck className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Your PDF files and passwords never touch our servers</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <FileCheck className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>An "always FREE" tier with monthly or yearly subscription options for power users</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <FileCheck className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Minimal logging (only basic web server logs for security)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <FileCheck className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Full transparency about any data collection in our Privacy Policy</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <FileCheck className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>GDPR compliant with strong data protection rights — see our <Link to="/trust-security" className="underline underline-offset-2">Trust & Security</Link> page</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Call to Action */}
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold">Ready to Secure Your PDFs?</h2>
            <p className="text-muted-foreground">
              Experience the peace of mind that comes with true privacy-first PDF protection.
            </p>
            <Link to="/">
              <Button size="lg" className="bg-gradient-primary text-primary-foreground">
                Try SecurePDF Now
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default About;