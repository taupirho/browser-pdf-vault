import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Pricing = () => {
  const plans = [
    {
      name: "Free",
      price: "$0",
      description: "Perfect for trying out our service",
      features: [
        "2 PDFs per day",
        "Max file size: 250KB",
        "Basic encryption",
        "Email support"
      ],
      buttonText: "Get Started",
      popular: false
    },
    {
      name: "Starter",
      price: "$9.99",
      description: "Great for regular users",
      features: [
        "10 PDFs per day",
        "Max file size: 1MB",
        "Advanced encryption",
        "Priority email support",
        "Custom passwords"
      ],
      buttonText: "Choose Starter",
      popular: true
    },
    {
      name: "Pro",
      price: "$29.99",
      description: "For power users and businesses",
      features: [
        "50 PDFs per day",
        "Max file size: 10MB",
        "Enterprise encryption",
        "24/7 phone & email support",
        "Custom passwords",
        "Bulk processing",
        "API access"
      ],
      buttonText: "Choose Pro",
      popular: false
    }
  ];

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

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <Card 
              key={index} 
              className={`relative ${plan.popular ? 'border-primary shadow-lg scale-105' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}
              
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-primary">{plan.price}</span>
                  {plan.price !== "$0" && <span className="text-muted-foreground">/month</span>}
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
                >
                  {plan.buttonText}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-16">
          <p className="text-muted-foreground">
            All plans include secure encryption and file deletion after processing.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Pricing;