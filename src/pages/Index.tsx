import { PDFProtector } from "@/components/PDFProtector";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Github, Shield, Lock, Eye, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
  return <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center justify-between mx-[10px] my-0 py-[15px] px-[16px]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">SecurePDF</span>
          </div>
          <div className="flex-1 text-center -ml-20 mx-[13px]">
            <span className="font-bold bg-gradient-hero bg-clip-text text-transparent text-sm py-[6px] my-0 mx-[19px] px-[67px] text-center">Free, Secure 
PDF Password Protection</span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-12">

        {/* Main PDF Protector */}
        <PDFProtector />

        {/* Why Use SecurePDF Section */}
        <section className="space-y-8">
          <h2 className="text-3xl font-bold text-center">Why Use SecurePDF?</h2>
          
          <div className="flex justify-center items-center gap-4">
            {indicators.map((item, index) => <div key={index} className="flex flex-col items-center text-center p-3 rounded-lg bg-card border border-border/50 shadow-card hover:shadow-trust/20 transition-all duration-300 w-[240px]">
                <div className="w-7 h-7 bg-gradient-primary rounded-full flex items-center justify-center mb-2">
                  <item.icon className="h-4 w-4 text-primary-foreground" />
                </div>
                <h3 className="font-semibold text-sm mb-1">{item.title}</h3>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>)}
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
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/50 backdrop-blur-sm mt-16">
        <div className="container mx-auto px-4 py-8 text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <div className="w-6 h-6 bg-gradient-primary rounded flex items-center justify-center">
              <Shield className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold">SecurePDF</span>
          </div>
          <div className="flex justify-center gap-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                  Privacy Policy
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>SecurePDF – Privacy Policy</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 text-sm">
                  <p className="text-muted-foreground">Last revised 9 July 2025</p>
                  
                  <p>This Privacy Policy explains what personal data SecurePDF ("we", "our", "the Service") collects, how we use it, and the choices you have. SecurePDF is operated from Scotland; Scottish data-protection law and the UK GDPR apply.</p>

                  <div>
                    <h3 className="font-semibold mb-2">1 What we do not collect</h3>
                    <p className="mb-2"><strong>PDF files & passwords</strong> – 100% of the encryption happens in your browser.</p>
                    <p className="mb-2">Your documents, the generated password, and any derived bytes never leave your device.</p>
                    <p><strong>User-supplied text or metadata inside the PDF</strong> – never transmitted.</p>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">2 Data we do collect</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-border">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left p-2 border-r border-border">Category</th>
                            <th className="text-left p-2 border-r border-border">What</th>
                            <th className="text-left p-2 border-r border-border">Why</th>
                            <th className="text-left p-2">Retention</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-border">
                            <td className="p-2 border-r border-border">Basic logs</td>
                            <td className="p-2 border-r border-border">IP address, browser user-agent, timestamp (in standard web-server logs)</td>
                            <td className="p-2 border-r border-border">Detect abuse, diagnose outages</td>
                            <td className="p-2">30 days, then anonymised</td>
                          </tr>
                          <tr className="border-b border-border">
                            <td className="p-2 border-r border-border">Error telemetry (front-end)</td>
                            <td className="p-2 border-r border-border">Anonymised stack traces (no file content)</td>
                            <td className="p-2 border-r border-border">Fix bugs</td>
                            <td className="p-2">90 days</td>
                          </tr>
                          <tr>
                            <td className="p-2 border-r border-border">Advertising cookies (Google AdSense)</td>
                            <td className="p-2 border-r border-border">Google may set or read cookies to personalise ads and limit frequency</td>
                            <td className="p-2 border-r border-border">Fund the free service</td>
                            <td className="p-2">Controlled by Google; see their policy</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <p className="mt-2">We do not combine log data with advertising identifiers, nor attempt to re-identify users from anonymised error reports.</p>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">3 Legal basis</h3>
                    <p className="mb-2"><strong>Legitimate interests</strong> – operating and securing the web-site (Recital 47 UK GDPR).</p>
                    <p><strong>Consent</strong> – AdSense cookies load only after you click "Accept Cookies".</p>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">4 Your rights</h3>
                    <p>Under UK GDPR/Scots law you can: access, correct, erase, or restrict processing of any personal data we hold about you. Contact us (see §7) with your request; we'll respond within 30 days. Because we store no document content, we cannot help recover lost passwords.</p>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">5 Children</h3>
                    <p>SecurePDF is not directed to children under 13. We do not knowingly collect personal data from them.</p>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">6 Changes</h3>
                    <p>We may update this Privacy Policy from time to time. Material changes are announced on the homepage; the new policy becomes effective when posted.</p>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">7 Contact</h3>
                    <p>Questions or data-rights requests: securemypdfdoc@gmail.com</p>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">8 Governing law</h3>
                    <p>This Policy is governed by the laws of Scotland and the UK, and any dispute falls under the exclusive jurisdiction of the Scottish and UK courts.</p>
                  </div>

                  <div className="p-4 bg-muted rounded-lg">
                    <p className="font-medium">Key takeaway:</p>
                    <p>Apart from minimal server logs and optional advertising cookies, SecurePDF processes everything locally in your browser, so your PDF content and password never touch our servers.</p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                  Terms of Use
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>SecurePDF – Terms of Use</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 text-sm">
                  <p className="text-muted-foreground">Last revised 9 July 2025</p>
                  
                  <div>
                    <h3 className="font-semibold mb-2">Service Description</h3>
                    <p>SecurePDF is a browser-based utility that lets you add password protection to PDF files entirely on your local device. No copy of your document is uploaded, stored, or otherwise transmitted to our servers.</p>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Your Responsibility</h3>
                    <p>You remain solely responsible for the content you process, including any confidential or copyrighted material. By using the service, you confirm you have the legal right to handle that content.</p>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">No Data Storage</h3>
                    <p>All processing is performed client-side in your browser. We do not receive, collect, or store your PDF files or the passwords you generate.</p>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Security & Encryption</h3>
                    <p>PDFs are encrypted using the AES-256 algorithm implemented in the open-source pdf-lib-plus-encrypt library. Keep it safe—if it is lost, we cannot help you recover access to the document.</p>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Disclaimer of Warranties</h3>
                    <p>The service is provided "as is" and "as available." We make no warranties, express or implied, regarding reliability, fitness for a particular purpose, or error-free operation. Nothing in these Terms limits any statutory rights you may have under Scots consumer law.</p>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Limitation of Liability</h3>
                    <p>To the fullest extent permitted by Scots law, SecurePDF, its owners, and contributors shall not be liable for any direct, indirect, incidental, or consequential losses arising from use of the service—including but not limited to loss of data, loss of profits, or security breaches resulting from weak or compromised passwords.</p>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Prohibited Use</h3>
                    <p>You may not use the service to create or distribute content that is illegal under Scots or UK-wide law, infringes copyright, violates privacy, or facilitates malicious activity.</p>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Changes to the Service</h3>
                    <p>We may modify, suspend, or discontinue the service at any time without notice. Updated Terms of Use will be posted on this page and become effective upon publication.</p>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Governing Law</h3>
                    <p>These Terms are governed by the laws of Scotland and the UK. Any dispute arising under or in connection with the service shall be subject to the exclusive jurisdiction of the Scottish courts.</p>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Contact</h3>
                    <p>Questions about these Terms? Email us at securemypdfdoc@gmail.com.</p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </footer>
    </div>;
};
export default Index;