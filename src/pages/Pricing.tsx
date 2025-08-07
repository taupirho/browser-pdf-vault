import { Check, Settings, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SubscriptionStatus {
  subscribed: boolean;
  subscription_tier?: string;
  subscription_end?: string;
}

const Pricing = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<string | null>(null);
  const [managingSubscription, setManagingSubscription] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [user, setUser] = useState<any>(null);
  const plans = [
    {
      name: "Free",
      price: "$0",
      description: "Perfect for trying out our service",
      features: [
        "2 PDFs per day",
        "Max file size: 250KB",
        "Secure encryption",
        "Email support"
      ],
      buttonText: "Get Started",
      popular: false
    },
    {
      name: "Starter",
      price: "$6.99",
      description: "Great for regular users",
      features: [
        "10 PDFs per day",
        "Max file size: 1MB",
        "Secure encryption",
        "Priority email support"
      ],
      buttonText: "Choose Starter",
      popular: true
    },
    {
      name: "Pro",
      price: "$15.99",
      description: "For power users and businesses",
      features: [
        "50 PDFs per day",
        "Max file size: 10MB",
        "Secure encryption",
        "24/7 phone & email support",
        "Custom passwords"
      ],
      buttonText: "Choose Pro",
      popular: false
    }
  ];

  // Check authentication and subscription status
  useEffect(() => {
    const checkAuthAndSubscription = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      
      if (session?.user) {
        try {
          const { data, error } = await supabase.functions.invoke('check-subscription');
          if (!error && data) {
            setSubscriptionStatus(data);
          }
        } catch (error) {
          console.error('Error checking subscription:', error);
        }
      }
    };

    checkAuthAndSubscription();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
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
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to manage your subscription.",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('customer-portal');

      if (error) throw error;

      if (data?.url) {
        // Open Stripe customer portal in a new tab
        window.open(data.url, '_blank');
        
        toast({
          title: "Redirecting to Stripe",
          description: "Opening the customer portal where you can manage your subscription, including cancellation.",
        });
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast({
        title: "Error",
        description: "Failed to open subscription management. Please try again.",
        variant: "destructive",
      });
    } finally {
      setManagingSubscription(false);
    }
  };

  const handlePlanSelection = async (planName: string) => {
    if (planName === "Free") {
      navigate("/");
      return;
    }

    try {
      setLoading(planName);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to subscribe to a plan.",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { plan: planName.toLowerCase() }
      });

      if (error) throw error;

      if (data?.url) {
        // Open Stripe checkout in a new tab
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast({
        title: "Error",
        description: "Failed to start checkout process. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
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
        {user && subscriptionStatus && (
          <div className="max-w-4xl mx-auto mb-12">
            {subscriptionStatus.subscribed ? (
              <Alert className="border-primary/20 bg-primary/5">
                <Check className="h-4 w-4 text-primary" />
                <AlertDescription className="flex items-center justify-between">
                  <div>
                    <strong>Current Plan: {subscriptionStatus.subscription_tier || 'Unknown'}</strong>
                    {subscriptionStatus.subscription_end && (
                      <div className="text-sm text-muted-foreground mt-1">
                        Next billing: {new Date(subscriptionStatus.subscription_end).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleManageSubscription}
                    disabled={managingSubscription}
                    className="ml-4"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    {managingSubscription ? "Loading..." : "Manage Subscription"}
                  </Button>
                </AlertDescription>
              </Alert>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  You're currently on the <strong>Free</strong> plan. Upgrade to unlock higher limits and premium features.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => {
            const isCurrentPlan = subscriptionStatus?.subscription_tier?.toLowerCase() === plan.name.toLowerCase() && subscriptionStatus.subscribed;
            
            return (
            <Card 
              key={index} 
              className={`relative ${plan.popular ? 'border-primary shadow-lg scale-105' : ''} ${isCurrentPlan ? 'border-primary border-2 bg-primary/5' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}
              
              {isCurrentPlan && (
                <div className="absolute -top-3 right-4">
                  <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-medium">
                    Current Plan
                  </span>
                </div>
              )}
              
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-primary">{plan.price}</span>
                  {plan.price !== "$0" && (
                    <div className="text-muted-foreground">
                      <span>/month</span>
                      {plan.price === "$6.99" && <div className="text-sm">or $70/year</div>}
                      {plan.price === "$15.99" && <div className="text-sm">or $150/year</div>}
                    </div>
                  )}
                </div>
                <p className="text-muted-foreground mt-2">{plan.description}</p>
              </CardHeader>

              <CardContent>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <Check className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
                      <span className="text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button 
                  className="w-full" 
                  variant={plan.popular ? "default" : "outline"}
                  onClick={() => isCurrentPlan ? handleManageSubscription() : handlePlanSelection(plan.name)}
                  disabled={loading === plan.name || managingSubscription}
                >
                  {loading === plan.name ? "Loading..." : 
                   isCurrentPlan ? "Manage Plan" : 
                   plan.buttonText}
                </Button>
              </CardContent>
            </Card>
            );
          })}
        </div>

        <div className="text-center mt-16 space-y-4">
          <p className="text-muted-foreground">
            All plans include secure encryption and file deletion after processing.
          </p>
          <p className="text-sm text-muted-foreground">
            You can cancel or modify your subscription anytime through the customer portal.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Pricing;