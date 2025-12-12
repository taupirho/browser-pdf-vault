import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import { supabase } from "@/integrations/supabase/client";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shield, User, CreditCard, FileText, Calendar, TrendingUp, Crown, Loader2, History, Clock, Eye, EyeOff, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ReferralCard } from "@/components/ReferralCard";
import type { User as SupabaseUser } from "@supabase/supabase-js";
interface PdfHistoryItem {
  id: string;
  file_name: string;
  original_size_bytes: number;
  protected_size_bytes: number;
  created_at: string;
  password: string | null;
}
interface UserProfile {
  subscription_tier: string;
  max_file_size_kb: number;
  max_daily_files: number;
  daily_usage_count: number;
  last_usage_reset: string;
  created_at: string;
  email: string;
}
const tierConfig: Record<string, {
  label: string;
  color: string;
  icon: typeof Crown;
}> = {
  free: {
    label: "Free",
    color: "bg-muted text-foreground",
    icon: User
  },
  starter: {
    label: "Starter",
    color: "bg-blue-500/20 text-blue-700 dark:text-blue-300",
    icon: TrendingUp
  },
  pro: {
    label: "Pro",
    color: "bg-primary/20 text-primary-foreground dark:text-primary",
    icon: Crown
  },
  ltd: {
    label: "Lifetime Deal",
    color: "bg-transparent text-green-600 dark:text-green-400 font-semibold",
    icon: Crown
  }
};
const Account = () => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [pdfHistory, setPdfHistory] = useState<PdfHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isManagingSubscription, setIsManagingSubscription] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
  const [copiedPasswordId, setCopiedPasswordId] = useState<string | null>(null);
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: {
          session
        }
      } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate("/auth");
        return;
      }
      setUser(session.user);

      // Fetch user profile
      const {
        data: profileData,
        error
      } = await supabase.from("profiles").select("subscription_tier, max_file_size_kb, max_daily_files, daily_usage_count, last_usage_reset, created_at, email").eq("user_id", session.user.id).single();
      if (!error && profileData) {
        // Check if usage should be reset (new day)
        const today = new Date().toISOString().split("T")[0];
        const effectiveUsageCount = profileData.last_usage_reset < today ? 0 : profileData.daily_usage_count;
        setProfile({
          ...profileData,
          daily_usage_count: effectiveUsageCount
        });
      }

      // Fetch PDF history
      const {
        data: historyData
      } = await supabase.from("pdf_history").select("id, file_name, original_size_bytes, protected_size_bytes, created_at, password").eq("user_id", session.user.id).order("created_at", {
        ascending: false
      }).limit(50);
      if (historyData) {
        setPdfHistory(historyData);
      }
      setIsLoading(false);
    };
    checkAuth();
    const {
      data: {
        subscription
      }
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);
  const handleManageSubscription = async () => {
    if (!user) return;
    setIsManagingSubscription(true);
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Error opening customer portal:", error);
    } finally {
      setIsManagingSubscription(false);
    }
  };
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };
  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };
  const copyPassword = async (id: string, password: string) => {
    try {
      await navigator.clipboard.writeText(password);
      setCopiedPasswordId(id);
      toast({
        title: "Password Copied!",
        description: "The password has been copied to your clipboard."
      });
      setTimeout(() => setCopiedPasswordId(null), 2000);
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Unable to copy password. Please copy it manually.",
        variant: "destructive"
      });
    }
  };
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center mx-auto mb-4">
            <Shield className="h-5 w-5 text-primary-foreground" />
          </div>
          <p className="text-muted-foreground">Loading your account...</p>
        </div>
      </div>;
  }
  if (!profile) {
    return <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground">Unable to load profile. Please try again.</p>
          <Button onClick={() => navigate("/")} className="mt-4">Go Home</Button>
        </div>
      </div>;
  }
  const tier = tierConfig[profile.subscription_tier] || tierConfig.free;
  const TierIcon = tier.icon;
  const usagePercentage = profile.max_daily_files > 0 ? profile.daily_usage_count / profile.max_daily_files * 100 : 0;
  const filesRemaining = Math.max(0, profile.max_daily_files - profile.daily_usage_count);
  const maxFileSizeDisplay = profile.max_file_size_kb >= 1024 ? `${(profile.max_file_size_kb / 1024).toFixed(0)} MB` : `${profile.max_file_size_kb} KB`;
  const memberSince = new Date(profile.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
  return <div className="min-h-screen bg-background">
      <Helmet>
        <title>My Account | SecurePDF</title>
        <meta name="description" content="View and manage your SecurePDF account, subscription, and usage." />
        <meta name="robots" content="noindex, nofollow" />
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
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                Sign Out
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">My Account</h1>
          <p className="text-muted-foreground mt-1">Manage your subscription and view usage</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Subscription Card */}
          <Card className="shadow-card bg-card border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Subscription
              </CardTitle>
              <CardDescription>Your current plan and billing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Current Plan</span>
                <Badge className={`${tier.color} border-0 flex items-center gap-1`}>
                  <TierIcon className="h-3 w-3" />
                  {tier.label}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Max File Size</span>
                <span className="font-medium">{maxFileSizeDisplay}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Daily File Limit</span>
                <span className="font-medium">{profile.max_daily_files} files/day</span>
              </div>

              {profile.subscription_tier === "ltd" ? <div className="pt-2 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    You have lifetime access. No billing required.
                  </p>
                </div> : profile.subscription_tier !== "free" ? <Button variant="outline" className="w-full mt-4" onClick={handleManageSubscription} disabled={isManagingSubscription}>
                  {isManagingSubscription ? <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </> : "Manage Subscription"}
                </Button> : <Link to="/pricing" className="block">
                  <Button className="w-full mt-4 bg-gradient-primary hover:opacity-90">
                    Upgrade Plan
                  </Button>
                </Link>}
            </CardContent>
          </Card>

          {/* Usage Card */}
          <Card className="shadow-card bg-card border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Today's Usage
              </CardTitle>
              <CardDescription>Your daily file processing usage</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Files Protected Today</span>
                  <span className="font-medium">
                    {profile.daily_usage_count} / {profile.max_daily_files}
                  </span>
                </div>
                <Progress value={usagePercentage} className="h-2" />
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-muted-foreground">Remaining Today</span>
                <span className={`font-medium ${filesRemaining === 0 ? "text-destructive" : "text-green-600 dark:text-green-400"}`}>
                  {filesRemaining} file{filesRemaining !== 1 ? "s" : ""}
                </span>
              </div>

              <p className="text-xs text-muted-foreground pt-2 border-t border-border">
                Usage resets daily at midnight UTC
              </p>
            </CardContent>
          </Card>

          {/* Account Info Card */}
          <Card className="shadow-card bg-card border-border/50 md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Account Information
              </CardTitle>
              <CardDescription>Your account details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{profile.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Member Since</p>
                    <p className="font-medium">{memberSince}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* PDF History Card */}
          <Card className="shadow-card bg-card border-border/50 md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                Protected PDF History
              </CardTitle>
              <CardDescription>Your 50 most recently protected PDF documents</CardDescription>
            </CardHeader>
            <CardContent>
              {pdfHistory.length === 0 ? <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No PDFs protected yet</p>
                  <p className="text-sm mt-1">Protected PDFs will appear here</p>
                </div> : <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-3">
                    {pdfHistory.map(item => {
                  const originalSizeKB = (item.original_size_bytes / 1024).toFixed(1);
                  const protectedSizeKB = (item.protected_size_bytes / 1024).toFixed(1);
                  const date = new Date(item.created_at);
                  const formattedDate = date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric"
                  });
                  const formattedTime = date.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit"
                  });
                  const isPasswordVisible = visiblePasswords.has(item.id);
                  const isCopied = copiedPasswordId === item.id;
                  return <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate" title={item.file_name}>
                              {item.file_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {originalSizeKB} KB → {protectedSizeKB} KB
                            </p>
                            {item.password && <div className="flex items-center gap-2 mt-1">
                                <code className="text-xs bg-background px-2 py-0.5 rounded font-mono">
                                  {isPasswordVisible ? item.password : "••••••••••••"}
                                </code>
                                <button onClick={() => togglePasswordVisibility(item.id)} className="text-muted-foreground hover:text-foreground transition-colors" title={isPasswordVisible ? "Hide password" : "Show password"}>
                                  {isPasswordVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                </button>
                                <button onClick={() => copyPassword(item.id, item.password!)} className="text-muted-foreground hover:text-foreground transition-colors" title="Copy password">
                                  {isCopied ? <Check className="h-3.5 w-3.5 text-green-600 dark:text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
                                </button>
                              </div>}
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-sm text-muted-foreground">{formattedDate}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                              <Clock className="h-3 w-3" />
                              {formattedTime}
                            </p>
                          </div>
                        </div>;
                })}
                  </div>
                </ScrollArea>}
            </CardContent>
          </Card>

          {/* Referral Card */}
          <ReferralCard />
        </div>

        {/* Quick Actions */}
        <div className="mt-8 flex flex-wrap gap-4 justify-center">
          <Link to="/">
            <Button variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Protect a PDF
            </Button>
          </Link>
          <Link to="/pricing">
            <Button variant="outline">
              <TrendingUp className="h-4 w-4 mr-2" />
              View Plans
            </Button>
          </Link>
          <Link to="/contact">
            <Button variant="outline">
              <User className="h-4 w-4 mr-2" />
              Contact Support
            </Button>
          </Link>
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
          <div className="text-sm text-muted-foreground">
            <p>© 2025 SecurePDF. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>;
};
export default Account;