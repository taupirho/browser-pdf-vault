import { useState, useCallback, useEffect } from "react";
import { PDFDocument } from "pdf-lib-plus-encrypt";
import { Shield, Lock, Upload, FileText, X, CheckCircle2, Loader2, AlertCircle, Download, Eye, EyeOff, Copy, Check, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { PrivacyIndicator } from "./PrivacyIndicator";
import { supabase } from "@/integrations/supabase/client";
import type { User } from '@supabase/supabase-js';

interface QueuedFile {
  id: string;
  file: File;
  status: 'pending' | 'processing' | 'completed' | 'error';
  password?: string;
  protectedBlob?: Blob;
  protectedSize?: number;
  error?: string;
}

interface BatchPDFProtectorProps {
  user?: User | null;
  onLoginRequired?: () => void;
}

interface UserProfile {
  subscription_tier: string;
  max_file_size_kb: number;
  max_daily_files: number;
  daily_usage_count: number;
  last_usage_reset: string;
  custom_password_settings?: {
    length?: number;
    includeLowercase?: boolean;
    includeUppercase?: boolean;
    includeNumbers?: boolean;
    includeSymbols?: boolean;
  } | null;
}

export function BatchPDFProtector({ user, onLoginRequired }: BatchPDFProtectorProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [queuedFiles, setQueuedFiles] = useState<QueuedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [copiedPasswords, setCopiedPasswords] = useState<Record<string, boolean>>({});
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [passwordOptions, setPasswordOptions] = useState({
    length: 13,
    includeLowercase: true,
    includeUppercase: true,
    includeNumbers: true,
    includeSymbols: true
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const { toast } = useToast();

  // Fetch user profile on mount and when user changes
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setUserProfile(null);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('subscription_tier, max_file_size_kb, max_daily_files, daily_usage_count, last_usage_reset, custom_password_settings')
          .eq('user_id', user.id)
          .single();
        
        if (error) throw error;
        
        const today = new Date().toISOString().split('T')[0];
        const effectiveUsageCount = data.last_usage_reset < today ? 0 : data.daily_usage_count;
        
        setUserProfile({
          ...data,
          daily_usage_count: effectiveUsageCount,
          custom_password_settings: data.custom_password_settings as UserProfile['custom_password_settings']
        });
        
        // Load saved password settings for Pro/LTD users
        const saved = data.custom_password_settings as UserProfile['custom_password_settings'];
        if (saved && (data.subscription_tier === 'pro' || data.subscription_tier === 'ltd')) {
          setPasswordOptions({
            length: saved.length ?? 13,
            includeLowercase: saved.includeLowercase ?? true,
            includeUppercase: saved.includeUppercase ?? true,
            includeNumbers: saved.includeNumbers ?? true,
            includeSymbols: saved.includeSymbols ?? true
          });
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };
    
    fetchProfile();
  }, [user]);

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
      sets.push(lower, nums);
    }

    const all = sets.join("");
    const randomIndex = (max: number) => {
      const array = new Uint32Array(1);
      crypto.getRandomValues(array);
      return array[0] % max;
    };

    const chars: string[] = [];
    sets.forEach(set => {
      chars.push(set[randomIndex(set.length)]);
    });

    while (chars.length < length) {
      chars.push(all[randomIndex(all.length)]);
    }

    for (let i = chars.length - 1; i > 0; i--) {
      const j = randomIndex(i + 1);
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }

    return chars.join("");
  }, [userProfile, passwordOptions]);

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
      const { error } = await supabase
        .from('profiles')
        .update(payload)
        .eq('user_id', user.id);
      
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

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const addFiles = useCallback((files: FileList) => {
    if (!user) {
      onLoginRequired?.();
      return;
    }

    if (!userProfile) {
      toast({
        title: "Loading Profile",
        description: "Please wait while we load your subscription details.",
        variant: "destructive"
      });
      return;
    }

    const pdfFiles = Array.from(files).filter(f => f.type.includes('pdf'));
    
    if (pdfFiles.length === 0) {
      toast({
        title: "No PDF files",
        description: "Please select PDF files only.",
        variant: "destructive"
      });
      return;
    }

    if (pdfFiles.length > 10) {
      toast({
        title: "Too many files",
        description: "Maximum 10 files per batch. Please select fewer files.",
        variant: "destructive"
      });
      return;
    }

    // Check file sizes
    const maxFileSizeBytes = userProfile.max_file_size_kb * 1024;
    const oversizedFiles = pdfFiles.filter(f => f.size > maxFileSizeBytes);
    
    if (oversizedFiles.length > 0) {
      const maxSizeDisplay = userProfile.max_file_size_kb >= 1024 
        ? `${(userProfile.max_file_size_kb / 1024).toFixed(0)}MB` 
        : `${userProfile.max_file_size_kb}KB`;
      
      toast({
        title: "Files Too Large",
        description: `${oversizedFiles.length} file(s) exceed your ${userProfile.subscription_tier} plan limit of ${maxSizeDisplay}. These files were not added.`,
        variant: "destructive"
      });
      
      // Only add files that are within size limit
      const validFiles = pdfFiles.filter(f => f.size <= maxFileSizeBytes);
      if (validFiles.length === 0) return;
    }

    const validPdfFiles = pdfFiles.filter(f => f.size <= maxFileSizeBytes);
    
    const newFiles: QueuedFile[] = validPdfFiles.map(file => ({
      id: `${file.name}-${Date.now()}-${Math.random()}`,
      file,
      status: 'pending'
    }));

    setQueuedFiles(prev => [...prev, ...newFiles]);
    
    toast({
      title: `${validPdfFiles.length} file${validPdfFiles.length > 1 ? 's' : ''} added`,
      description: "Click 'Protect All' to start batch processing."
    });
  }, [user, userProfile, onLoginRequired, toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  }, [addFiles]);

  const removeFile = useCallback((id: string) => {
    setQueuedFiles(prev => prev.filter(f => f.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setQueuedFiles([]);
    setCurrentFileIndex(0);
  }, []);

  const processFile = async (qf: QueuedFile): Promise<{ password: string; blob: Blob; protectedSize: number } | null> => {
    if (!user || !userProfile) return null;
    
    const today = new Date().toISOString().split('T')[0];
    
    // Fetch fresh usage count from DB
    const { data: freshProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('daily_usage_count, last_usage_reset, max_daily_files')
      .eq('user_id', user.id)
      .single();
    
    if (fetchError) throw new Error('Failed to verify usage limit');
    
    const lastReset = freshProfile.last_usage_reset;
    const currentCount = lastReset < today ? 0 : freshProfile.daily_usage_count;
    
    if (currentCount >= freshProfile.max_daily_files) {
      throw new Error(`Daily limit of ${freshProfile.max_daily_files} files reached`);
    }
    
    // Atomically increment usage count BEFORE processing
    const newCount = currentCount + 1;
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        daily_usage_count: newCount,
        last_usage_reset: today,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id);
    
    if (updateError) throw new Error('Failed to reserve usage slot');
    
    // Update local profile state
    setUserProfile(prev => prev ? {
      ...prev,
      daily_usage_count: newCount,
      last_usage_reset: today
    } : null);
    
    // Read and encrypt the PDF
    const arrayBuffer = await qf.file.arrayBuffer();
    const password = generateSecurePassword();
    
    const existingPdf = await PDFDocument.load(arrayBuffer);
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
    
    const encryptedPdfBytes = await existingPdf.save();
    const blob = new Blob([encryptedPdfBytes as BlobPart], { type: 'application/pdf' });
    
    // Save to pdf_history (fire and forget)
    supabase.from('pdf_history').insert({
      user_id: user.id,
      file_name: qf.file.name,
      original_size_bytes: qf.file.size,
      protected_size_bytes: encryptedPdfBytes.byteLength,
      password: password
    }).then(({ error }) => {
      if (error) console.error('Failed to log PDF history:', error);
    });
    
    return { password, blob, protectedSize: encryptedPdfBytes.byteLength };
  };

  const startBatchProcessing = useCallback(async () => {
    if (queuedFiles.length === 0 || !user || !userProfile) return;

    const pendingFiles = queuedFiles.filter(f => f.status === 'pending');
    if (pendingFiles.length === 0) return;

    // Check if there's enough daily quota
    const today = new Date().toISOString().split('T')[0];
    const { data: freshProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('daily_usage_count, last_usage_reset, max_daily_files')
      .eq('user_id', user.id)
      .single();
    
    if (fetchError) {
      toast({
        title: "Error",
        description: "Failed to verify usage limit. Please try again.",
        variant: "destructive"
      });
      return;
    }
    
    const currentCount = freshProfile.last_usage_reset < today ? 0 : freshProfile.daily_usage_count;
    const remaining = freshProfile.max_daily_files - currentCount;
    
    if (remaining <= 0) {
      toast({
        title: "Daily Limit Reached",
        description: `You've reached your daily limit of ${freshProfile.max_daily_files} files. Try again tomorrow.`,
        variant: "destructive"
      });
      return;
    }
    
    if (pendingFiles.length > remaining) {
      toast({
        title: "Not Enough Quota",
        description: `You can only process ${remaining} more file(s) today. Remove some files or try again tomorrow.`,
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    setCurrentFileIndex(0);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < queuedFiles.length; i++) {
      const qf = queuedFiles[i];
      
      if (qf.status !== 'pending') continue;
      
      setCurrentFileIndex(i);
      
      // Update status to processing
      setQueuedFiles(prev => prev.map((f, idx) => 
        idx === i ? { ...f, status: 'processing' } : f
      ));

      try {
        const result = await processFile(qf);
        
        if (result) {
          setQueuedFiles(prev => prev.map((f, idx) => 
            idx === i ? { 
              ...f, 
              status: 'completed', 
              password: result.password, 
              protectedBlob: result.blob,
              protectedSize: result.protectedSize
            } : f
          ));
          successCount++;
        } else {
          throw new Error('Processing returned no result');
        }
      } catch (error: any) {
        console.error(`Error processing ${qf.file.name}:`, error);
        setQueuedFiles(prev => prev.map((f, idx) => 
          idx === i ? { ...f, status: 'error', error: error.message || 'Processing failed' } : f
        ));
        errorCount++;
        
        // If daily limit reached, stop processing remaining files
        if (error.message?.includes('Daily limit')) {
          toast({
            title: "Daily Limit Reached",
            description: "Stopping batch processing. Remaining files were not processed.",
            variant: "destructive"
          });
          break;
        }
      }
    }

    setIsProcessing(false);
    
    if (successCount > 0) {
      toast({
        title: "Batch Complete!",
        description: `Successfully protected ${successCount} PDF file${successCount > 1 ? 's' : ''}.${errorCount > 0 ? ` ${errorCount} file(s) failed.` : ''}`
      });
    } else if (errorCount > 0) {
      toast({
        title: "Batch Failed",
        description: `All ${errorCount} file(s) failed to process.`,
        variant: "destructive"
      });
    }
  }, [queuedFiles, user, userProfile, toast, generateSecurePassword]);

  const togglePassword = (id: string) => {
    setShowPasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyPassword = async (id: string, password: string) => {
    await navigator.clipboard.writeText(password);
    setCopiedPasswords(prev => ({ ...prev, [id]: true }));
    toast({
      title: "Password Copied!",
      description: "The password has been copied to your clipboard."
    });
    setTimeout(() => setCopiedPasswords(prev => ({ ...prev, [id]: false })), 2000);
  };

  const completedCount = queuedFiles.filter(f => f.status === 'completed').length;
  const progress = queuedFiles.length > 0 ? (completedCount / queuedFiles.length) * 100 : 0;

  const downloadSinglePDF = (qf: QueuedFile) => {
    if (!qf.protectedBlob) return;
    const url = URL.createObjectURL(qf.protectedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = qf.file.name.replace('.pdf', '_protected.pdf');
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadAllPDFs = () => {
    const completed = queuedFiles.filter(f => f.status === 'completed' && f.protectedBlob);
    completed.forEach((qf, index) => {
      setTimeout(() => downloadSinglePDF(qf), index * 100);
    });
    
    toast({
      title: "Downloads started",
      description: `Downloading ${completed.length} protected PDF${completed.length > 1 ? 's' : ''}.`
    });
  };

  const downloadPasswordsFile = () => {
    const completed = queuedFiles.filter(f => f.status === 'completed' && f.password);
    const content = completed.map(f => `${f.file.name.replace('.pdf', '_protected.pdf')}: ${f.password}`).join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pdf-passwords.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      <PrivacyIndicator />

      {/* Upload Area */}
      <Card className="shadow-card bg-card border-border/50">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-2xl text-foreground">
            <Shield className="h-6 w-6 text-primary" />
            Batch PDF Protection
          </CardTitle>
          <CardDescription className="text-lg">
            Select multiple PDFs to protect them all at once. Up to 10 files per batch.
            {userProfile && (
              <span className="block text-sm mt-1">
                Daily usage: {userProfile.daily_usage_count} / {userProfile.max_daily_files} files
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 ${
              isDragging 
                ? 'border-primary bg-accent/50 scale-[1.02]' 
                : 'border-border hover:border-primary/50 hover:bg-accent/20'
            } ${!user ? 'cursor-pointer' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={!user ? onLoginRequired : undefined}
          >
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center">
                {user ? (
                  <Upload className="h-8 w-8 text-primary-foreground" />
                ) : (
                  <Lock className="h-8 w-8 text-primary-foreground" />
                )}
              </div>
              <div>
                <p className="text-lg font-medium">
                  {user 
                    ? "Drag and drop multiple PDFs here" 
                    : "Sign in to protect your PDF files"
                  }
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {user && "or click below to browse files"}
                </p>
              </div>
              
              {user ? (
                <div>
                  <Input
                    id="batch-pdf-upload"
                    type="file"
                    accept=".pdf"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files) addFiles(e.target.files);
                      e.target.value = '';
                    }}
                    disabled={isProcessing}
                  />
                  <Label
                    htmlFor="batch-pdf-upload"
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 cursor-pointer"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Choose Files
                  </Label>
                </div>
              ) : (
                <Button variant="outline" size="lg" onClick={onLoginRequired}>
                  <Lock className="mr-2 h-4 w-4" />
                  Sign In to Use
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Password Options for Pro/LTD users */}
      {user && userProfile && (userProfile.subscription_tier === 'pro' || userProfile.subscription_tier === 'ltd') && (
        <Card className="shadow-card bg-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-foreground">
              <Settings className="h-5 w-5 text-primary" />
              Password Options
            </CardTitle>
            <CardDescription>
              Customize password generation for all files in this batch
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="mb-2 block">Password Length: {passwordOptions.length}</Label>
              <Slider
                min={5}
                max={30}
                step={1}
                value={[passwordOptions.length]}
                onValueChange={([v]) => setPasswordOptions(p => ({ ...p, length: v }))}
              />
            </div>
            <div className="md:flex md:items-start md:justify-between gap-4">
              <div className="grid grid-cols-2 gap-4 flex-1">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="batch-lower"
                    checked={passwordOptions.includeLowercase}
                    onCheckedChange={c => setPasswordOptions(p => {
                      const next = { ...p, includeLowercase: Boolean(c) };
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
                    })}
                  />
                  <Label htmlFor="batch-lower">Lowercase letters</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="batch-upper"
                    checked={passwordOptions.includeUppercase}
                    onCheckedChange={c => setPasswordOptions(p => {
                      const next = { ...p, includeUppercase: Boolean(c) };
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
                    })}
                  />
                  <Label htmlFor="batch-upper">Uppercase letters</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="batch-numbers"
                    checked={passwordOptions.includeNumbers}
                    onCheckedChange={c => setPasswordOptions(p => {
                      const next = { ...p, includeNumbers: Boolean(c) };
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
                    })}
                  />
                  <Label htmlFor="batch-numbers">Numbers</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="batch-symbols"
                    checked={passwordOptions.includeSymbols}
                    onCheckedChange={c => setPasswordOptions(p => {
                      const next = { ...p, includeSymbols: Boolean(c) };
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
                    })}
                  />
                  <Label htmlFor="batch-symbols">Special characters</Label>
                </div>
              </div>
              <div className="mt-4 md:mt-0 md:ml-4 shrink-0">
                <Button onClick={handleSavePasswordSettings} disabled={savingSettings}>
                  {savingSettings ? 'Saving...' : 'Save Settings'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* File Queue */}
      {queuedFiles.length > 0 && (
        <Card className="shadow-card bg-card border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                File Queue ({queuedFiles.length} file{queuedFiles.length > 1 ? 's' : ''})
              </CardTitle>
              <div className="flex gap-2">
                {completedCount === queuedFiles.length && completedCount > 0 && (
                  <>
                    <Button size="sm" onClick={downloadAllPDFs}>
                      <Download className="mr-2 h-4 w-4" />
                      Download All PDFs
                    </Button>
                    <Button variant="outline" size="sm" onClick={downloadPasswordsFile}>
                      <Download className="mr-2 h-4 w-4" />
                      Download Passwords
                    </Button>
                  </>
                )}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearAll}
                  disabled={isProcessing}
                >
                  Clear All
                </Button>
              </div>
            </div>
            
            {isProcessing && (
              <div className="space-y-2 mt-4">
                <div className="flex justify-between text-sm">
                  <span>Processing {currentFileIndex + 1} of {queuedFiles.length}</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {queuedFiles.map((qf) => (
                <div 
                  key={qf.id} 
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                    qf.status === 'completed' 
                      ? 'bg-trust/10 border-trust/30' 
                      : qf.status === 'processing'
                      ? 'bg-primary/10 border-primary/30'
                      : qf.status === 'error'
                      ? 'bg-destructive/10 border-destructive/30'
                      : 'bg-muted/30 border-border/50'
                  }`}
                >
                  {/* Status Icon */}
                  <div className="shrink-0">
                    {qf.status === 'pending' && (
                      <FileText className="h-5 w-5 text-muted-foreground" />
                    )}
                    {qf.status === 'processing' && (
                      <Loader2 className="h-5 w-5 text-primary animate-spin" />
                    )}
                    {qf.status === 'completed' && (
                      <CheckCircle2 className="h-5 w-5 text-trust" />
                    )}
                    {qf.status === 'error' && (
                      <AlertCircle className="h-5 w-5 text-destructive" />
                    )}
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{qf.file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(qf.file.size / 1024).toFixed(1)} KB
                      {qf.protectedSize && ` → ${(qf.protectedSize / 1024).toFixed(1)} KB`}
                    </p>
                    {qf.error && (
                      <p className="text-xs text-destructive">{qf.error}</p>
                    )}
                  </div>

                  {/* Status Badge */}
                  <Badge 
                    variant={
                      qf.status === 'completed' ? 'default' : 
                      qf.status === 'processing' ? 'secondary' : 
                      qf.status === 'error' ? 'destructive' : 
                      'outline'
                    }
                    className="shrink-0"
                  >
                    {qf.status === 'pending' && 'Queued'}
                    {qf.status === 'processing' && 'Processing...'}
                    {qf.status === 'completed' && 'Protected'}
                    {qf.status === 'error' && 'Failed'}
                  </Badge>

                  {/* Actions (if completed) */}
                  {qf.status === 'completed' && qf.password && (
                    <div className="flex items-center gap-1 shrink-0">
                      {/* Download PDF button */}
                      <Button 
                        variant="default" 
                        size="sm" 
                        className="h-8 px-2"
                        onClick={() => downloadSinglePDF(qf)}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        PDF
                      </Button>
                      {/* Password display */}
                      <Input
                        type={showPasswords[qf.id] ? 'text' : 'password'}
                        value={qf.password}
                        readOnly
                        className="w-28 h-8 text-xs font-mono"
                      />
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0"
                        onClick={() => togglePassword(qf.id)}
                      >
                        {showPasswords[qf.id] ? (
                          <EyeOff className="h-3 w-3" />
                        ) : (
                          <Eye className="h-3 w-3" />
                        )}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0"
                        onClick={() => copyPassword(qf.id, qf.password!)}
                      >
                        {copiedPasswords[qf.id] ? (
                          <Check className="h-3 w-3 text-trust" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  )}

                  {/* Remove button (only for pending) */}
                  {qf.status === 'pending' && !isProcessing && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 shrink-0"
                      onClick={() => removeFile(qf.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center gap-4 mt-6">
              {completedCount < queuedFiles.length && (
                <Button 
                  size="lg" 
                  onClick={startBatchProcessing}
                  disabled={isProcessing || queuedFiles.every(f => f.status === 'completed')}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Shield className="mr-2 h-4 w-4" />
                      Protect All ({queuedFiles.filter(f => f.status === 'pending').length})
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
