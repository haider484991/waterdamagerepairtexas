"use client";

/**
 * Blog Jobs Management Page
 * 
 * View job history and logs
 */

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  BarChart3, RefreshCw, ChevronLeft, Clock, CheckCircle,
  XCircle, AlertTriangle, Eye, Play
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface Job {
  id: string;
  type: string;
  status: string;
  keywordText?: string;
  topicTitle?: string;
  postTitle?: string;
  errorMessage?: string;
  errorStack?: string;
  tokensUsed?: number;
  startedAt?: string;
  finishedAt?: string;
  createdAt: string;
}

interface JobStats {
  completed: number;
  failed: number;
  running: number;
  pending: number;
}

export default function JobsPage() {
  const { data: session, status } = useSession();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [stats, setStats] = useState<JobStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

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
      fetchJobs();
    }
  }, [status, isAdmin]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/blog/jobs?limit=100");
      const data = await res.json();
      setJobs(data.jobs || []);
      setStats(data.stats || null);
    } catch (error) {
      toast.error("Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  const triggerGeneration = async () => {
    try {
      const res = await fetch("/api/blog/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (res.ok) {
        toast.success("Generation job started!");
        fetchJobs();
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to start generation");
      }
    } catch (error) {
      toast.error("Error starting generation");
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "failed":
        return <XCircle className="w-5 h-5 text-red-600" />;
      case "running":
        return <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />;
      default:
        return <Clock className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const formatDuration = (start?: string, end?: string) => {
    if (!start) return "-";
    const startTime = new Date(start).getTime();
    const endTime = end ? new Date(end).getTime() : Date.now();
    const seconds = Math.round((endTime - startTime) / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.round(seconds / 60);
    return `${minutes}m`;
  };

  const filteredJobs = jobs.filter(j => {
    const matchesStatus = filterStatus === "all" || j.status === filterStatus;
    const matchesType = filterType === "all" || j.type === filterType;
    return matchesStatus && matchesType;
  });

  if (status === "loading" || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-48 mb-8" />
        <div className="grid gap-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/blog">
          <Button variant="ghost" size="icon">
            <ChevronLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-purple-600" />
            Job History
          </h1>
        </div>
        <Button onClick={triggerGeneration}>
          <Play className="w-4 h-4 mr-2" />
          Run Pipeline
        </Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-4 mb-6">
          <div className="p-4 bg-card rounded-xl border border-border">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{stats.completed}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </div>
          <div className="p-4 bg-card rounded-xl border border-border">
            <div className="flex items-center gap-3">
              <XCircle className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-2xl font-bold">{stats.failed}</p>
                <p className="text-sm text-muted-foreground">Failed</p>
              </div>
            </div>
          </div>
          <div className="p-4 bg-card rounded-xl border border-border">
            <div className="flex items-center gap-3">
              <RefreshCw className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{stats.running}</p>
                <p className="text-sm text-muted-foreground">Running</p>
              </div>
            </div>
          </div>
          <div className="p-4 bg-card rounded-xl border border-border">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="running">Running</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="topic_generation">Topic Generation</SelectItem>
            <SelectItem value="article_generation">Article Generation</SelectItem>
            <SelectItem value="seo_optimization">SEO Optimization</SelectItem>
            <SelectItem value="full_pipeline">Full Pipeline</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={fetchJobs}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Jobs Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-4 font-medium">Status</th>
              <th className="text-left p-4 font-medium">Type</th>
              <th className="text-left p-4 font-medium">Details</th>
              <th className="text-left p-4 font-medium">Duration</th>
              <th className="text-left p-4 font-medium">Tokens</th>
              <th className="text-left p-4 font-medium">Created</th>
              <th className="text-right p-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredJobs.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-muted-foreground">
                  No jobs found
                </td>
              </tr>
            ) : (
              filteredJobs.map((job) => (
                <tr key={job.id} className="border-t border-border">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(job.status)}
                      <Badge variant={
                        job.status === "completed" ? "default" :
                        job.status === "failed" ? "destructive" :
                        job.status === "running" ? "secondary" :
                        "outline"
                      }>
                        {job.status}
                      </Badge>
                    </div>
                  </td>
                  <td className="p-4 text-sm">
                    {job.type.replace(/_/g, " ")}
                  </td>
                  <td className="p-4">
                    <div className="text-sm">
                      {job.postTitle || job.topicTitle || job.keywordText || "-"}
                    </div>
                    {job.errorMessage && (
                      <div className="text-xs text-red-600 mt-1 line-clamp-1">
                        {job.errorMessage}
                      </div>
                    )}
                  </td>
                  <td className="p-4 text-sm">
                    {formatDuration(job.startedAt, job.finishedAt)}
                  </td>
                  <td className="p-4 text-sm">
                    {job.tokensUsed?.toLocaleString() || "-"}
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {new Date(job.createdAt).toLocaleString()}
                  </td>
                  <td className="p-4 text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        setSelectedJob(job);
                        setShowDetailsDialog(true);
                      }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Job Details</DialogTitle>
          </DialogHeader>
          {selectedJob && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">ID</label>
                  <p className="text-sm font-mono">{selectedJob.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Type</label>
                  <p>{selectedJob.type.replace(/_/g, " ")}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(selectedJob.status)}
                    <span>{selectedJob.status}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Duration</label>
                  <p>{formatDuration(selectedJob.startedAt, selectedJob.finishedAt)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tokens Used</label>
                  <p>{selectedJob.tokensUsed?.toLocaleString() || "N/A"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Created</label>
                  <p>{new Date(selectedJob.createdAt).toLocaleString()}</p>
                </div>
              </div>

              {selectedJob.keywordText && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Keyword</label>
                  <p>{selectedJob.keywordText}</p>
                </div>
              )}

              {selectedJob.topicTitle && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Topic</label>
                  <p>{selectedJob.topicTitle}</p>
                </div>
              )}

              {selectedJob.postTitle && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Post</label>
                  <p>{selectedJob.postTitle}</p>
                </div>
              )}

              {selectedJob.errorMessage && (
                <div>
                  <label className="text-sm font-medium text-red-600">Error Message</label>
                  <p className="text-red-600">{selectedJob.errorMessage}</p>
                </div>
              )}

              {selectedJob.errorStack && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Stack Trace</label>
                  <pre className="text-xs bg-muted p-4 rounded-lg overflow-x-auto max-h-48">
                    {selectedJob.errorStack}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
