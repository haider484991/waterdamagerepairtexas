"use client";

import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ChevronRight,
  FileText,
  Sparkles,
  Search,
  Image as ImageIcon,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface Log {
  timestamp: string;
  level: string;
  message: string;
}

interface Job {
  id: string;
  status: string;
  type: string;
  logs: Log[];
  postSlug?: string;
  error?: string;
}

interface GenerationProgressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string | null;
  onComplete?: (postSlug: string) => void;
}

export function GenerationProgressDialog({
  open,
  onOpenChange,
  jobId,
  onComplete,
}: GenerationProgressDialogProps) {
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const completedJobIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (open && jobId) {
      // If we already finished this job, don't start polling again
      if (completedJobIdRef.current !== jobId) {
        startPolling(jobId);
      }
    } else {
      stopPolling();
      // If dialog closed, reset the completion tracker
      if (!open) {
        completedJobIdRef.current = null;
      }
    }

    return () => stopPolling();
  }, [open, jobId]);

  useEffect(() => {
    // Auto-scroll to bottom of logs
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [job?.logs]);

  const startPolling = (id: string) => {
    // Clear any existing interval first
    stopPolling();
    
    setLoading(true);
    let isTerminated = false;

    const fetchStatus = async () => {
      // Don't fetch if we've already marked this job as done
      if (completedJobIdRef.current === id) {
        stopPolling();
        return;
      }

      try {
        const res = await fetch(`/api/blog/jobs/${id}`);
        if (!res.ok) throw new Error("Failed to fetch job status");
        
        const data = await res.json();
        const currentJob = data.job;
        
        // Prevent state update if we've moved on to a different job
        if (id !== jobId) return;

        setJob(currentJob);

        if (currentJob.status === "completed" || currentJob.status === "failed") {
          isTerminated = true;
          stopPolling();
          
          // Only call onComplete once per jobId
          if (completedJobIdRef.current !== id) {
            completedJobIdRef.current = id;
            if (currentJob.status === "completed" && onComplete) {
              onComplete(currentJob.postSlug || "");
            }
          }
        }
      } catch (error) {
        console.error("Polling error:", error);
        // Don't terminate on first error, maybe network hiccup
        // but if it's a persistent 404, we should stop
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchStatus().then(() => {
      // Only start interval if the job is still running and hasn't terminated during the first fetch
      if (!isTerminated && open && jobId === id && !pollingIntervalRef.current) {
        pollingIntervalRef.current = setInterval(fetchStatus, 3000); // 3s is plenty
      }
    });
  };

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  const getStepStatus = (stepName: string) => {
    if (!job) return "pending";
    
    const logs = job.logs || [];
    const hasStarted = logs.some(l => l.message.toLowerCase().includes(stepName.toLowerCase()));
    
    // This is a simplified way to guess progress based on common log messages
    const nextSteps: Record<string, string[]> = {
      "Selecting keyword": ["Getting/generating topic", "Topic:", "Generating article content"],
      "Generating article": ["Processing markdown", "Inserting internal links", "Generating SEO metadata"],
      "SEO": ["Generating images", "Running quality checks"],
      "Images": ["Running quality checks", "Saving post"],
      "Quality": ["Saving post"],
      "Saving": ["Post saved", "Job completed"]
    };

    const completionMarkers: Record<string, string[]> = {
      "Topic": ["Topic:", "Generating article content"],
      "Article": ["Article content generated", "Processing markdown"],
      "Internal Links": ["Inserted", "links", "Generating SEO metadata"],
      "SEO": ["Generating SEO metadata", "Generating images"],
      "Images": ["Images generated successfully", "Running quality checks"],
      "Quality": ["Quality score:", "Saving post"],
      "Saving": ["Post saved", "Job completed"]
    };

    const isDone = completionMarkers[stepName]?.some(marker => 
      logs.some(l => l.message.toLowerCase().includes(marker.toLowerCase()))
    );

    if (job.status === "completed") return "completed";
    if (job.status === "failed" && !isDone) return "failed";
    if (isDone) return "completed";
    if (hasStarted) return "running";
    
    return "pending";
  };

  const steps = [
    { id: "topic", label: "Topic Research", icon: Sparkles, marker: "Topic" },
    { id: "article", label: "Content Generation", icon: FileText, marker: "Article" },
    { id: "links", label: "Internal Linking", icon: ChevronRight, marker: "Internal Links" },
    { id: "seo", label: "SEO Optimization", icon: Search, marker: "SEO" },
    { id: "images", label: "AI Image Generation", icon: ImageIcon, marker: "Images" },
    { id: "quality", label: "Quality Analysis", icon: CheckCircle2, marker: "Quality" },
  ];

  const calculateProgress = () => {
    if (!job) return 0;
    if (job.status === "completed") return 100;
    const completedSteps = steps.filter(s => getStepStatus(s.marker) === "completed").length;
    return Math.min(Math.round((completedSteps / steps.length) * 100), 95);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => {
      if (job?.status === "running") return; // Prevent closing while running
      onOpenChange(v);
    }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {job?.status === "failed" ? (
              <XCircle className="w-5 h-5 text-red-500" />
            ) : job?.status === "completed" ? (
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            ) : (
              <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
            )}
            Article Generation Progress
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Overall Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium">
                {job?.status === "failed" ? "Generation Failed" : 
                 job?.status === "completed" ? "Generation Complete!" : 
                 "Generating your article..."}
              </span>
              <span className="text-muted-foreground">{calculateProgress()}%</span>
            </div>
            <Progress value={calculateProgress()} className="h-2" />
          </div>

          {/* Steps Grid */}
          <div className="grid grid-cols-2 gap-3">
            {steps.map((step) => {
              const status = getStepStatus(step.marker);
              return (
                <div 
                  key={step.id} 
                  className={`flex items-center gap-3 p-3 rounded-lg border text-sm transition-colors ${
                    status === "completed" ? "bg-green-500/5 border-green-500/20" :
                    status === "running" ? "bg-blue-500/5 border-blue-500/20" :
                    "bg-muted/30 border-transparent"
                  }`}
                >
                  <div className={`p-1.5 rounded-full ${
                    status === "completed" ? "bg-green-500/20 text-green-600" :
                    status === "running" ? "bg-blue-500/20 text-blue-600" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {status === "completed" ? <Check className="w-3.5 h-3.5" /> : 
                     status === "running" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 
                     <step.icon className="w-3.5 h-3.5" />}
                  </div>
                  <span className={status === "pending" ? "text-muted-foreground" : "font-medium"}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Real-time Logs */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Activity Log</label>
            <div 
              ref={scrollRef}
              className="h-40 overflow-y-auto rounded-lg bg-black/5 dark:bg-white/5 p-3 font-mono text-[11px] space-y-1"
            >
              {job?.logs.map((log, i) => (
                <div key={i} className="flex gap-2">
                  <span className="text-muted-foreground opacity-50">[{new Date(log.timestamp).toLocaleTimeString([], { hour12: false })}]</span>
                  <span className={
                    log.level === "error" ? "text-red-500" : 
                    log.level === "warn" ? "text-amber-500" : 
                    "text-foreground"
                  }>
                    {log.message}
                  </span>
                </div>
              ))}
              {(!job?.logs || job.logs.length === 0) && (
                <div className="text-muted-foreground italic">Initializing job...</div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex flex-col gap-2 pt-2">
            {job?.status === "completed" && job.postSlug && (
              <div className="flex gap-2">
                <Link href={`/blog/${job.postSlug}`} target="_blank" className="flex-1">
                  <Button className="w-full">View Article</Button>
                </Link>
                <Link href={`/admin/blog/posts`} className="flex-1">
                  <Button variant="outline" className="w-full">Go to Posts</Button>
                </Link>
              </div>
            )}
            
            {job?.status === "failed" && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 text-xs">
                <strong>Error:</strong> {job.error || "An unexpected error occurred during generation."}
              </div>
            )}

            {(job?.status === "completed" || job?.status === "failed") && (
              <Button variant="ghost" onClick={() => onOpenChange(false)} className="w-full">
                Close
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
