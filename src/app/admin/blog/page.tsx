"use client";

/**
 * Blog Admin Dashboard
 * 
 * Overview of blog system with quick stats and actions
 */

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FileText, Tag, Lightbulb, Play, Settings, Clock,
  CheckCircle, XCircle, AlertTriangle, RefreshCw,
  PlusCircle, Zap, TrendingUp, BarChart3, ChevronRight,
  ExternalLink, Loader2, Edit2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

interface BlogStats {
  posts: { total: number; published: number; drafts: number; scheduled: number };
  keywords: { total: number; pending: number; used: number };
  topics: { total: number; pending: number; approved: number };
  jobs: { completed: number; failed: number; running: number };
}

interface RecentJob {
  id: string;
  type: string;
  status: string;
  createdAt: string;
  keywordText?: string;
  postTitle?: string;
  postSlug?: string;
  logs?: Array<{ timestamp: string; level: string; message: string }>;
}

export default function BlogAdminPage() {
  const { data: session, status } = useSession();
  const [stats, setStats] = useState<BlogStats | null>(null);
  const [recentJobs, setRecentJobs] = useState<RecentJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  
  // Real-time progress states
  const [activeJob, setActiveJob] = useState<RecentJob | null>(null);
  const [showProgress, setShowProgress] = useState(false);
  const [progressValue, setProgressValue] = useState(0);

  const isAdmin = session?.user?.email === "admin@pickleballcourts.io" ||
                  session?.user?.email?.endsWith("@admin.com") ||
                  session?.user?.email === "admin@test.com";

  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/login");
    }
    if (status === "authenticated" && !isAdmin) {
      redirect("/");
    }
    if (status === "authenticated" && isAdmin) {
      fetchData();
    }
  }, [status, isAdmin]);

  // Polling for job progress
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (showProgress && activeJob && activeJob.status === "running") {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/blog/jobs/${activeJob.id}`);
          if (res.ok) {
            const data = await res.json();
            setActiveJob(data.job);
            
            // Calculate progress percentage based on logs
            const logCount = data.job.logs?.length || 0;
            const estimatedSteps = 10; // Number of log steps in full pipeline
            const newProgress = Math.min(Math.round((logCount / estimatedSteps) * 100), 95);
            setProgressValue(newProgress);

            if (data.job.status === "completed" || data.job.status === "failed") {
              setProgressValue(100);
              clearInterval(interval);
              fetchData(); // Refresh main stats
              
              if (data.job.status === "completed") {
                toast.success("Article generated successfully!");
              } else {
                toast.error(`Generation failed: ${data.job.error || "Unknown error"}`);
              }
            }
          }
        } catch (error) {
          console.error("Error polling job progress:", error);
        }
      }, 2000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showProgress, activeJob]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch posts
      const postsRes = await fetch("/api/blog/posts?all=true&limit=1000");
      const postsData = await postsRes.json();
      
      // Fetch keywords
      const keywordsRes = await fetch("/api/blog/keywords?limit=1000");
      const keywordsData = await keywordsRes.json();
      
      // Fetch topics
      const topicsRes = await fetch("/api/blog/topics?limit=1000");
      const topicsData = await topicsRes.json();
      
      // Fetch jobs
      const jobsRes = await fetch("/api/blog/jobs?limit=10");
      const jobsData = await jobsRes.json();

      setStats({
        posts: {
          total: postsData.pagination?.total || 0,
          published: postsData.stats?.published || 0,
          drafts: postsData.stats?.drafts || 0,
          scheduled: postsData.stats?.scheduled || 0,
        },
        keywords: {
          total: keywordsData.pagination?.total || 0,
          pending: keywordsData.stats?.pending || 0,
          used: keywordsData.stats?.used || 0,
        },
        topics: {
          total: topicsData.pagination?.total || 0,
          pending: topicsData.stats?.pending || 0,
          approved: topicsData.stats?.approved || 0,
        },
        jobs: jobsData.stats || { completed: 0, failed: 0, running: 0 },
      });

      setRecentJobs(jobsData.jobs?.slice(0, 5) || []);
    } catch (error) {
      console.error("Error fetching blog stats:", error);
      toast.error("Failed to load blog statistics");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      const res = await fetch("/api/blog/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      
      const data = await res.json();
      
      if (data.jobRunId) {
        // Start showing real-time progress
        setActiveJob({
          id: data.jobRunId,
          type: "full_pipeline",
          status: "running",
          createdAt: new Date().toISOString(),
          logs: []
        });
        setShowProgress(true);
        setProgressValue(5);
      } else if (data.success) {
        toast.success("Article generated successfully!");
        fetchData();
      } else {
        toast.error(data.errors?.[0] || "Generation failed");
      }
    } catch (error) {
      toast.error("Failed to start generation");
    } finally {
      setGenerating(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <FileText className="w-8 h-8 text-amber-600" />
            Blog Admin
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your automated blog content system
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleGenerate} disabled={generating}>
            {generating ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Zap className="w-4 h-4 mr-2" />
            )}
            Generate Article
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Link href="/admin/blog/posts">
            <div className="p-6 bg-card rounded-xl border border-border hover:border-amber-500/50 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <FileText className="w-8 h-8 text-amber-600" />
                <Badge variant="secondary">{stats?.posts.total || 0}</Badge>
              </div>
              <h3 className="font-semibold text-lg mb-1">Posts</h3>
              <p className="text-sm text-muted-foreground">
                {stats?.posts.published || 0} published, {stats?.posts.drafts || 0} drafts
              </p>
            </div>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Link href="/admin/blog/keywords">
            <div className="p-6 bg-card rounded-xl border border-border hover:border-amber-500/50 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <Tag className="w-8 h-8 text-green-600" />
                <Badge variant="secondary">{stats?.keywords.total || 0}</Badge>
              </div>
              <h3 className="font-semibold text-lg mb-1">Keywords</h3>
              <p className="text-sm text-muted-foreground">
                {stats?.keywords.pending || 0} pending, {stats?.keywords.used || 0} used
              </p>
            </div>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Link href="/admin/blog/topics">
            <div className="p-6 bg-card rounded-xl border border-border hover:border-amber-500/50 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <Lightbulb className="w-8 h-8 text-blue-600" />
                <Badge variant="secondary">{stats?.topics.total || 0}</Badge>
              </div>
              <h3 className="font-semibold text-lg mb-1">Topics</h3>
              <p className="text-sm text-muted-foreground">
                {stats?.topics.pending || 0} pending, {stats?.topics.approved || 0} approved
              </p>
            </div>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Link href="/admin/blog/jobs">
            <div className="p-6 bg-card rounded-xl border border-border hover:border-amber-500/50 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <BarChart3 className="w-8 h-8 text-purple-600" />
                <Badge variant={stats?.jobs.running ? "default" : "secondary"}>
                  {stats?.jobs.running ? "Running" : "Idle"}
                </Badge>
              </div>
              <h3 className="font-semibold text-lg mb-1">Jobs</h3>
              <p className="text-sm text-muted-foreground">
                {stats?.jobs.completed || 0} completed, {stats?.jobs.failed || 0} failed
              </p>
            </div>
          </Link>
        </motion.div>
      </div>

      {/* Quick Actions & Recent Jobs */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="p-6 bg-card rounded-xl border border-border"
        >
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Play className="w-5 h-5" />
            Quick Actions
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Link href="/admin/blog/keywords">
              <Button variant="outline" className="w-full justify-start">
                <PlusCircle className="w-4 h-4 mr-2" />
                Add Keywords
              </Button>
            </Link>
            <Link href="/admin/blog/topics">
              <Button variant="outline" className="w-full justify-start">
                <Lightbulb className="w-4 h-4 mr-2" />
                Generate Topics
              </Button>
            </Link>
            <Link href="/admin/blog/posts">
              <Button variant="outline" className="w-full justify-start">
                <FileText className="w-4 h-4 mr-2" />
                Manage Posts
              </Button>
            </Link>
            <Link href="/admin/blog/settings">
              <Button variant="outline" className="w-full justify-start">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Recent Jobs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="p-6 bg-card rounded-xl border border-border"
        >
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Recent Jobs
          </h2>
          {recentJobs.length === 0 ? (
            <p className="text-muted-foreground text-sm">No jobs yet</p>
          ) : (
            <div className="space-y-3">
              {recentJobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {job.status === "completed" ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : job.status === "failed" ? (
                      <XCircle className="w-5 h-5 text-red-600" />
                    ) : job.status === "running" ? (
                      <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
                    ) : (
                      <Clock className="w-5 h-5 text-muted-foreground" />
                    )}
                    <div>
                      <p className="text-sm font-medium">
                        {job.postTitle || job.keywordText || job.type.replace(/_/g, " ")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(job.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      job.status === "completed" ? "default" :
                      job.status === "failed" ? "destructive" :
                      "secondary"
                    }
                  >
                    {job.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
          <Link href="/admin/blog/jobs" className="block mt-4">
            <Button variant="ghost" size="sm" className="w-full">
              View All Jobs
            </Button>
          </Link>
        </motion.div>
      </div>

      {/* Real-time Job Progress Dialog */}
      <Dialog open={showProgress} onOpenChange={(open) => {
        if (!open && activeJob?.status !== "running") {
          setShowProgress(false);
          setActiveJob(null);
        }
      }}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {activeJob?.status === "running" ? (
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              ) : activeJob?.status === "completed" ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
              {activeJob?.status === "running" ? "Generating Content..." : 
               activeJob?.status === "completed" ? "Generation Complete!" : "Generation Failed"}
            </DialogTitle>
            <DialogDescription>
              {activeJob?.status === "running" 
                ? "Please wait while our AI models research and write your article."
                : `Job ${activeJob?.status} on ${new Date().toLocaleTimeString()}`}
            </DialogDescription>
          </DialogHeader>

          <div className="py-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium">Pipeline Progress</span>
              <span className="text-muted-foreground">{progressValue}%</span>
            </div>
            <Progress value={progressValue} className="h-2" />
            
            {/* Live Logs */}
            <div className="mt-6 bg-muted/50 rounded-lg p-4 h-64 overflow-y-auto font-mono text-xs space-y-2 border border-border">
              {activeJob?.logs?.map((log, i) => (
                <div key={i} className="flex gap-2">
                  <span className="text-muted-foreground whitespace-nowrap">
                    [{new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]
                  </span>
                  <span className={
                    log.level === "error" ? "text-red-500 font-bold" : 
                    log.level === "warn" ? "text-amber-500 font-bold" : 
                    "text-foreground"
                  }>
                    {log.message}
                  </span>
                </div>
              ))}
              {activeJob?.status === "running" && (
                <div className="flex gap-2 animate-pulse">
                  <span className="text-muted-foreground whitespace-nowrap">
                    [{new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]
                  </span>
                  <span className="text-blue-500">Processing next step...</span>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="flex sm:justify-between items-center">
            <div className="text-xs text-muted-foreground">
              Using Gemini 3 Flash & Pro Image
            </div>
            <div className="flex gap-2">
              {activeJob?.status === "completed" && activeJob.postId && (
                <Link href={`/admin/blog/posts/${activeJob.postId}`}>
                  <Button variant="default" size="sm">
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit Post
                  </Button>
                </Link>
              )}
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowProgress(false)}
                disabled={activeJob?.status === "running"}
              >
                Close
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
