import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import { supabase } from "@/integrations/supabase/client";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Shield, User, CreditCard, FileText, Calendar, TrendingUp, Crown, Loader2 } from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface UserProfile {
  subscription_tier: string;
  max_file_size_kb: number;
  max_daily_files: number;
  daily_usage_count: number;
  last_usage_reset: string;
  created_at: string;
  email: string;
}

const tierConfig: Record<string, { label: string; color: string; icon: typeof Crown }> = {
  free: { label: "Free", color: "bg-muted text-muted-foreground", icon: User },
  starter: { label: "Starter", color: "bg-blue-500/20 text-blue-600 dark:text-blue-400", icon: TrendingUp },
  pro: { label: "Pro", color: "bg-primary/20 text-primary", icon: Crown },
  ltd: { label: "Lifetime Deal", color: "bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-600 dark:text-amber-400", icon: Crown },
};

const Account = () => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isManagingSubscription, setIsManagingSubscription] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate("/auth");
        return;
      }
      setUser(session.user);

      // Fetch user profile
      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("subscription_tier, max_file_size_kb, max_daily_files, daily_usage_count, last_usage_reset, created_at, email")
        .eq("user_id", session.user.id)
        .single();

      if (!error && profileData) {
        // Check if usage should be reset (new day)
        const today = new Date().toISOString().split("T")[0];
        const effectiveUsageCount = profileData.last_usage_reset < today ? 0 : profileData.daily_usage_count;
        setProfile({
          ...profileData,
          daily_usage_count: effectiveUsageCount,
        });
      }
      setIsLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
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
      const { data, error } = await supabase.functions.invoke("customer-portal");
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center mx-auto mb-4">
            <Shield className="h-5 w-5 text-primary-foreground" />
          </div>
          <p className="text-muted-foreground">Loading your account...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground">Unable to load profile. Please try again.</p>
          <Button onClick={() => navigate("/")} className="mt-4">Go Home</Button>
        </div>
      </div>
    );
  }

  const tier = tierConfig[profile.subscription_tier] || tierConfig.free;
  const TierIcon = tier.icon;
  const usagePercentage = profile.max_daily_files > 0 
    ? (profile.daily_usage_count / profile.max_daily_files) * 100 
    : 0;
  const filesRemaining = Math.max(0, profile.max_daily_files - profile.daily_usage_count);
  const maxFileSizeDisplay = profile.max_file_size_kb >= 1024 
    ? `${(profile.max_file_size_kb / 1024).toFixed(0)} MB` 
    : `${profile.max_file_size_kb} KB`;
  const memberSince = new Date(profile.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-background">
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

            <div className="flex items-center gap-4">
              <nav className="hidden md:flex items-center gap-4">
                <Link to="/pricing">
                  <Button variant="ghost" size="sm">Pricing</Button>
                </Link>
                <Link to="/about">
                  <Button variant="ghost" size="sm">About</Button>
                </Link>
                <Link to="/contact">
                  <Button variant="ghost" size="sm">Contact</Button>
                </Link>
              </nav>
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

              {profile.subscription_tier === "ltd" ? (
                <div className="pt-2 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    You have lifetime access. No billing required.
                  </p>
                </div>
              ) : profile.subscription_tier !== "free" ? (
                <Button 
                  variant="outline" 
                  className="w-full mt-4" 
                  onClick={handleManageSubscription}
                  disabled={isManagingSubscription}
                >
                  {isManagingSubscription ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Manage Subscription"
                  )}
                </Button>
              ) : (
                <Link to="/pricing" className="block">
                  <Button className="w-full mt-4 bg-gradient-primary hover:opacity-90">
                    Upgrade Plan
                  </Button>
                </Link>
              )}
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
    </div>
  );
};

export default Account;
