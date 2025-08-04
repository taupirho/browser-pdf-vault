import { PDFProtector } from "@/components/PDFProtector";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Shield, Lock, Eye, Zap, FileText, HelpCircle, Users, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Link } from "react-router-dom";
import Auth from './Auth';
import type { User, Session } from '@supabase/supabase-js';
const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    // Set up auth state listener FIRST
    const {
      data: {
        subscription
      }
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // THEN check for existing session
    supabase.auth.getSession().then(({
      data: {
        session
      }
    }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Handle login requirement for unauthenticated users
  const handleLoginRequired = () => {
    setShowAuthModal(true);
  };
  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  // Show loading while checking auth status
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center mx-auto mb-4">
            <Shield className="h-5 w-5 text-primary-foreground" />
          </div>
          <p>Loading...</p>
        </div>
      </div>;
  }

  // Show the interface to everyone, but with login modal for unauthenticated users

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
  return <div className="min-h-screen bg-background">
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
                <Link to="/pricing">
                  <Button variant="ghost" size="sm">Pricing</Button>
                </Link>
                <Link to="/about">
                  <Button variant="ghost" size="sm">About</Button>
                </Link>
                <Link to="/contact">
                  <Button variant="ghost" size="sm">Contact</Button>
                </Link>
              </nav>
              {user ? <Button variant="outline" size="sm" onClick={handleSignOut}>
                  Sign Out
                </Button> : <Button variant="outline" size="sm" onClick={() => setShowAuthModal(true)}>
                  Sign In
                </Button>}
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

      {/* Main Content */}
      <div className="min-h-screen">

        <div className="max-w-4xl mx-auto">
          <main className="container mx-auto space-y-12 px-4 py-8">
            {/* Main PDF Protector */}
            <PDFProtector user={user} onLoginRequired={handleLoginRequired} />

            {/* Why Use SecurePDF Section */}
            <section className="space-y-8">
              <h2 className="text-3xl font-bold text-center">Why Use SecurePDF?</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
                {indicators.map((item, index) => <div key={index} className="flex flex-col items-center text-center p-4 rounded-lg bg-card border border-border/50 shadow-card hover:shadow-trust/20 transition-all duration-300">
                    <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center mb-3">
                      <item.icon className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <h3 className="font-semibold text-base mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>)}
              </div>
            </section>

            {/* FAQ Section */}
            <section className="space-y-8">
              <h2 className="text-3xl font-bold text-center">Frequently Asked Questions</h2>
              
              <div className="grid gap-6 max-w-3xl mx-auto">
                <Card className="shadow-card bg-card border-border/50">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-3 text-foreground">Is my PDF really secure?</h3>
                    <p className="text-muted-foreground">
                      Yes! We use AES-256 encryption, the same standard used by banks and military. 
                      The password is generated using cryptographically secure random values, 
                      and all processing happens in your browser.
                    </p>
                  </CardContent>
                </Card>

                <Card className="shadow-card bg-card border-border/50">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-3 text-foreground">What happens to my files?</h3>
                    <p className="text-muted-foreground">
                      Your files never leave your browser. They are read into memory, processed locally, 
                      and then immediately discarded. We never see, store, or have access to your documents.
                    </p>
                  </CardContent>
                </Card>

                <Card className="shadow-card bg-card border-border/50">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-3 text-foreground">What if I lose the password?</h3>
                    <p className="text-muted-foreground">
                      Unfortunately, if you lose the password, the PDF cannot be recovered. This is by design - 
                      it ensures maximum security. Always save the password in a secure location.
                    </p>
                  </CardContent>
                </Card>

                 <Card className="shadow-card bg-card border-border/50">
                   <CardContent className="p-6">
                     <h3 className="font-semibold text-lg mb-3 text-foreground">What is your pricing model?</h3>
                     <p className="text-muted-foreground">The good news is that there is a FREE tier. Once registered, you can password-protect two files per day, with each file being a maximum of 250KB in size. Alternatively, you can opt to pay for higher limits. For $4.99 per month (or $50 per year), the starter tier allows you to password-protect up to 10 files per day, with each file being up to 1MB in size. Our Pro tier allows you to password protect up to 50 files per day, each of up to 10MB in size. That costs $15.99 per month or $150 per year. </p>
                   </CardContent>
                 </Card>

                 <Card className="shadow-card bg-card border-border/50">
                   <CardContent className="p-6">
                     <h3 className="font-semibold text-lg mb-3 text-foreground">How strong is the encryption?</h3>
                     <p className="text-muted-foreground">
                       SecurePDF uses AES-256 encryption, the same military-grade standard used by governments and financial institutions worldwide. 
                       This encryption is virtually unbreakable with current technology and would take billions of years to crack with today's computers.
                     </p>
                   </CardContent>
                 </Card>

                 <Card className="shadow-card bg-card border-border/50">
                   <CardContent className="p-6">
                     <h3 className="font-semibold text-lg mb-3 text-foreground">Can I use this for sensitive documents?</h3>
                     <p className="text-muted-foreground">
                       Absolutely! Since all processing happens locally in your browser and files never touch our servers, 
                       SecurePDF is perfect for confidential business documents, legal papers, medical records, and other sensitive materials. 
                       Your privacy is guaranteed by design.
                     </p>
                   </CardContent>
                 </Card>

                 <Card className="shadow-card bg-card border-border/50">
                   <CardContent className="p-6">
                     <h3 className="font-semibold text-lg mb-3 text-foreground">What browsers are supported?</h3>
                     <p className="text-muted-foreground">
                       SecurePDF works in all modern web browsers including Chrome, Firefox, Safari, and Edge. 
                       We use standard Web APIs for cryptography and file handling, ensuring broad compatibility across desktop and mobile devices.
                     </p>
                   </CardContent>
                 </Card>

                 <Card className="shadow-card bg-card border-border/50">
                   <CardContent className="p-6">
                     <h3 className="font-semibold text-lg mb-3 text-foreground">Is SecurePDF really free?</h3>
                     <p className="text-muted-foreground">Yes! Registered users can instantly use SecurePDF to password-protect 2 PDFs per day, with each file being up to 250KB in size.</p>
                   </CardContent>
                 </Card>

                 <Card className="shadow-card bg-card border-border/50">
                   <CardContent className="p-6">
                     <h3 className="font-semibold text-lg mb-3 text-foreground">How do I remove a password from a PDF?</h3>
                     <p className="text-muted-foreground">
                       SecurePDF is designed for adding password protection to PDFs. To remove a password from an existing protected PDF, 
                       you'll need to use a different tool or PDF reader that supports password removal, provided you know the current password.
                     </p>
                   </CardContent>
                 </Card>
              </div>
            </section>

          </main>
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

      {/* Auth Modal */}
      <Dialog open={showAuthModal} onOpenChange={setShowAuthModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Sign in to SecurePDF
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <Auth isModal={true} onSuccess={() => setShowAuthModal(false)} />
          </div>
        </DialogContent>
      </Dialog>
    </div>;
};
export default Index;