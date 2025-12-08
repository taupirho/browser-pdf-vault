import { useState, useCallback, useEffect } from "react";
import { PDFDocument } from "pdf-lib-plus-encrypt";
import { Shield, Lock, Download, FileText, Eye, EyeOff, Copy, Check, Upload, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { PrivacyIndicator } from "./PrivacyIndicator";
import { supabase } from "@/integrations/supabase/client";
import type { User } from '@supabase/supabase-js';
interface ProcessedFile {
  name: string;
  password: string;
  originalSize: number;
  protectedSize: number;
}
interface PDFProtectorProps {
  user?: User | null;
  onLoginRequired?: () => void;
}
interface UserProfile {
  subscription_tier: string;
  max_file_size_kb: number;
  max_daily_files: number;
  daily_usage_count: number;
  last_usage_reset: string;
}
export function PDFProtector({
  user,
  onLoginRequired
}: PDFProtectorProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedFile, setProcessedFile] = useState<ProcessedFile | null>(null);
  const [showPassword, setShowPassword] = useState(true);
  const [passwordCopied, setPasswordCopied] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const {
    toast
  } = useToast();
  const [passwordOptions, setPasswordOptions] = useState({
    length: 13,
    includeLowercase: true,
    includeUppercase: true,
    includeNumbers: true,
    includeSymbols: true
  });
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  // Check subscription and get user profile
  const checkSubscription = useCallback(async () => {
    if (!user) return;
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke('check-subscription');
      if (error) throw error;

      // Get user profile with updated limits
      const {
        data: profile,
        error: profileError
      } = await supabase.from('profiles').select('subscription_tier, max_file_size_kb, max_daily_files, daily_usage_count, last_usage_reset').eq('user_id', user.id).single();
      if (profileError) throw profileError;

      // Check if daily usage should be reset (new day)
      const today = new Date().toISOString().split('T')[0];
      const lastReset = profile.last_usage_reset;
      const effectiveUsageCount = lastReset < today ? 0 : profile.daily_usage_count;
      setUserProfile({
        ...profile,
        daily_usage_count: effectiveUsageCount
      });
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  }, [user]);
  useEffect(() => {
    if (user) {
      checkSubscription();
    }
  }, [user, checkSubscription]);

  // Refresh profile data periodically to get latest limits
  useEffect(() => {
    if (user) {
      const interval = setInterval(() => {
        checkSubscription();
      }, 5000); // Check every 5 seconds

      return () => clearInterval(interval);
    }
  }, [user, checkSubscription]);

  // Clear profile when user signs out
  useEffect(() => {
    if (!user) {
      setUserProfile(null);
    }
  }, [user]);

  // Load saved custom password settings (if any)
  useEffect(() => {
    const loadSettings = async () => {
      if (!user || !userProfile || settingsLoaded) return;

      // Only applicable for customizable tiers
      if (userProfile.subscription_tier !== "pro" && userProfile.subscription_tier !== "ltd") {
        setSettingsLoaded(true);
        setPasswordOptions({
          length: 13,
          includeLowercase: true,
          includeUppercase: true,
          includeNumbers: true,
          includeSymbols: true
        });
        return;
      }
      try {
        const {
          data,
          error
        } = await supabase.from('profiles').select('custom_password_settings').eq('user_id', user.id).maybeSingle();
        if (error) {
          console.error('Error loading saved password settings:', error);
          setSettingsLoaded(true);
          return;
        }
        const saved = data?.custom_password_settings as any || null;
        if (saved && typeof saved === 'object') {
          const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
          setPasswordOptions({
            length: clamp(Number(saved.length ?? 13), 5, 30),
            includeLowercase: Boolean(saved.includeLowercase ?? true),
            includeUppercase: Boolean(saved.includeUppercase ?? true),
            includeNumbers: Boolean(saved.includeNumbers ?? true),
            includeSymbols: Boolean(saved.includeSymbols ?? true)
          });
        } else {
          setPasswordOptions({
            length: 13,
            includeLowercase: true,
            includeUppercase: true,
            includeNumbers: true,
            includeSymbols: true
          });
        }
      } catch (e) {
        console.error('Unexpected error loading settings:', e);
      } finally {
        setSettingsLoaded(true);
      }
    };
    loadSettings();
  }, [user, userProfile, settingsLoaded]);
  const generateSecurePassword = useCallback((): string => {
    const isCustomizable = userProfile && (userProfile.subscription_tier === "pro" || userProfile.subscription_tier === "ltd");
    const opts = isCustomizable ? passwordOptions : {
      length: 15,
      includeLowercase: true,
      includeUppercase: true,
      includeNumbers: true,
      includeSymbols: true
    };
    const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
    const length = clamp(opts.length, 5, 30);
    const lower = "abcdefghijklmnopqrstuvwxyz";
    const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const nums = "0123456789";
    const syms = "!@#$%^&*";
    const sets: string[] = [];
    if (opts.includeLowercase) sets.push(lower);
    if (opts.includeUppercase) sets.push(upper);
    if (opts.includeNumbers) sets.push(nums);
    if (opts.includeSymbols) sets.push(syms);
    if (sets.length === 0) {
      sets.push(lower, nums); // sensible fallback
    }
    const all = sets.join("");
    const randomIndex = (max: number) => {
      const array = new Uint32Array(1);
      crypto.getRandomValues(array);
      return array[0] % max;
    };
    const chars: string[] = [];
    // Ensure at least one from each selected set
    sets.forEach(set => {
      chars.push(set[randomIndex(set.length)]);
    });
    while (chars.length < length) {
      chars.push(all[randomIndex(all.length)]);
    }

    // Shuffle with crypto randomness
    for (let i = chars.length - 1; i > 0; i--) {
      const j = randomIndex(i + 1);
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }
    return chars.join("");
  }, [passwordOptions, userProfile]);
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);
  const handleFileSelect = useCallback(async (file: File) => {
    // Check if user is authenticated
    if (!user) {
      onLoginRequired?.();
      return;
    }

    // Check user profile is loaded
    if (!userProfile) {
      toast({
        title: "Loading Profile",
        description: "Please wait while we load your subscription details.",
        variant: "destructive"
      });
      return;
    }

    // Validate file type first
    if (!file.type.includes('pdf')) {
      toast({
        title: "Invalid File Type",
        description: "Please select a PDF file.",
        variant: "destructive"
      });
      return;
    }

    // Check file size limit based on subscription tier
    const maxFileSizeBytes = userProfile.max_file_size_kb * 1024;
    if (file.size > maxFileSizeBytes) {
      const currentSizeKB = Math.round(file.size / 1024);
      const currentSizeMB = (file.size / 1024 / 1024).toFixed(2);
      const maxSizeDisplay = userProfile.max_file_size_kb >= 1024 ? `${(userProfile.max_file_size_kb / 1024).toFixed(0)}MB` : `${userProfile.max_file_size_kb}KB`;
      let upgradeMessage = "";
      if (userProfile.subscription_tier === "free") {
        upgradeMessage = " Upgrade to Starter (1MB limit), Pro (10MB limit), or get our Life Time Deal for larger files.";
      } else if (userProfile.subscription_tier === "starter") {
        upgradeMessage = " Upgrade to Pro (10MB limit) or get our Life Time Deal for larger files.";
      } else if (userProfile.subscription_tier === "pro" || userProfile.subscription_tier === "ltd") {
        upgradeMessage = " Please contact us for custom requests with larger file sizes.";
      }
      toast({
        title: "File Too Large",
        description: `File size ${currentSizeKB}KB (${currentSizeMB}MB) exceeds your ${userProfile.subscription_tier} plan limit of ${maxSizeDisplay}.${upgradeMessage}`,
        variant: "destructive"
      });
      return;
    }
    setIsProcessing(true);
    setProcessedFile(null);
    setPasswordCopied(false);

    // CRITICAL: Check and increment usage count in the database BEFORE processing
    // This prevents race conditions where multiple files can be processed simultaneously
    try {
      const today = new Date().toISOString().split('T')[0];

      // Fetch the LATEST usage count directly from the database (not from local state)
      const {
        data: freshProfile,
        error: fetchError
      } = await supabase.from('profiles').select('daily_usage_count, last_usage_reset, max_daily_files').eq('user_id', user.id).single();
      if (fetchError) {
        throw new Error('Failed to verify usage limit');
      }

      // Calculate effective usage count (reset if new day)
      const lastReset = freshProfile.last_usage_reset;
      const currentCount = lastReset < today ? 0 : freshProfile.daily_usage_count;

      // Check if limit is already reached
      if (currentCount >= freshProfile.max_daily_files) {
        setIsProcessing(false);
        // Update local state to reflect actual database state
        setUserProfile(prev => prev ? {
          ...prev,
          daily_usage_count: currentCount,
          last_usage_reset: lastReset < today ? today : lastReset
        } : null);
        toast({
          title: "Daily Limit Reached",
          description: `You've reached your daily limit of ${freshProfile.max_daily_files} file${freshProfile.max_daily_files === 1 ? '' : 's'}. Upgrade your plan or try again tomorrow.`,
          variant: "destructive"
        });
        return;
      }

      // Atomically increment the usage count BEFORE processing
      const newCount = currentCount + 1;
      const {
        data: updatedData,
        error: updateError
      } = await supabase.from('profiles').update({
        daily_usage_count: newCount,
        last_usage_reset: today,
        updated_at: new Date().toISOString()
      }).eq('user_id', user.id).select('daily_usage_count, last_usage_reset');
      if (updateError) {
        throw new Error('Failed to reserve usage slot');
      }

      // Update local state immediately to prevent rapid re-clicks
      if (updatedData && updatedData[0]) {
        setUserProfile(prev => prev ? {
          ...prev,
          daily_usage_count: updatedData[0].daily_usage_count,
          last_usage_reset: updatedData[0].last_usage_reset
        } : null);
      }
    } catch (error) {
      console.error('Error checking/updating usage limit:', error);
      setIsProcessing(false);
      toast({
        title: "Error",
        description: "Failed to verify usage limit. Please try again.",
        variant: "destructive"
      });
      return;
    }
    try {
      // Read file as ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();

      // Generate secure password
      const password = generateSecurePassword();

      // Load the existing PDF with pdf-lib-plus-encrypt
      const existingPdf = await PDFDocument.load(arrayBuffer);

      // Encrypt the PDF using pdf-lib-plus-encrypt's encrypt method
      existingPdf.encrypt({
        userPassword: password,
        ownerPassword: password + '_owner',
        permissions: {
          printing: 'highResolution',
          modifying: false,
          copying: true,
          annotating: false,
          fillingForms: false,
          contentAccessibility: true,
          documentAssembly: false
        }
      });

      // Save the encrypted PDF
      const encryptedPdfBytes = await existingPdf.save();
      // Create download blob from the encrypted PDF
      const blob = new Blob([encryptedPdfBytes as BlobPart], {
        type: 'application/pdf'
      });
      const url = URL.createObjectURL(blob);

      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = `protected-${file.name}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Cleanup
      URL.revokeObjectURL(url);
      setProcessedFile({
        name: file.name,
        password,
        originalSize: file.size,
        protectedSize: encryptedPdfBytes.byteLength
      });

      // Log to PDF history (don't await - fire and forget, non-blocking)
      supabase.from('pdf_history').insert({
        user_id: user.id,
        file_name: file.name,
        original_size_bytes: file.size,
        protected_size_bytes: encryptedPdfBytes.byteLength,
        password: password
      }).then(({
        error
      }) => {
        if (error) console.error('Failed to log PDF history:', error);
      });

      // Usage count was already incremented BEFORE processing to prevent race conditions
      toast({
        title: "PDF Successfully Encrypted and Downloaded!",
        description: "Your PDF has been password-protected with original content preserved. Save the password securely!"
      });
    } catch (error) {
      console.error('PDF processing error:', error);
      toast({
        title: "Processing Failed",
        description: "There was an error protecting your PDF. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  }, [generateSecurePassword, toast, user, userProfile]);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);
  const copyPassword = useCallback(async () => {
    if (processedFile) {
      try {
        await navigator.clipboard.writeText(processedFile.password);
        setPasswordCopied(true);
        toast({
          title: "Password Copied!",
          description: "The password has been copied to your clipboard."
        });
        setTimeout(() => setPasswordCopied(false), 3000);
      } catch (error) {
        toast({
          title: "Copy Failed",
          description: "Unable to copy password. Please copy it manually.",
          variant: "destructive"
        });
      }
    }
  }, [processedFile, toast]);
  const resetProcess = useCallback(() => {
    setProcessedFile(null);
    setPasswordCopied(false);
  }, []);
  const handleSavePasswordSettings = useCallback(async () => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to save your preferences.',
        variant: 'destructive'
      });
      return;
    }
    setSavingSettings(true);
    try {
      const payload = {
        custom_password_settings: {
          length: Math.max(5, Math.min(30, Number(passwordOptions.length || 13))),
          includeLowercase: Boolean(passwordOptions.includeLowercase),
          includeUppercase: Boolean(passwordOptions.includeUppercase),
          includeNumbers: Boolean(passwordOptions.includeNumbers),
          includeSymbols: Boolean(passwordOptions.includeSymbols)
        }
      };
      const {
        error
      } = await supabase.from('profiles').update(payload).eq('user_id', user.id);
      if (error) throw error;
      toast({
        title: 'Settings saved',
        description: 'Your password preferences have been saved.'
      });
    } catch (e: any) {
      console.error('Error saving password settings:', e);
      toast({
        title: 'Save failed',
        description: e?.message || 'Could not save settings. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setSavingSettings(false);
    }
  }, [user, passwordOptions, toast]);
  return <div className="w-full max-w-4xl mx-auto space-y-6">
      <PrivacyIndicator />
      
      {/* Upload Area - Compact when file is processed */}
      {!processedFile ? <Card className="shadow-card bg-card border-border/50">
          <CardHeader className="text-center py-0 my-0 mx-0 px-[10px]">
            <CardTitle className="flex items-center justify-center gap-2 text-2xl text-foreground">
              <Shield className="h-6 w-6 text-primary" />
              Upload Your PDF
            </CardTitle>
            <CardDescription className="text-lg font-bold text-foreground">Password protect your PDF documents with complete privacy. All processing happens locally in your browser - your files never touch our servers and we can't see their contents.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`border-2 border-dashed rounded-lg p-12 text-center transition-all duration-300 ${isDragging ? 'border-primary bg-accent/50 scale-105' : 'border-border hover:border-primary/50 hover:bg-accent/20'} ${!user ? 'cursor-pointer' : ''}`} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} onClick={!user ? onLoginRequired : undefined}>
              <div className="space-y-4">
                <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center">
                  {user ? <Upload className="h-8 w-8 text-primary-foreground" /> : <Lock className="h-8 w-8 text-primary-foreground" />}
                </div>
                <div>
                  <p className="text-lg font-medium">
                    {user ? "Drag and drop your PDF here, or click Choose File to browse" : "Sign in to protect your PDF files"}
                  </p>
                  {user && userProfile && <p className="text-sm text-muted-foreground mt-2">
                      Daily usage: {userProfile.daily_usage_count} / {userProfile.max_daily_files} files
                    </p>}
                </div>
                {user ? <div>
                    <Input id="pdf-upload" type="file" accept=".pdf" className="hidden" onChange={e => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file);
              }} disabled={isProcessing} />
                    <Label htmlFor="pdf-upload" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 cursor-pointer" onClick={e => {
                // Check daily limit before opening file dialog
                if (userProfile && userProfile.daily_usage_count >= userProfile.max_daily_files) {
                  e.preventDefault();
                  toast({
                    title: "Daily Limit Reached",
                    description: `You've reached your daily limit of ${userProfile.max_daily_files} files. Upgrade your plan or try again tomorrow.`,
                    variant: "destructive"
                  });
                }
              }}>
                      {isProcessing ? <>
                          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          Processing...
                        </> : <>
                          <FileText className="mr-2 h-4 w-4" />
                          Choose File
                        </>}
                    </Label>
                  </div> : <Button variant="outline" size="lg" onClick={onLoginRequired}>
                    <Lock className="mr-2 h-4 w-4" />
                    Sign In to Use
                  </Button>}
              </div>
            </div>
          </CardContent>
        </Card> : (/* Compact "Protect Another" bar when file is processed */
    <div className={`border-2 border-dashed rounded-lg p-4 text-center transition-all duration-300 ${isDragging ? 'border-primary bg-accent/50' : 'border-border hover:border-primary/50 hover:bg-accent/20'}`} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
          <div className="flex items-center justify-center gap-4">
            <Upload className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Drop another PDF here or</span>
            <Input id="pdf-upload-compact" type="file" accept=".pdf" className="hidden" onChange={e => {
          const file = e.target.files?.[0];
          if (file) {
            resetProcess();
            handleFileSelect(file);
          }
        }} disabled={isProcessing} />
            <Label htmlFor="pdf-upload-compact" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3 cursor-pointer">
              <FileText className="mr-2 h-4 w-4" />
              Choose Another File
            </Label>
            {userProfile && <span className="text-xs text-muted-foreground">
                ({userProfile.daily_usage_count} / {userProfile.max_daily_files} today)
              </span>}
          </div>
        </div>)}

      {/* Password Options for Pro/LTD users */}
      {user && userProfile && (userProfile.subscription_tier === "pro" || userProfile.subscription_tier === "ltd") && !processedFile && <Card className="shadow-card bg-card border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Password Options</CardTitle>
            <CardDescription>Customize your generated password. Will include at least one of each selected type.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="mb-2 block">Length: {passwordOptions.length}</Label>
              <Slider value={[passwordOptions.length]} min={5} max={30} step={1} onValueChange={val => setPasswordOptions(prev => ({
            ...prev,
            length: val[0]
          }))} />
            </div>
            <div className="md:flex md:items-start md:justify-between gap-4">
              <div className="grid grid-cols-2 gap-4 flex-1">
                <div className="flex items-center space-x-2">
                  <Checkbox id="lower" checked={passwordOptions.includeLowercase} onCheckedChange={c => setPasswordOptions(p => {
                const next = {
                  ...p,
                  includeLowercase: Boolean(c)
                };
                const count = (next.includeLowercase ? 1 : 0) + (next.includeUppercase ? 1 : 0) + (next.includeNumbers ? 1 : 0) + (next.includeSymbols ? 1 : 0);
                if (count === 0) {
                  toast({
                    title: "At least one type required",
                    description: "Keep at least one character type selected.",
                    variant: "destructive"
                  });
                  return p;
                }
                return next;
              })} />
                  <Label htmlFor="lower">Lowercase letters</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="upper" checked={passwordOptions.includeUppercase} onCheckedChange={c => setPasswordOptions(p => {
                const next = {
                  ...p,
                  includeUppercase: Boolean(c)
                };
                const count = (next.includeLowercase ? 1 : 0) + (next.includeUppercase ? 1 : 0) + (next.includeNumbers ? 1 : 0) + (next.includeSymbols ? 1 : 0);
                if (count === 0) {
                  toast({
                    title: "At least one type required",
                    description: "Keep at least one character type selected.",
                    variant: "destructive"
                  });
                  return p;
                }
                return next;
              })} />
                  <Label htmlFor="upper">Uppercase letters</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="numbers" checked={passwordOptions.includeNumbers} onCheckedChange={c => setPasswordOptions(p => {
                const next = {
                  ...p,
                  includeNumbers: Boolean(c)
                };
                const count = (next.includeLowercase ? 1 : 0) + (next.includeUppercase ? 1 : 0) + (next.includeNumbers ? 1 : 0) + (next.includeSymbols ? 1 : 0);
                if (count === 0) {
                  toast({
                    title: "At least one type required",
                    description: "Keep at least one character type selected.",
                    variant: "destructive"
                  });
                  return p;
                }
                return next;
              })} />
                  <Label htmlFor="numbers">Numbers</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="symbols" checked={passwordOptions.includeSymbols} onCheckedChange={c => setPasswordOptions(p => {
                const next = {
                  ...p,
                  includeSymbols: Boolean(c)
                };
                const count = (next.includeLowercase ? 1 : 0) + (next.includeUppercase ? 1 : 0) + (next.includeNumbers ? 1 : 0) + (next.includeSymbols ? 1 : 0);
                if (count === 0) {
                  toast({
                    title: "At least one type required",
                    description: "Keep at least one character type selected.",
                    variant: "destructive"
                  });
                  return p;
                }
                return next;
              })} />
                  <Label htmlFor="symbols">Special characters</Label>
                </div>
              </div>
              <div className="mt-4 md:mt-0 md:ml-4 shrink-0">
                <Button onClick={handleSavePasswordSettings} disabled={savingSettings}>
                  {savingSettings ? 'Saving...' : 'Save Settings'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>}

      {/* Success Card - shows file info */}
      {processedFile && <Card className="shadow-glow bg-gradient-card border-trust/30">
          <CardHeader className="text-center pb-2">
            <CardTitle className="flex items-center justify-center gap-2 text-2xl text-trust">
              <Lock className="h-6 w-6" />
              PDF Protected Successfully!
            </CardTitle>
            <CardDescription>
              Your PDF has been password-protected and downloaded.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-warning/10 border border-warning/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-warning mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-warning-foreground">
                    Your new PDF password is{" "}
                    <span className="inline-flex items-center gap-1">
                      <code className="bg-background/50 px-2 py-0.5 rounded font-mono text-sm">
                        {showPassword ? processedFile.password : "••••••••••••"}
                      </code>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      </Button>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={copyPassword}>
                        {passwordCopied ? <Check className="h-3 w-3 text-trust" /> : <Copy className="h-3 w-3" />}
                      </Button>
                    </span>
                    {" "}and has been saved. View all your passwords in your{" "}
                    <a href="/account" className="underline hover:text-warning">My Account</a> page.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-muted/50 dark:bg-background rounded-lg p-3">
                <p className="font-medium">Original File</p>
                <p className="text-foreground truncate">{processedFile.name}</p>
                <p className="text-foreground">
                  {(processedFile.originalSize / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <div className="bg-muted/50 dark:bg-background rounded-lg p-3">
                <p className="font-medium">Protected File</p>
                <p className="text-foreground truncate">protected-{processedFile.name}</p>
                <p className="text-foreground">
                  {(processedFile.protectedSize / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
          </CardContent>
        </Card>}
    </div>;
}