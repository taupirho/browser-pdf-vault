import { useState, useCallback, useEffect } from "react";
import { PDFDocument } from "pdf-lib-plus-encrypt";
import { Shield, Lock, Download, FileText, Eye, EyeOff, Copy, Check, Upload, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const { toast } = useToast();

  // Check subscription and get user profile
  useEffect(() => {
    const checkSubscription = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase.functions.invoke('check-subscription');
        if (error) throw error;
        
        // Get user profile with updated limits
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('subscription_tier, max_file_size_kb, max_daily_files, daily_usage_count')
          .eq('user_id', user.id)
          .single();
          
        if (profileError) throw profileError;
        setUserProfile(profile);
      } catch (error) {
        console.error('Error checking subscription:', error);
      }
    };

    if (user) {
      checkSubscription();
    }
  }, [user]);
  const generateSecurePassword = useCallback((): string => {
    const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    const array = new Uint8Array(15);
    window.crypto.getRandomValues(array);
    return Array.from(array, byte => charset[byte % charset.length]).join('');
  }, []);
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
    if (!file.type.includes('pdf')) {
      toast({
        title: "Invalid File Type",
        description: "Please select a PDF file.",
        variant: "destructive"
      });
      return;
    }
    // Check user profile and file size limits
    if (!userProfile) {
      toast({
        title: "Loading Profile",
        description: "Please wait while we load your subscription details.",
        variant: "destructive"
      });
      return;
    }

    // Check daily usage limit
    if (userProfile.daily_usage_count >= userProfile.max_daily_files) {
      toast({
        title: "Daily Limit Reached",
        description: `You've reached your daily limit of ${userProfile.max_daily_files} files. Upgrade your plan or try again tomorrow.`,
        variant: "destructive"
      });
      return;
    }

    // Check file size limit based on subscription tier
    const maxFileSizeBytes = userProfile.max_file_size_kb * 1024;
    if (file.size > maxFileSizeBytes) {
      const maxSizeMB = userProfile.max_file_size_kb / 1024;
      const currentSizeMB = (file.size / 1024 / 1024).toFixed(2);
      toast({
        title: "File Too Large",
        description: `File size ${currentSizeMB}MB exceeds your ${userProfile.subscription_tier} plan limit of ${maxSizeMB >= 1 ? `${maxSizeMB}MB` : `${userProfile.max_file_size_kb}KB`}. Please choose a smaller file or upgrade your plan.`,
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
      try {
        await supabase
          .from('profiles')
          .update({ 
            daily_usage_count: userProfile.daily_usage_count + 1,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);
        
        // Update local state
        setUserProfile(prev => prev ? { ...prev, daily_usage_count: prev.daily_usage_count + 1 } : null);
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
  }, [generateSecurePassword, toast]);
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
                  {user ? <Label htmlFor="pdf-upload" className="py-0 px-0 mx-0 my-0">
                      <Input id="pdf-upload" type="file" accept=".pdf" className="hidden" onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }} disabled={isProcessing} />
                      <Button variant="outline" size="lg" className="pointer-events-none" disabled={isProcessing}>
                        {isProcessing ? <>
                            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            Processing...
                          </> : <>
                            <FileText className="mr-2 h-4 w-4" />
                            Choose File
                          </>}
                      </Button>
                    </Label> : <Button variant="outline" size="lg" onClick={onLoginRequired}>
                      <Lock className="mr-2 h-4 w-4" />
                      Sign In to Use
                    </Button>}
                </div>
              </div>
            </CardContent>
          </Card>

          
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