import { Check, Settings, AlertCircle, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format } from "date-fns";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Helmet } from 'react-helmet';
interface SubscriptionStatus {
  subscribed: boolean;
  subscription_tier?: string;
  subscription_end?: string;
}
const Pricing = () => {
  const {
    toast
  } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<string | null>(null);
  const [managingSubscription, setManagingSubscription] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [user, setUser] = useState<any>(null);
  const CONTACT_SALES_PATH = "/contact";
  const plans = [
    {
      name: "Free",
      price: "$0",
      description: "Perfect for trying out our service",
      features: ["2 PDFs per day", "Max file size: 250KB", "Secure encryption", "Email support"],
      buttonText: "Get Started",
      popular: false
    },
    {
      name: "Starter",
      price: "$6.99",
      description: "Great for regular users",
      features: ["10 PDFs per day", "Max file size: 1MB", "Secure encryption", "Priority email support"],
      buttonText: "Choose Starter",
      popular: false
    },
    {
      name: "Pro",
      price: "$15.99",
      description: "For power users and businesses",
      features: ["50 PDFs per day", "Max file size: 10MB", "Secure encryption", "Custom passwords"],
      buttonText: "Choose Pro",
      popular: false
    },
    {
      name: "LTD",
      price: "$120",
      description: "Lifetime access with Pro features",
      features: ["50 PDFs per day", "Max file size: 10MB", "Secure encryption", "Custom passwords", "Lifetime access - pay once"],
      buttonText: "Choose LTD",
      popular: true
    }
  ];

  // Check authentication and subscription status
  useEffect(() => {
    const checkAuthAndSubscription = async () => {
      const {
        data: {
          session
        }
      } = await supabase.auth.getSession();
      setUser(session?.user || null);
      if (session?.user) {
        try {
          const params = new URLSearchParams(window.location.search);
          const portalReturn = params.get('portal_return') === '1';

          const res = portalReturn
            ? await supabase.functions.invoke('check-subscription', { body: { portalReturn: true } })
            : await supabase.functions.invoke('check-subscription');

          const { data, error } = res as any;
          if (!error && data) {
            setSubscriptionStatus(data);
            if (portalReturn) {
              toast({
                title: "Subscription refreshed",
                description: "If a plan change was scheduled, a confirmation email has been sent.",
              });
              params.delete('portal_return');
              const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
              window.history.replaceState({}, '', newUrl);
            }
          }
        } catch (error) {
          console.error('Error checking subscription:', error);
        }
      }
    };
    checkAuthAndSubscription();

    // Listen for auth changes
    const {
      data: {
        subscription
      }
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        checkAuthAndSubscription();
      } else {
        setSubscriptionStatus(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);
  const handleManageSubscription = async () => {
    try {
      setManagingSubscription(true);
      const {
        data: {
          session
        }
      } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to manage your subscription.",
          variant: "destructive"
        });
        return;
      }
      const {
        data,
        error
      } = await supabase.functions.invoke('customer-portal');
      if (error) {
        console.error('Customer portal error:', error);
        throw new Error(error.message || 'Failed to create customer portal session');
      }
      if (data?.error) {
        console.error('Customer portal data error:', data.error);
        throw new Error(data.error);
      }
      if (data?.url) {
        // Open Stripe customer portal in a new tab
        window.open(data.url, '_blank');
        toast({
          title: "Redirecting to Stripe",
          description: "Opening the customer portal where you can manage your subscription, including cancellation."
        });
      } else {
        throw new Error('No portal URL received from Stripe');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      // Show specific help for Stripe Customer Portal configuration error
      if (errorMessage.includes('No configuration provided') || errorMessage.includes('default configuration has not been created')) {
        toast({
          title: "Stripe Customer Portal Setup Required",
          description: "You need to configure your Stripe Customer Portal settings. Please visit your Stripe dashboard to set this up.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Error",
          description: `Failed to open subscription management: ${errorMessage}`,
          variant: "destructive"
        });
      }
    } finally {
      setManagingSubscription(false);
    }
  };
const handlePlanSelection = async (planName: string) => {
    try {
      setLoading(planName);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: "Authentication Required", description: "Please sign in to manage your plan.", variant: "destructive" });
        navigate("/auth");
        return;
      }

      // Handle Free plan: cancel at period end if currently subscribed
      if (planName === "Free") {
        if (subscriptionStatus?.subscribed) {
          const { data, error } = await supabase.functions.invoke('cancel-subscription');
          if (error) throw error;
          const periodEnd = data?.subscriptions?.[0]?.current_period_end;
          toast({
            title: "Cancellation scheduled",
            description: periodEnd ? `Your subscription will end on ${format(new Date(periodEnd), 'dd-MMM-yyyy')}. You'll stay on your current plan until then.` : "Your subscription will end at the end of the current billing period.",
          });
          // Refresh status
          try {
            const { data: chk } = await supabase.functions.invoke('check-subscription');
            if (chk) setSubscriptionStatus(chk as any);
          } catch {}
        } else {
          toast({ title: "Already on Free", description: "You're already on the Free tier." });
        }
        return;
      }

      // Paid plan selected (Starter/Pro/LTD)
      if (subscriptionStatus?.subscribed) {
        // Redirect to Stripe Customer Portal for plan changes to avoid duplicate subscriptions
        const { data, error } = await supabase.functions.invoke('customer-portal');
        if (error) throw error;
        if (data?.url) {
          window.open(data.url, '_blank');
          toast({ title: "Manage in Stripe", description: "Use the portal to upgrade/downgrade your plan." });
        }
        return;
      }

      // No active subscription -> start checkout for selected plan
      const { data, error } = await supabase.functions.invoke('create-checkout', { body: { plan: planName.toLowerCase() } });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Plan selection error:', error);
      toast({ title: "Error", description: "Could not process your request. Please try again.", variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };
  return <div className="min-h-screen bg-background">
      <Helmet>
        <title>SecurePDF Pricing Plans - Free PDF Password Protection & Pro Features</title>
        <meta name="description" content="Choose from free or paid SecurePDF plans. Free tier: 2 PDFs/day. Starter: 10 PDFs/day at $6.99/month. Pro: 50 PDFs/day at $15.99/month. Cancel anytime." />
        <meta name="keywords" content="PDF protection pricing, secure PDF plans, PDF encryption cost, free PDF password tool, subscription plans" />
        <link rel="canonical" href="https://securepdf.io/pricing" />
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
            <div className="flex items-center gap-2">
              <Link to="/">
                <Button variant="ghost">Back to Home</Button>
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>
      
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Secure your PDFs with the plan that fits your needs
          </p>
        </div>

        {/* Current Subscription Status */}
        {user && subscriptionStatus && <div className="max-w-4xl mx-auto mb-12">
            {subscriptionStatus.subscribed ? <Alert className="border-primary/20 bg-primary/5">
                <Check className="h-4 w-4 text-primary" />
                <AlertDescription className="flex items-center justify-between">
                  <div>
                    <strong>Current Plan: {subscriptionStatus.subscription_tier || 'Unknown'}</strong>
                    {subscriptionStatus.subscription_end && <div className="text-sm text-muted-foreground mt-1">
                        Next billing: {format(new Date(subscriptionStatus.subscription_end), "dd-MMM-yyyy")}
                      </div>}
                  </div>
                  <Button variant="outline" size="sm" onClick={handleManageSubscription} disabled={managingSubscription} className="ml-4">
                    <Settings className="h-4 w-4 mr-2" />
                    {managingSubscription ? "Loading..." : "Manage Subscription"}
                  </Button>
                </AlertDescription>
              </Alert> : <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  You're currently on the <strong>Free</strong> plan. Upgrade to unlock higher limits and premium features.
                </AlertDescription>
              </Alert>}
          </div>}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => {
          const isCurrentPlan = subscriptionStatus?.subscription_tier?.toLowerCase() === plan.name.toLowerCase() && subscriptionStatus.subscribed;
           return <Card key={index} className={`relative ${plan.popular ? 'border-primary shadow-lg scale-105' : ''} ${isCurrentPlan ? 'border-primary border-2 bg-primary/5' : ''}`}>
              {plan.popular && <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>}
              
              {isCurrentPlan && <div className="absolute -top-3 right-4">
                  <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-medium">
                    Current Plan
                  </span>
                </div>}
              
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                <div className="mt-4">
                  <span className={plan.price.startsWith("$") ? "text-4xl font-bold text-primary" : "font-bold text-primary"}>{plan.price}</span>
                  {plan.price.startsWith("$") && plan.price !== "$0" && plan.name !== "LTD" && (
                    <div className="text-muted-foreground">
                      <span>/month per user</span>
                      {plan.price === "$6.99" && <div className="text-sm">or $70/year per user</div>}
                      {plan.price === "$15.99" && <div className="text-sm">or $150/year per user</div>}
                    </div>
                  )}
                  {plan.name === "LTD" && (
                    <div className="text-muted-foreground">
                      <span className="text-sm font-semibold">One-time payment</span>
                    </div>
                  )}
                </div>
                <p className="text-muted-foreground mt-2">{plan.description}</p>
              </CardHeader>

              <CardContent>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => <li key={featureIndex} className="flex items-center">
                      <Check className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
                      <span className="text-foreground">{feature}</span>
                    </li>)}
                </ul>

                <Button className="w-full" variant={plan.popular ? "default" : "outline"} onClick={() => isCurrentPlan ? handleManageSubscription() : handlePlanSelection(plan.name)} disabled={loading === plan.name || managingSubscription}>
                  {loading === plan.name ? "Loading..." : isCurrentPlan ? "Manage Plan" : plan.buttonText}
                </Button>
              </CardContent>
            </Card>;
        })}
        </div>

        <div className="text-center mt-16 space-y-4">
          <p className="text-muted-foreground">
            All plans include secure encryption and file deletion after processing.
          </p>
          <p className="text-sm text-muted-foreground">
            Paid subscribers can cancel or modify their subscriptions anytime using the Manage Subscription link near the top of this page.
          </p>
        </div>
      </div>
    </div>;
};
export default Pricing;
