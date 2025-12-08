import { Shield, Mail, MapPin, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";
import { supabase } from "@/integrations/supabase/client";
import { Helmet } from 'react-helmet';
import { z } from "zod";

// Validation schema matching server-side limits
const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  email: z.string().trim().min(1, "Email is required").email("Please enter a valid email").max(255, "Email must be less than 255 characters"),
  subject: z.string().trim().min(1, "Subject is required").max(200, "Subject must be less than 200 characters"),
  message: z.string().trim().min(1, "Message is required").max(5000, "Message must be less than 5000 characters"),
});

type ContactFormData = z.infer<typeof contactSchema>;

const Contact = () => {
  const [formData, setFormData] = useState<ContactFormData>({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ContactFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate with zod
    const result = contactSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof ContactFormData, string>> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as keyof ContactFormData] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-contact-email", {
        body: result.data,
      });

      if (error) throw error;

      toast({
        title: "Message sent",
        description: "We sent you a confirmation email. We'll reply within 48 hours.",
      });

      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Failed to send message",
        description: err?.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name as keyof ContactFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Contact SecurePDF Support – Get Expert Help with PDF Encryption & Password Protection</title>

        <meta
          name="description"
          content="Get fast, secure support from the SecurePDF team. Whether you need help with PDF password protection, encryption issues, privacy questions, or business partnerships — our team is here to assist you."
        />

        <meta
          name="keywords"
          content="SecurePDF support, PDF encryption help, contact SecurePDF, PDF password protection assistance, privacy support, security inquiries, business contact"
        />

        <link rel="canonical" href="https://securepdf.io/contact" />
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
        <div className="space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">Contact Us</h1>
            <p className="text-muted-foreground">Get in touch with any questions or feedback about SecurePDF</p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {/* Contact Form */}
            <Card className="shadow-card bg-card border-border/50">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4 text-foreground">Send us a message</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      maxLength={100}
                      className={errors.name ? "border-destructive" : ""}
                    />
                    {errors.name && <p className="text-sm text-destructive mt-1">{errors.name}</p>}
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      maxLength={255}
                      className={errors.email ? "border-destructive" : ""}
                    />
                    {errors.email && <p className="text-sm text-destructive mt-1">{errors.email}</p>}
                  </div>
                  <div>
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      maxLength={200}
                      className={errors.subject ? "border-destructive" : ""}
                    />
                    {errors.subject && <p className="text-sm text-destructive mt-1">{errors.subject}</p>}
                  </div>
                  <div>
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      name="message"
                      rows={5}
                      value={formData.message}
                      onChange={handleChange}
                      maxLength={5000}
                      className={errors.message ? "border-destructive" : ""}
                    />
                    {errors.message && <p className="text-sm text-destructive mt-1">{errors.message}</p>}
                  </div>
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? "Sending..." : "Send Message"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <div className="space-y-6">
              <Card className="shadow-card bg-card border-border/50">
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4 text-foreground">Contact Information</h2>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-foreground">Email</p>
                        <p className="text-muted-foreground">info@securepdf.io</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-foreground">Location</p>
                        <p className="text-muted-foreground">Scotland, United Kingdom</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-foreground">Response Time</p>
                        <p className="text-muted-foreground">Within 48 hours</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-card bg-card border-border/50">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-3 text-foreground">Frequently Asked Subjects</h3>
                  <div className="space-y-2 text-sm">
                    <p className="text-foreground"><strong>Technical Support:</strong> Issues with PDF processing or encryption</p>
                    <p className="text-foreground"><strong>Privacy Questions:</strong> How your data is handled</p>
                    <p className="text-foreground"><strong>Feature Requests:</strong> Suggestions for improving SecurePDF</p>
                    <p className="text-foreground"><strong>Business Inquiries:</strong> Partnership or licensing opportunities</p>
                    <p className="text-foreground"><strong>Legal Matters:</strong> DMCA notices or terms clarification</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-card bg-card border-border/50">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-3 text-foreground">Privacy Note</h3>
                  <p className="text-sm text-muted-foreground">
                    When you contact us, we collect only the information you provide in your message.
                    This is used solely to respond to your inquiry and is not shared with third parties.
                    See our <Link to="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link> for details.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Contact;