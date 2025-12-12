import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Gift, Copy, Check, Users, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
interface ReferralData {
  referral_code: string;
  bonus_daily_files: number;
  bonus_expires_at: string | null;
  referral_count: number;
}
export const ReferralCard = () => {
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const {
    toast
  } = useToast();
  useEffect(() => {
    const fetchReferralData = async () => {
      const {
        data: {
          session
        }
      } = await supabase.auth.getSession();
      if (!session?.user) return;

      // Fetch profile with referral code
      const {
        data: profile
      } = await supabase.from("profiles").select("referral_code, bonus_daily_files, bonus_expires_at").eq("user_id", session.user.id).single();

      // Count successful referrals
      const {
        count
      } = await supabase.from("referrals").select("id", {
        count: "exact",
        head: true
      }).eq("referrer_id", session.user.id).eq("status", "converted");
      if (profile) {
        setReferralData({
          referral_code: profile.referral_code || "",
          bonus_daily_files: profile.bonus_daily_files || 0,
          bonus_expires_at: profile.bonus_expires_at,
          referral_count: count || 0
        });
      }
      setIsLoading(false);
    };
    fetchReferralData();
  }, []);
  const copyReferralLink = async () => {
    if (!referralData?.referral_code) return;
    const link = `https://securepdf.io/?ref=${referralData.referral_code}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast({
        title: "Link Copied!",
        description: "Your referral link has been copied to clipboard."
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Unable to copy link. Please copy it manually.",
        variant: "destructive"
      });
    }
  };
  if (isLoading) {
    return <Card className="shadow-card bg-card border-border/50">
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-pulse text-muted-foreground">Loading referral data...</div>
        </CardContent>
      </Card>;
  }
  if (!referralData) return null;
  const hasActiveBonus = referralData.bonus_expires_at && new Date(referralData.bonus_expires_at) > new Date() && referralData.bonus_daily_files > 0;
  const bonusExpiryDate = referralData.bonus_expires_at ? new Date(referralData.bonus_expires_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }) : null;
  const referralLink = `https://securepdf.io/?ref=${referralData.referral_code}`;
  return <Card className="shadow-card bg-card border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-primary" />
          Referral Program
        </CardTitle>
        <CardDescription>Invite friends and earn +10 bonus file protections per day for 30 days  if  they take out or  upgrade to a paid plan!</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Referral Link */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Your Referral Link</label>
          <div className="flex gap-2">
            <Input value={referralLink} readOnly className="font-mono text-sm bg-muted/50" />
            <Button variant="outline" size="icon" onClick={copyReferralLink} className="shrink-0">
              {copied ? <Check className="h-4 w-4 text-green-600 dark:text-green-400" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{referralData.referral_count}</p>
              <p className="text-xs text-muted-foreground">Successful Referrals</p>
            </div>
          </div>

          {hasActiveBonus ? <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                <Gift className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  +{referralData.bonus_daily_files}
                </p>
                <p className="text-xs text-muted-foreground">Bonus Files/Day</p>
              </div>
            </div> : <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <Gift className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold text-muted-foreground">0</p>
                <p className="text-xs text-muted-foreground">Bonus Files</p>
              </div>
            </div>}
        </div>

        {/* Bonus Expiry */}
        {hasActiveBonus && bonusExpiryDate && <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 p-2 rounded">
            <Clock className="h-4 w-4" />
            <span>Bonus expires on {bonusExpiryDate}</span>
          </div>}

        {/* How it works */}
        <div className="pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground">
            <strong>How it works:</strong> Share your link → Friend signs up → Friend upgrades to a paid plan → 
            You get +10 bonus file protections per day for 30 days!
          </p>
        </div>
      </CardContent>
    </Card>;
};