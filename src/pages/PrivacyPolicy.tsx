import { Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
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
            <Link to="/">
              <Button variant="ghost">Back to Tool</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">Privacy Policy</h1>
            <p className="text-muted-foreground">Last revised 9 July 2025</p>
          </div>

          <Card className="shadow-card bg-card border-border/50">
            <CardContent className="p-8 space-y-6">
              <p className="text-foreground">This Privacy Policy explains what personal data SecurePDF ("we", "our", "the Service") collects, how we use it, and the choices you have. SecurePDF is operated from Scotland; Scottish data-protection law and the UK GDPR apply.</p>

              <div>
                <h3 className="font-semibold text-lg mb-3 text-foreground">1. What we do not collect</h3>
                <p className="mb-2 text-foreground"><strong>PDF files & passwords</strong> – 100% of the encryption happens in your browser.</p>
                <p className="mb-2 text-foreground">Your documents, the generated password, and any derived bytes never leave your device.</p>
                <p className="text-foreground"><strong>User-supplied text or metadata inside the PDF</strong> – never transmitted.</p>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-3 text-foreground">2. Data we do collect</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-border">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="text-left p-3 border-r border-border text-foreground">Category</th>
                        <th className="text-left p-3 border-r border-border text-foreground">What</th>
                        <th className="text-left p-3 border-r border-border text-foreground">Why</th>
                        <th className="text-left p-3 text-foreground">Retention</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-border">
                        <td className="p-3 border-r border-border text-foreground">Basic logs</td>
                        <td className="p-3 border-r border-border text-foreground">IP address, browser user-agent, timestamp (in standard web-server logs)</td>
                        <td className="p-3 border-r border-border text-foreground">Detect abuse, diagnose outages</td>
                        <td className="p-3 text-foreground">30 days, then anonymised</td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="p-3 border-r border-border text-foreground">Error telemetry (front-end)</td>
                        <td className="p-3 border-r border-border text-foreground">Anonymised stack traces (no file content)</td>
                        <td className="p-3 border-r border-border text-foreground">Fix bugs</td>
                        <td className="p-3 text-foreground">90 days</td>
                      </tr>
                      <tr>
                        <td className="p-3 border-r border-border text-foreground">Advertising cookies (Google AdSense)</td>
                        <td className="p-3 border-r border-border text-foreground">Google may set or read cookies to personalise ads and limit frequency</td>
                        <td className="p-3 border-r border-border text-foreground">Fund the free service</td>
                        <td className="p-3 text-foreground">Controlled by Google; see their policy</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="mt-3 text-foreground">We do not combine log data with advertising identifiers, nor attempt to re-identify users from anonymised error reports.</p>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-3 text-foreground">3. Legal basis</h3>
                <p className="mb-2 text-foreground"><strong>Legitimate interests</strong> – operating and securing the web-site (Recital 47 UK GDPR).</p>
                <p className="text-foreground"><strong>Consent</strong> – AdSense cookies load only after you click "Accept Cookies".</p>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-3 text-foreground">4. Your rights</h3>
                <p className="text-foreground">Under UK GDPR/Scots law you can: access, correct, erase, or restrict processing of any personal data we hold about you. Contact us (see §7) with your request; we'll respond within 30 days. Because we store no document content, we cannot help recover lost passwords.</p>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-3 text-foreground">5. Children</h3>
                <p className="text-foreground">SecurePDF is not directed to children under 13. We do not knowingly collect personal data from them.</p>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-3 text-foreground">6. Changes</h3>
                <p className="text-foreground">We may update this Privacy Policy from time to time. Material changes are announced on the homepage; the new policy becomes effective when posted.</p>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-3 text-foreground">7. Contact</h3>
                <p className="text-foreground">Questions or data-rights requests: securemypdfdoc@gmail.com</p>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-3 text-foreground">8. Governing law</h3>
                <p className="text-foreground">This Policy is governed by the laws of Scotland and the UK, and any dispute falls under the exclusive jurisdiction of the Scottish and UK courts.</p>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <p className="font-medium mb-2 text-foreground">Key takeaway:</p>
                <p className="text-foreground">Apart from minimal server logs and optional advertising cookies, SecurePDF processes everything locally in your browser, so your PDF content and password never touch our servers.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default PrivacyPolicy;