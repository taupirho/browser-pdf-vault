import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { site } from "@/config/site";
import { Helmet } from 'react-helmet';
import { z } from "zod";

// Valid request types matching server-side validation
const VALID_REQUEST_TYPES = ["access", "erasure", "rectification", "portability", "objection", "restriction", "other"] as const;

// Validation schema matching server-side limits
const dsarSchema = z.object({
  name: z.string().trim().max(100, "Name must be less than 100 characters").optional().default(""),
  email: z.string().trim().min(1, "Email is required").email("Please enter a valid email").max(255, "Email must be less than 255 characters"),
  requestType: z.enum(VALID_REQUEST_TYPES, { errorMap: () => ({ message: "Please select a valid request type" }) }),
  details: z.string().trim().max(5000, "Details must be less than 5000 characters").optional().default(""),
});

type DsarFormData = z.infer<typeof dsarSchema>;

const TrustSecurity = () => {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [requestType, setRequestType] = useState<typeof VALID_REQUEST_TYPES[number]>("access");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof DsarFormData, string>>>({});

  useEffect(() => {
    document.title = "Trust & Security | SecurePDF";
    const metaDesc = document.querySelector('meta[name="description"]');
    const content = "SecurePDF Trust & Security: GDPR rights, data flow, security controls, and DSAR requests.";
    if (metaDesc) {
      metaDesc.setAttribute("content", content);
    } else {
      const m = document.createElement("meta");
      m.name = "description";
      m.content = content;
      document.head.appendChild(m);
    }
    const canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    const href = window.location.origin + "/trust-security";
    if (canonical) canonical.href = href; else {
      const l = document.createElement("link");
      l.rel = "canonical";
      l.href = href;
      document.head.appendChild(l);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate with zod
    const result = dsarSchema.safeParse({ name, email, requestType, details });
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof DsarFormData, string>> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as keyof DsarFormData] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("dsar_requests")
        .insert({
          name: result.data.name,
          email: result.data.email,
          request_type: result.data.requestType,
          details: result.data.details,
        });
      if (error) throw error;

      // Send emails via edge function
      const { error: emailError } = await supabase.functions.invoke("send-dsar-email", {
        body: result.data,
      });

      if (emailError) {
        console.error(emailError);
        toast({
          title: "Request submitted",
          description: "We recorded your request. Email notification failed to send.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Request submitted",
          description: "We recorded your request and sent a confirmation email.",
        });
      }

      setName("");
      setEmail("");
      setRequestType("access");
      setDetails("");
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Something went wrong",
        description: err?.message || "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const clearError = (field: keyof DsarFormData) => {
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };
  return <div className="min-h-screen bg-background">
    <Helmet>
      <title>Trust & Security – SecurePDF</title>
      <meta name="description" content="AES-256, GDPR-compliant PDF protection. Submit DSAR requests and learn how SecurePDF protects your data." />
      <meta name="keywords" content="SecurePDF security, GDPR compliance, AES-256 encryption, DSAR requests" />
      <link rel="canonical" href="https://securepdf.io/trust-security" />
      <meta property="og:title" content="Trust & Security – SecurePDF" />
      <meta property="og:description" content="AES-256, GDPR-compliant PDF protection and DSAR requests." />
      <meta property="og:url" content="https://securepdf.io/trust-security" />
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

    <main className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-10">
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-bold">Trust & Security</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            How SecurePDF protects your privacy and data by design.
          </p>
        </div>

        <section className="grid gap-6 md:grid-cols-2">
          <Card className="shadow-card bg-card border-border/50">
            <CardContent className="p-6 space-y-3">
              <h2 className="text-xl font-semibold">Data Flow (at a glance)</h2>
              <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                <li>PDF is processed locally in your browser</li>
                <li>No password transmission</li>
                <li>Only minimal operational logs on our servers</li>
              </ul>
            </CardContent>
          </Card>
          <Card className="shadow-card bg-card border-border/50">
            <CardContent className="p-6 space-y-3">
              <h2 className="text-xl font-semibold">Security Controls</h2>
              <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                <li>AES-256 encryption</li>
                <li>HTTPS everywhere</li>
                <li>Zero-knowledge: files never reach our servers</li>
              </ul>
            </CardContent>
          </Card>
        </section>

        <Card className="shadow-card bg-card border-border/50">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">Your GDPR Rights</h2>
            <p className="text-muted-foreground">
              You can request access, correction, erasure, restriction, or portability of any personal data we hold about you.
              Use the form below or email {site.contactEmail}. We respond within 30 days.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Name (optional)</label>
                  <Input 
                    value={name} 
                    onChange={e => { setName(e.target.value); clearError("name"); }} 
                    placeholder="Jane Doe"
                    maxLength={100}
                    className={errors.name ? "border-destructive" : ""}
                  />
                  {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Email</label>
                  <Input 
                    type="email" 
                    value={email} 
                    onChange={e => { setEmail(e.target.value); clearError("email"); }} 
                    placeholder="you@example.com"
                    maxLength={255}
                    className={errors.email ? "border-destructive" : ""}
                  />
                  {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Request type</label>
                <Select value={requestType} onValueChange={(val) => { setRequestType(val as typeof VALID_REQUEST_TYPES[number]); clearError("requestType"); }}>
                  <SelectTrigger className={errors.requestType ? "border-destructive" : ""}>
                    <SelectValue placeholder="Select request type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="access">Access</SelectItem>
                    <SelectItem value="erasure">Erasure</SelectItem>
                    <SelectItem value="rectification">Rectification</SelectItem>
                    <SelectItem value="portability">Portability</SelectItem>
                    <SelectItem value="objection">Objection</SelectItem>
                    <SelectItem value="restriction">Restriction</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {errors.requestType && <p className="text-sm text-destructive">{errors.requestType}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Details</label>
                <Textarea 
                  value={details} 
                  onChange={e => { setDetails(e.target.value); clearError("details"); }} 
                  rows={5} 
                  placeholder="Describe your request…"
                  maxLength={5000}
                  className={errors.details ? "border-destructive" : ""}
                />
                {errors.details && <p className="text-sm text-destructive">{errors.details}</p>}
              </div>
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <Button type="submit" disabled={loading}>
                  {loading ? "Submitting…" : "Submit request"}
                </Button>
                <p className="text-xs text-muted-foreground">
                  A record of your request is stored securely to help us respond.
                </p>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="text-sm text-muted-foreground">
          <p>
            Need more info? See our <Link to="/privacy-policy" className="underline underline-offset-2">Privacy Policy</Link> or contact us at {site.contactEmail}.
          </p>
        </div>
      </div>
    </main>
  </div>;
};
export default TrustSecurity;