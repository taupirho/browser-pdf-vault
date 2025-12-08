import { useState, useCallback } from "react";
import { Shield, Lock, Upload, FileText, X, CheckCircle2, Loader2, AlertCircle, Download, Eye, EyeOff, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { PrivacyIndicator } from "./PrivacyIndicator";
import type { User } from '@supabase/supabase-js';

interface QueuedFile {
  id: string;
  file: File;
  status: 'pending' | 'processing' | 'completed' | 'error';
  password?: string;
  protectedBlob?: Blob;
  error?: string;
}

interface BatchPDFProtectorProps {
  user?: User | null;
  onLoginRequired?: () => void;
}

export function BatchPDFProtector({ user, onLoginRequired }: BatchPDFProtectorProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [queuedFiles, setQueuedFiles] = useState<QueuedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [copiedPasswords, setCopiedPasswords] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

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

    const newFiles: QueuedFile[] = pdfFiles.map(file => ({
      id: `${file.name}-${Date.now()}-${Math.random()}`,
      file,
      status: 'pending'
    }));

    setQueuedFiles(prev => [...prev, ...newFiles]);
    
    toast({
      title: `${pdfFiles.length} file${pdfFiles.length > 1 ? 's' : ''} added`,
      description: "Click 'Protect All' to start batch processing."
    });
  }, [user, onLoginRequired, toast]);

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

  // Simulated batch processing for UX demo
  const startBatchProcessing = useCallback(async () => {
    if (queuedFiles.length === 0) return;

    setIsProcessing(true);
    setCurrentFileIndex(0);

    for (let i = 0; i < queuedFiles.length; i++) {
      setCurrentFileIndex(i);
      
      // Update status to processing
      setQueuedFiles(prev => prev.map((f, idx) => 
        idx === i ? { ...f, status: 'processing' } : f
      ));

      // Simulate processing delay (in real implementation, actual PDF encryption happens here)
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Generate mock password for demo
      const mockPassword = Array.from(crypto.getRandomValues(new Uint8Array(13)))
        .map(b => 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%'[b % 66])
        .join('');

      // Create mock protected PDF blob (in real implementation, this would be the encrypted PDF)
      const mockProtectedBlob = new Blob(['Protected PDF content'], { type: 'application/pdf' });

      // Update status to completed
      setQueuedFiles(prev => prev.map((f, idx) => 
        idx === i ? { ...f, status: 'completed', password: mockPassword, protectedBlob: mockProtectedBlob } : f
      ));
    }

    setIsProcessing(false);
    
    toast({
      title: "Batch Complete!",
      description: `Successfully protected ${queuedFiles.length} PDF files.`
    });
  }, [queuedFiles, toast]);

  const togglePassword = (id: string) => {
    setShowPasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyPassword = async (id: string, password: string) => {
    await navigator.clipboard.writeText(password);
    setCopiedPasswords(prev => ({ ...prev, [id]: true }));
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
      // Stagger downloads slightly to avoid browser blocking
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

      {/* Demo Banner */}
      <Card className="bg-primary/10 border-primary/30">
        <CardContent className="py-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium text-foreground">UX Demo Mode</p>
              <p className="text-sm text-muted-foreground">
                This is a preview of batch protection. Files are not actually being processed.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload Area */}
      <Card className="shadow-card bg-card border-border/50">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-2xl text-foreground">
            <Shield className="h-6 w-6 text-primary" />
            Batch PDF Protection
          </CardTitle>
          <CardDescription className="text-lg">
            Select multiple PDFs to protect them all at once. Pro & LTD users can batch up to 10 files.
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
                      Save Passwords
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
                    </p>
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
              
              {completedCount === queuedFiles.length && completedCount > 0 && (
                <Button variant="outline" size="lg" onClick={clearAll}>
                  <Upload className="mr-2 h-4 w-4" />
                  Protect More Files
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
