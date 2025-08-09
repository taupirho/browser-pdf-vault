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
    length: 15,
    includeLowercase: true,
    includeUppercase: true,
    includeNumbers: true,
    includeSymbols: true
  });

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
      } = await supabase.from('profiles').select('subscription_tier, max_file_size_kb, max_daily_files, daily_usage_count').eq('user_id', user.id).single();
      if (profileError) throw profileError;
      setUserProfile(profile);
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
  const generateSecurePassword = useCallback((): string => {
    const isCustomizable = userProfile && (userProfile.subscription_tier === "starter" || userProfile.subscription_tier === "pro");
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
    console.log('File selected:', file.name, 'Size:', file.size, 'bytes', '(' + Math.round(file.size / 1024) + 'KB)');
    console.log('User profile:', userProfile);
    console.log('User authenticated:', !!user);

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

    // Check daily usage limit FIRST - before any other processing
    if (userProfile.daily_usage_count >= userProfile.max_daily_files) {
      toast({
        title: "Daily Limit Reached",
        description: `You've reached your daily limit of ${userProfile.max_daily_files} files. Upgrade your plan or try again tomorrow.`,
        variant: "destructive"
      });
      return;
    }
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
    console.log('Max file size bytes:', maxFileSizeBytes, 'File size:', file.size, 'Over limit:', file.size > maxFileSizeBytes);
    if (file.size > maxFileSizeBytes) {
      console.log('File is too large, showing toast');
      const currentSizeKB = Math.round(file.size / 1024);
      const currentSizeMB = (file.size / 1024 / 1024).toFixed(2);
      const maxSizeDisplay = userProfile.max_file_size_kb >= 1024 ? `${(userProfile.max_file_size_kb / 1024).toFixed(0)}MB` : `${userProfile.max_file_size_kb}KB`;
      let upgradeMessage = "";
      if (userProfile.subscription_tier === "free") {
        upgradeMessage = " Upgrade to Starter (1MB limit) or Pro (10MB limit) for larger files.";
      } else if (userProfile.subscription_tier === "starter") {
        upgradeMessage = " Upgrade to Pro (10MB limit) for larger files.";
      } else if (userProfile.subscription_tier === "pro") {
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
      const blob = new Blob([encryptedPdfBytes], {
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
      // Update daily usage count
      console.log('Updating daily usage count from', userProfile.daily_usage_count, 'to', userProfile.daily_usage_count + 1);
      try {
        const {
          data,
          error
        } = await supabase.from('profiles').update({
          daily_usage_count: userProfile.daily_usage_count + 1,
          updated_at: new Date().toISOString()
        }).eq('user_id', user.id).select();
        if (error) {
          console.error('Error updating usage count:', error);
        } else {
          console.log('Usage count updated successfully:', data);
          // Update local state with the actual database response
          if (data && data[0]) {
            setUserProfile(prev => prev ? {
              ...prev,
              daily_usage_count: data[0].daily_usage_count
            } : null);
          } else {
            // Fallback: increment local state
            setUserProfile(prev => prev ? {
              ...prev,
              daily_usage_count: prev.daily_usage_count + 1
            } : null);
          }
        }
      } catch (error) {
        console.error('Error updating usage count:', error);
      }
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
  return <div className="w-full max-w-4xl mx-auto space-y-8">
      <PrivacyIndicator />
      
      {!processedFile ? <>
          <Card className="shadow-card bg-card border-border/50">
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
          </Card>

          {user && userProfile && (userProfile.subscription_tier === "starter" || userProfile.subscription_tier === "pro") && <Card className="shadow-card bg-card border-border/50 mt-6">
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="lower" checked={passwordOptions.includeLowercase} onCheckedChange={c => setPasswordOptions(p => ({
                ...p,
                includeLowercase: Boolean(c)
              }))} />
                    <Label htmlFor="lower">Lowercase letters</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="upper" checked={passwordOptions.includeUppercase} onCheckedChange={c => setPasswordOptions(p => ({
                ...p,
                includeUppercase: Boolean(c)
              }))} />
                    <Label htmlFor="upper">Uppercase letters</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="numbers" checked={passwordOptions.includeNumbers} onCheckedChange={c => setPasswordOptions(p => ({
                ...p,
                includeNumbers: Boolean(c)
              }))} />
                    <Label htmlFor="numbers">Numbers</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="symbols" checked={passwordOptions.includeSymbols} onCheckedChange={c => setPasswordOptions(p => ({
                ...p,
                includeSymbols: Boolean(c)
              }))} />
                    <Label htmlFor="symbols">Special characters</Label>
                  </div>
                </div>
                
              </CardContent>
            </Card>}

          
        </> : <Card className="shadow-glow bg-gradient-card border-trust/30">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-2xl text-trust">
              <Lock className="h-6 w-6" />
              PDF Protected Successfully!
            </CardTitle>
            <CardDescription>
              Your PDF has been password-protected and downloaded. Save this password securely!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-warning/10 border border-warning/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-warning mt-0.5" />
                <div>
                  <p className="font-medium text-warning-foreground">
                    Critical: Save this password!
                  </p>
                  <p className="text-sm text-warning-foreground/80 mt-1">
                    If you lose this password, the PDF cannot be recovered. Your PDF is protected with AES encryption.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-base font-medium">Generated Password</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input type={showPassword ? "text" : "password"} value={processedFile.password} readOnly className="pr-20 font-mono text-lg bg-background border-trust/30" />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => setShowPassword(!showPassword)} className="h-8 w-8 p-0">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <Button onClick={copyPassword} variant="outline" className="px-4">
                  {passwordCopied ? <Check className="h-4 w-4 text-trust" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="font-medium">Original File</p>
                <p className="text-muted-foreground">{processedFile.name}</p>
                <p className="text-muted-foreground">
                  {(processedFile.originalSize / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="font-medium">Protected File</p>
                <p className="text-muted-foreground">protected-{processedFile.name}</p>
                <p className="text-muted-foreground">
                  {(processedFile.protectedSize / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>

            <div className="flex justify-center">
              <Button onClick={resetProcess} variant="outline" size="lg">
                <Upload className="mr-2 h-4 w-4" />
                Protect Another PDF
              </Button>
            </div>
          </CardContent>
        </Card>}
    </div>;
}