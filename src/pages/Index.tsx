import { PDFProtector } from "@/components/PDFProtector";
import { BatchPDFProtector } from "@/components/BatchPDFProtector";
import { ThemeToggle } from "@/components/ThemeToggle";
import { MobileMenu } from "@/components/MobileMenu";
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Helmet } from 'react-helmet';
import { Shield, Lock, Eye, Zap, FileText, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import Auth from './Auth';
import type { User, Session } from '@supabase/supabase-js';
const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [mode, setMode] = useState<'single' | 'batch'>('single');
  const [userTier, setUserTier] = useState<string>('free');
  const navigate = useNavigate();
  useEffect(() => {
    const currentUrl = new URL(window.location.href);
    const isLovablePreview = currentUrl.searchParams.has('__lovable_token');

    // Capture referral code from URL before cleaning
    const refCode = currentUrl.searchParams.get('ref');
    if (refCode) {
      localStorage.setItem('referral_code', refCode);
    }

    // Clean URLs with non-internal query parameters for SEO (skip in Lovable preview)
    if (!isLovablePreview) {
      const hasNonInternalParams = Array.from(currentUrl.searchParams.keys()).some(
        key => !key.startsWith('__')
      );
      if (hasNonInternalParams) {
        const cleanUrl = new URL(currentUrl.href);
        Array.from(cleanUrl.searchParams.keys()).forEach(key => {
          if (!key.startsWith('__')) cleanUrl.searchParams.delete(key);
        });
        const newUrl = cleanUrl.searchParams.toString()
          ? `${cleanUrl.pathname}?${cleanUrl.searchParams.toString()}`
          : cleanUrl.pathname;
        window.history.replaceState({}, document.title, newUrl);
      }
    }

    // Set canonical URL dynamically
    const canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (canonicalLink) {
      canonicalLink.href = 'https://securepdf.io/';
    }

    // Set up auth state listener FIRST
    const {
      data: {
        subscription
      }
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);

      // Defer Supabase calls with setTimeout to prevent deadlock
      if (session?.user) {
        setTimeout(() => {
          supabase.from('profiles').select('subscription_tier').eq('user_id', session.user.id).single().then(({
            data
          }) => {
            if (data) setUserTier(data.subscription_tier);
          });
        }, 0);
      } else {
        setUserTier('free');
      }
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

      // Fetch user tier if logged in
      if (session?.user) {
        supabase.from('profiles').select('subscription_tier').eq('user_id', session.user.id).single().then(({
          data
        }) => {
          if (data) setUserTier(data.subscription_tier);
        });
      }
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
    description: "No hanging around"
  }];
  return <div className="min-h-screen bg-background">
    <Helmet>
      <title>SecurePDF – Free Online PDF Password Protection</title>
      <meta name="description" content="Client-side AES-256 PDF encryption. 100% browser-based, no uploads, free. Password-protect sensitive documents in seconds." />
      <meta name="keywords" content="SecurePDF, PDF password protection, encrypt PDF, AES-256 encryption, client-side encryption" />
      <link rel="canonical" href="https://securepdf.io/" />
      <meta property="og:title" content="SecurePDF – Free Online PDF Password Protection" />
      <meta property="og:description" content="Client-side AES-256 PDF encryption. 100% browser-based, no uploads, free." />
      <meta property="og:url" content="https://securepdf.io/" />
    </Helmet>

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

          {/* Center text - hidden on mobile/tablet, visible on larger screens */}
          <div className="hidden lg:block absolute left-1/2 transform -translate-x-1/2">
            <span className="font-bold bg-gradient-hero bg-clip-text text-transparent whitespace-nowrap text-xl">Secure PDF Password Protection</span>
          </div>

          <div className="flex items-center gap-2 lg:gap-4">
            <nav className="hidden lg:flex items-center gap-1">
              <Link to="/pricing">
                <Button variant="ghost" size="sm">Pricing</Button>
              </Link>
              <Link to="/about">
                <Button variant="ghost" size="sm">About</Button>
              </Link>
              <Link to="/contact">
                <Button variant="ghost" size="sm">Contact</Button>
              </Link>
              {user && <Link to="/account">
                  <Button variant="ghost" size="sm">My Account</Button>
                </Link>}
            </nav>
            {user ? <Button variant="outline" size="sm" onClick={handleSignOut} className="hidden lg:inline-flex">
              Sign Out
            </Button> : <Button variant="outline" size="sm" onClick={() => setShowAuthModal(true)} className="hidden lg:inline-flex">
              Sign In
            </Button>}
            <ThemeToggle />
            <MobileMenu user={user} onSignIn={() => setShowAuthModal(true)} onSignOut={handleSignOut} />
          </div>
        </div>

        {/* Mobile/Tablet tagline - visible below lg breakpoint */}
        <div className="lg:hidden mt-2 text-center">
          <span className="font-medium bg-gradient-hero bg-clip-text text-transparent text-center text-lg">Secure PDF Password Protection</span>
        </div>
      </div>
    </header>

    {/* Main Content */}
    <div className="min-h-screen">

      <div className="max-w-4xl mx-auto">
        <main className="container mx-auto space-y-12 px-4 py-8">
          <h1 className="sr-only">Secure PDF Password Protection & AES-256 Encryption</h1>
          {/* Mode Toggle */}
          <div className="flex justify-center">
            <Tabs value={mode} onValueChange={v => setMode(v as 'single' | 'batch')}>
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="single" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Single File
                </TabsTrigger>
                <TabsTrigger value="batch" className="flex items-center gap-2" disabled={!user || !['pro', 'ltd'].includes(userTier)}>
                  <Layers className="h-4 w-4" />
                  Batch Mode
                  {(!user || !['pro', 'ltd'].includes(userTier)) && <Badge variant="secondary" className="ml-1 text-xs">Pro/LTD</Badge>}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          {/* Main PDF Protector */}
          {mode === 'batch' ? <BatchPDFProtector user={user} onLoginRequired={handleLoginRequired} /> : <PDFProtector user={user} onLoginRequired={handleLoginRequired} />}


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
                  <h3 className="font-semibold text-lg mb-3 text-foreground">What is your pricing model?</h3>
                  <p className="text-muted-foreground">The good news is that there is a FOREVER FREE tier. Once registered, you can password-protect one file per day, with each file being a maximum of 250KB in size. Try it out, and if you like what you see, you can opt to pay for higher limits. For $6.99 per month (or $70 per year), the Starter tier allows you to password-protect up to 10 files per day, with each file being up to 1MB in size. Our Pro tier allows you to password-protect and/or watermark up to 50 files per day, each of up to 10MB in size, and you can also specify the length and format of any generated passwords. That costs $15.99 per month or $150 per year. We also offer a Life Time Deal for $120 one-time payment with all Pro features and no recurring billing. Contact us if your needs exceed these limits.</p>
                </CardContent>
              </Card>

              <Card className="shadow-card bg-card border-border/50">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-3 text-foreground">Are my payment details secure?</h3>
                  <p className="text-muted-foreground">Yes—your payment details are handled by Stripe, not us. We never see or store your full card number or CVC. Your card info is sent directly to Stripe over an encrypted connection and stored securely by them. Stripe is a PCI DSS Level 1–certified provider (the highest level). We only keep non-sensitive details (like the last 4 digits and card brand) and a token so we can bill you. We also use HTTPS everywhere, require 2-factor auth on our admin access, and follow Stripe’s best practices for webhooks and API keys. You can remove your payment method at any time. Once logged in, you can manage your subscription using the link on the Pricing page.</p>
                </CardContent>
              </Card>

              <Card className="shadow-card bg-card border-border/50">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-3 text-foreground">What happens to my files?</h3>
                  <p className="text-muted-foreground">Your files never leave your browser. They are read into memory and processed locally. The newly created password-protected or watermarked PDF is downloaded to your local file system and then immediately discarded from our system memory. Your original input PDF is unchanged and is also discarded after processing. An appropriate password is created for your new PDF, which IS stored on our system and is accessible in your My Account page. We never see, store, or have direct access to your document contents.</p>
                </CardContent>
              </Card>

              <Card className="shadow-card bg-card border-border/50">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-3 text-foreground">What if I lose the password?</h3>
                  <p className="text-muted-foreground">If you forget or lose your PDF document password. We maintain a list of the last 50 document file names and the passwords that were generated for them. This information is viewable from your My Account page. Remember, if you still have your original PDF document, you can always password- protect it again if required.</p>
                </CardContent>
              </Card>

              <Card className="shadow-card bg-card border-border/50">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-3 text-foreground">Are my PDF's really secure?</h3>
                  <p className="text-muted-foreground">Yes! We use AES-256 encryption, the same standard used by banks and the military. The password is generated using cryptographically secure random values, and all processing happens in your browser. </p>
                </CardContent>
              </Card>

              <Card className="shadow-card bg-card border-border/50">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-3 text-foreground">How do I start?</h3>
                  <p className="text-muted-foreground">Simply sign up using your email and a password. After that, you can use the FREE tier to see if you like the product. If you do, you can switch to a paid plan for higher limits. We use Stripe to process payments, which can be made using your Credit Card. You can elect to pay monthly or for a whole year and can amend or cancel your subscription at ANY time.</p>
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
                  <h3 className="font-semibold text-lg mb-3 text-foreground">What is PDF watermarking?</h3>
                  <p className="text-muted-foreground">Pro and Lifetime Deal subscribers have access to PDF watermarking, allowing you to add custom text overlays to your documents. You can customize the watermark text (e.g., "CONFIDENTIAL", your company name, or recipient info), choose from multiple positions (diagonal, center, or corners), and adjust opacity, font size, rotation, and color. Watermarks can be used alongside password protection or on their own. Like all our features, watermarking happens entirely in your browser—your files never leave your device.</p>
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
                  <h3 className="font-semibold text-lg mb-3 text-foreground">What kind of passwords do you generate?</h3>
                  <p className="text-muted-foreground">For the Free and Starter tiers, the password is a random 13 character long piece of text consisting of a mix of upper and lowercase letters, numbers and other common keyboard symbols such as the dollar sign ($), underscore character (_), the hash sign (#) etc ... Pro tier and Life Time Deal users can specify the length and format of the password, e.g. must be a minimum of 15 characters long and only contain lowercase letters.</p>
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
    <footer className="border-t border-border/50 bg-card/50 backdrop-blur-sm mt-16 mb-16">
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
          <Link to="/trust-security">
            <Button variant="ghost" size="sm">Trust & Security</Button>
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