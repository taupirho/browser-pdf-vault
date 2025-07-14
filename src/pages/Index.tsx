import { PDFProtector } from "@/components/PDFProtector";
import { ThemeToggle } from "@/components/ThemeToggle";
import { GoogleAd } from "@/components/GoogleAd";
import { Shield, Lock, Eye, Zap, FileText, HelpCircle, Users, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";

const Index = () => {
  const indicators = [{
    icon: Shield,
    title: "100% Private",
    description: "Files never leave your browser"
  }, {
    icon: Lock,
    title: "Bank-Grade Encryption",
    description: "AES-256 encryption standard"
  }, {
    icon: Eye,
    title: "We Can't See Your Files",
    description: "Zero server-side processing"
  }, {
    icon: Zap,
    title: "Instant Processing",
    description: "No uploads, no waiting"
  }];

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
            
            {/* Center text - hidden on mobile, visible on larger screens */}
            <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2">
              <span className="font-bold bg-gradient-hero bg-clip-text text-transparent whitespace-nowrap text-xl">
                Free, Secure PDF Password Protection
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              <nav className="hidden md:flex items-center gap-4">
                <Link to="/about">
                  <Button variant="ghost" size="sm">About</Button>
                </Link>
                <Link to="/contact">
                  <Button variant="ghost" size="sm">Contact</Button>
                </Link>
              </nav>
              <ThemeToggle />
            </div>
          </div>
          
          {/* Mobile tagline - visible only on mobile */}
          <div className="md:hidden mt-2 text-center">
            <span className="font-medium bg-gradient-hero bg-clip-text text-transparent text-center text-lg">
              Free, Secure PDF Password Protection
            </span>
          </div>
        </div>
      </header>

      {/* Main Layout with Side Ads */}
      <div className="flex min-h-screen">
        {/* Left Vertical Ad */}
        <div className="hidden lg:flex w-48 flex-shrink-0">
          <div className="sticky top-20 p-4 w-full h-fit">
            <GoogleAd 
              slot="7880848617"
              style={{ width: '160px', height: '600px', display: 'block', minWidth: '160px', minHeight: '600px' }}
              className="w-40 h-[600px]"
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 max-w-4xl mx-auto">
          <main className="container mx-auto space-y-12 px-4 py-8">
            {/* Main PDF Protector */}
            <PDFProtector />

            {/* Why Use SecurePDF Section */}
            <section className="space-y-8">
              <h2 className="text-3xl font-bold text-center">Why Use SecurePDF?</h2>
              
              <div className="flex justify-center items-center gap-4">
                {indicators.map((item, index) => (
                  <div key={index} className="flex flex-col items-center text-center p-3 rounded-lg bg-card border border-border/50 shadow-card hover:shadow-trust/20 transition-all duration-300 w-[240px]">
                    <div className="w-7 h-7 bg-gradient-primary rounded-full flex items-center justify-center mb-2">
                      <item.icon className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <h3 className="font-semibold text-sm mb-1">{item.title}</h3>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* FAQ Section */}
            <section className="space-y-8">
              <h2 className="text-3xl font-bold text-center">Frequently Asked Questions</h2>
              
              <div className="grid gap-6 max-w-3xl mx-auto">
                <Card className="shadow-card bg-gradient-card border-border/50">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-3">Is my PDF really secure?</h3>
                    <p className="text-muted-foreground">
                      Yes! We use AES-256 encryption, the same standard used by banks and military. 
                      The password is generated using cryptographically secure random values, 
                      and all processing happens in your browser.
                    </p>
                  </CardContent>
                </Card>

                <Card className="shadow-card bg-gradient-card border-border/50">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-3">What happens to my files?</h3>
                    <p className="text-muted-foreground">
                      Your files never leave your browser. They are read into memory, processed locally, 
                      and then immediately discarded. We never see, store, or have access to your documents.
                    </p>
                  </CardContent>
                </Card>

                <Card className="shadow-card bg-gradient-card border-border/50">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-3">What if I lose the password?</h3>
                    <p className="text-muted-foreground">
                      Unfortunately, if you lose the password, the PDF cannot be recovered. This is by design - 
                      it ensures maximum security. Always save the password in a secure location.
                    </p>
                  </CardContent>
                </Card>

                 <Card className="shadow-card bg-gradient-card border-border/50">
                   <CardContent className="p-6">
                     <h3 className="font-semibold text-lg mb-3">Is there a file size limit?</h3>
                     <p className="text-muted-foreground">
                       We limit files to 50MB to ensure good performance in your browser. 
                       Most PDF documents are well under this limit.
                     </p>
                   </CardContent>
                 </Card>

                 <Card className="shadow-card bg-gradient-card border-border/50">
                   <CardContent className="p-6">
                     <h3 className="font-semibold text-lg mb-3">How strong is the encryption?</h3>
                     <p className="text-muted-foreground">
                       SecurePDF uses AES-256 encryption, the same military-grade standard used by governments and financial institutions worldwide. 
                       This encryption is virtually unbreakable with current technology and would take billions of years to crack with today's computers.
                     </p>
                   </CardContent>
                 </Card>

                 <Card className="shadow-card bg-gradient-card border-border/50">
                   <CardContent className="p-6">
                     <h3 className="font-semibold text-lg mb-3">Can I use this for sensitive documents?</h3>
                     <p className="text-muted-foreground">
                       Absolutely! Since all processing happens locally in your browser and files never touch our servers, 
                       SecurePDF is perfect for confidential business documents, legal papers, medical records, and other sensitive materials. 
                       Your privacy is guaranteed by design.
                     </p>
                   </CardContent>
                 </Card>

                 <Card className="shadow-card bg-gradient-card border-border/50">
                   <CardContent className="p-6">
                     <h3 className="font-semibold text-lg mb-3">What browsers are supported?</h3>
                     <p className="text-muted-foreground">
                       SecurePDF works in all modern web browsers including Chrome, Firefox, Safari, and Edge. 
                       We use standard Web APIs for cryptography and file handling, ensuring broad compatibility across desktop and mobile devices.
                     </p>
                   </CardContent>
                 </Card>

                 <Card className="shadow-card bg-gradient-card border-border/50">
                   <CardContent className="p-6">
                     <h3 className="font-semibold text-lg mb-3">Is SecurePDF really free?</h3>
                     <p className="text-muted-foreground">
                       Yes! SecurePDF is completely free to use with no hidden fees, registration requirements, or usage limits. 
                       The service is supported by minimal, privacy-respecting advertising that doesn't interfere with your document processing.
                     </p>
                   </CardContent>
                 </Card>

                 <Card className="shadow-card bg-gradient-card border-border/50">
                   <CardContent className="p-6">
                     <h3 className="font-semibold text-lg mb-3">How do I remove a password from a PDF?</h3>
                     <p className="text-muted-foreground">
                       SecurePDF is designed for adding password protection to PDFs. To remove a password from an existing protected PDF, 
                       you'll need to use a different tool or PDF reader that supports password removal, provided you know the current password.
                     </p>
                   </CardContent>
                 </Card>
              </div>
            </section>

            {/* Bottom Horizontal Ad - bot_horiz_responsive */}
            <div className="flex justify-center py-8">
              <GoogleAd 
                slot="7978634115"
                style={{ width: '728px', height: '90px', display: 'block', maxWidth: '100%', minWidth: '320px', minHeight: '90px' }}
                className="w-full max-w-[728px] h-[90px]"
              />
            </div>
          </main>
        </div>

        {/* Right Vertical Ad - rhs_vertical_responsive */}
        <div className="hidden lg:flex w-48 flex-shrink-0">
          <div className="sticky top-20 p-4 w-full h-fit">
            <GoogleAd 
              slot="7759142262"
              style={{ width: '160px', height: '600px', display: 'block', minWidth: '160px', minHeight: '600px' }}
              className="w-40 h-[600px]"
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/50 backdrop-blur-sm mt-16">
        <div className="container mx-auto px-4 py-8 text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <div className="w-6 h-6 bg-gradient-primary rounded flex items-center justify-center">
              <Shield className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold">SecurePDF</span>
          </div>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <Link to="/privacy-policy">
              <Button variant="ghost" size="sm">Privacy Policy</Button>
            </Link>
            <Link to="/terms-of-service">
              <Button variant="ghost" size="sm">Terms of Service</Button>
            </Link>
            <Link to="/contact">
              <Button variant="ghost" size="sm">Contact</Button>
            </Link>
            <Link to="/about">
              <Button variant="ghost" size="sm">About SecurePDF</Button>
            </Link>
          </div>
          <div className="text-sm text-muted-foreground">
            <p>© 2025 SecurePDF. All rights reserved.</p>
            <p>Your privacy is protected by design - all processing happens locally in your browser.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
