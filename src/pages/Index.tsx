import { PDFProtector } from "@/components/PDFProtector";
import { AdPlaceholder } from "@/components/AdPlaceholder";
import { Github, Shield, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">SecurePDF</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-12">
        {/* Top Banner Ad */}
        <div className="flex justify-center">
          <AdPlaceholder size="banner" />
        </div>

        {/* Main PDF Protector */}
        <PDFProtector />

        {/* Sidebar Ad - Desktop */}
        <div className="hidden lg:block fixed right-4 top-1/2 -translate-y-1/2">
          <AdPlaceholder size="sidebar" />
        </div>

        {/* Features Section */}
        <section className="space-y-8">
          <h2 className="text-3xl font-bold text-center">Why Choose SecurePDF?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <Card className="shadow-card bg-gradient-card border-border/50 hover:shadow-trust/20 transition-all duration-300">
              <CardContent className="p-6 text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-gradient-security rounded-full flex items-center justify-center">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold">Military-Grade Security</h3>
                <p className="text-muted-foreground">
                  AES-256 encryption ensures your documents are protected with the same 
                  standard used by banks and government agencies.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-card bg-gradient-card border-border/50 hover:shadow-trust/20 transition-all duration-300">
              <CardContent className="p-6 text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-gradient-primary rounded-full flex items-center justify-center">
                  <Lock className="h-8 w-8 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold">Complete Privacy</h3>
                <p className="text-muted-foreground">
                  Your files never leave your browser. All processing happens locally, 
                  ensuring absolute privacy and data protection.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Rectangle Ad - Mobile */}
        <div className="lg:hidden flex justify-center">
          <AdPlaceholder size="rectangle" />
        </div>

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

        {/* Bottom Banner Ad */}
        <div className="flex justify-center">
          <AdPlaceholder size="banner" />
        </div>
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
            <Button variant="ghost" size="sm">
              Privacy Policy
            </Button>
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
    </div>
  );
};

export default Index;