import { Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Card, CardContent } from "@/components/ui/card";
import { Helmet } from 'react-helmet';

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Terms of Service – SecurePDF</title>
        <meta name="description" content="SecurePDF Terms of Service: acceptable use, data privacy and user responsibilities for our browser-based PDF tool." />
        <meta name="keywords" content="SecurePDF terms, acceptable use, legal terms" />
        <link rel="canonical" href="https://securepdf.io/terms-of-service" />
        <meta property="og:title" content="Terms of Service – SecurePDF" />
        <meta property="og:description" content="Acceptable use, data privacy, and user responsibilities." />
        <meta property="og:url" content="https://securepdf.io/terms-of-service" />
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
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">Terms of Service</h1>
            <p className="text-muted-foreground">Last revised 9 July 2025</p>
          </div>

          <Card className="shadow-card bg-card border-border/50">
            <CardContent className="p-8 space-y-6">
              <div>
                <h3 className="font-semibold text-lg mb-3 text-foreground">Service Description</h3>
                <p className="text-foreground">SecurePDF is a browser-based utility that lets you add password protection to PDF files entirely on your local device. No copy of your document is uploaded, stored, or otherwise transmitted to our servers.</p>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-3 text-foreground">Your Responsibility</h3>
                <p className="text-foreground">You remain solely responsible for the content you process, including any confidential or copyrighted material. By using the service, you confirm you have the legal right to handle that content.</p>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-3 text-foreground">No Data Storage</h3>
                <p className="text-foreground">All processing is performed client-side in your browser. We do not receive, collect, or store your PDF files or the passwords you generate.</p>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-3 text-foreground">Security & Encryption</h3>
                <p className="text-foreground">PDFs are encrypted using the AES-256 algorithm implemented in the open-source pdf-lib-plus-encrypt library. We strongly recommend saving your password in a secure location—if it is lost, we cannot help you recover access to the document.</p>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-3 text-foreground">Copyright & DMCA Compliance</h3>
                <p className="text-foreground">SecurePDF is a tool for legitimate document protection. You may only process content you own or have explicit permission to modify. We do not facilitate copyright infringement. If you believe copyrighted material is being processed through our service, contact us at info@securepdf.io with details.</p>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-3 text-foreground">Acceptable Use Policy</h3>
                <p className="text-foreground">You agree not to use SecurePDF to:</p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li className="text-foreground">Process documents containing illegal content under UK or international law</li>
                  <li className="text-foreground">Violate anyone's intellectual property rights</li>
                  <li className="text-foreground">Distribute malware, spam, or other harmful content</li>
                  <li className="text-foreground">Attempt to reverse-engineer or compromise the service</li>
                  <li className="text-foreground">Use the service in any way that could damage, disable, or overburden our infrastructure</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-3 text-foreground">Disclaimer of Warranties</h3>
                <p className="text-foreground">The service is provided "as is" and "as available." We make no warranties, express or implied, regarding reliability, fitness for a particular purpose, or error-free operation. Nothing in these Terms limits any statutory rights you may have under Scots consumer law.</p>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-3 text-foreground">Limitation of Liability</h3>
                <p className="text-foreground">To the fullest extent permitted by Scots law, SecurePDF, its owners, and contributors shall not be liable for any direct, indirect, incidental, or consequential losses arising from use of the service—including but not limited to loss of data, loss of profits, or security breaches resulting from weak or compromised passwords.</p>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-3 text-foreground">Changes to the Service</h3>
                <p className="text-foreground">We may modify, suspend, or discontinue the service at any time without notice. Updated Terms of Service will be posted on this page and become effective upon publication.</p>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-3 text-foreground">Governing Law</h3>
                <p className="text-foreground">These Terms are governed by the laws of Scotland and the UK. Any dispute arising under or in connection with the service shall be subject to the exclusive jurisdiction of the Scottish courts.</p>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-3 text-foreground">Contact</h3>
                <p className="text-foreground">Questions about these Terms? Email us at info@securepdf.io.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default TermsOfService;