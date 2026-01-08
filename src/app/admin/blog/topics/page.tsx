"use client";

/**
 * Blog Topics Management Page
 * 
 * Generate, review, and manage topic ideas
 */

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Lightbulb, Plus, RefreshCw, ChevronLeft, Search, Eye,
  CheckCircle, XCircle, Clock, Sparkles, Trash2, FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { GenerationProgressDialog } from "@/components/blog/GenerationProgressDialog";

interface Topic {
  id: string;
  title: string;
  angle: string | null;
  outline: string | null;
  targetWordCount: number;
  difficultyScore: number | null;
  relevanceScore: number | null;
  status: string;
  keywordText?: string;
  createdAt: string;
}

interface Keyword {
  id: string;
  keyword: string;
  intent: string;
}

export default function TopicsPage() {
  const { data: session, status } = useSession();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedKeyword, setSelectedKeyword] = useState<string>("");
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [previewTopic, setPreviewTopic] = useState<Topic | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showProgressDialog, setShowProgressDialog] = useState(false);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);

  const isAdmin = session?.user?.email === "admin@waterdamagerepairtexas.net" ||
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
      fetchTopics();
      fetchKeywords();
    }
  }, [status, isAdmin]);

  const fetchTopics = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/blog/topics?limit=100");
      const data = await res.json();
      setTopics(data.topics || []);
    } catch (error) {
      toast.error("Failed to load topics");
    } finally {
      setLoading(false);
    }
  };

  const fetchKeywords = async () => {
    try {
      const res = await fetch("/api/blog/keywords?status=pending&limit=100");
      const data = await res.json();
      setKeywords(data.keywords || []);
    } catch (error) {
      console.error("Error fetching keywords:", error);
    }
  };

  const generateTopics = async () => {
    if (!selectedKeyword) {
      toast.error("Please select a keyword");
      return;
    }

    try {
      setGenerating(true);
      const res = await fetch("/api/blog/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keywordId: selectedKeyword,
          count: 5,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(`Generated ${data.topics?.length || 0} topics!`);
        setShowGenerateDialog(false);
        fetchTopics();
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to generate topics");
      }
    } catch (error) {
      toast.error("Error generating topics");
    } finally {
      setGenerating(false);
    }
  };

  const updateTopicStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/blog/topics/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        toast.success(`Topic ${status}`);
        fetchTopics();
      } else {
        toast.error("Failed to update topic");
      }
    } catch (error) {
      toast.error("Error updating topic");
    }
  };

  const deleteTopic = async (id: string) => {
    if (!confirm("Delete this topic?")) return;

    try {
      const res = await fetch(`/api/blog/topics/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Topic deleted");
        fetchTopics();
      } else {
        toast.error("Failed to delete topic");
      }
    } catch (error) {
      toast.error("Error deleting topic");
    }
  };

  const generateArticle = async (topicId: string) => {
    try {
      setShowProgressDialog(true);
      setActiveJobId(null); // Reset before starting

      const res = await fetch("/api/blog/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          topicId,
          background: true // Get the jobId immediately
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.jobRunId) {
          setActiveJobId(data.jobRunId);
        }
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to generate article");
        setShowProgressDialog(false);
      }
    } catch (error) {
      toast.error("Error generating article");
      setShowProgressDialog(false);
    }
  };

  const filteredTopics = topics.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || t.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (status === "loading" || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-48 mb-8" />
        <div className="grid gap-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
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
            <Lightbulb className="w-6 h-6 text-blue-600" />
            Topic Generator
          </h1>
        </div>
        <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Topics
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Generate Topic Ideas</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium">Select Keyword</label>
                <Select
                  value={selectedKeyword}
                  onValueChange={setSelectedKeyword}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a keyword..." />
                  </SelectTrigger>
                  <SelectContent>
                    {keywords.map(k => (
                      <SelectItem key={k.id} value={k.id}>
                        {k.keyword} ({k.intent})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-sm text-muted-foreground">
                This will generate 5 topic ideas using AI based on the selected keyword.
              </p>
              <Button
                onClick={generateTopics}
                disabled={generating || !selectedKeyword}
                className="w-full"
              >
                {generating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Topics
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search topics..."
            className="pl-9"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="used">Used</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={fetchTopics}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Topics Grid */}
      {filteredTopics.length === 0 ? (
        <div className="text-center py-12">
          <Lightbulb className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No topics yet</h3>
          <p className="text-muted-foreground mb-4">
            Generate topic ideas from your keywords to get started.
          </p>
          <Button onClick={() => setShowGenerateDialog(true)}>
            <Sparkles className="w-4 h-4 mr-2" />
            Generate Topics
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTopics.map((topic) => (
            <div
              key={topic.id}
              className="p-4 bg-card rounded-xl border border-border hover:border-blue-200 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <Badge variant={
                  topic.status === "approved" ? "default" :
                  topic.status === "rejected" ? "destructive" :
                  topic.status === "used" ? "secondary" :
                  "outline"
                }>
                  {topic.status}
                </Badge>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      setPreviewTopic(topic);
                      setShowPreviewDialog(true);
                    }}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => deleteTopic(topic.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </div>

              <h3 className="font-medium mb-2 line-clamp-2">{topic.title}</h3>

              {topic.angle && (
                <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                  {topic.angle}
                </p>
              )}

              {topic.keywordText && (
                <Badge variant="secondary" className="mb-2">
                  {topic.keywordText}
                </Badge>
              )}

              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                <span>{topic.targetWordCount} words</span>
                {topic.relevanceScore && (
                  <span>• Score: {topic.relevanceScore}/10</span>
                )}
              </div>

              {topic.status === "pending" && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => updateTopicStatus(topic.id, "approved")}
                  >
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => updateTopicStatus(topic.id, "rejected")}
                  >
                    <XCircle className="w-3 h-3 mr-1" />
                    Reject
                  </Button>
                </div>
              )}

              {topic.status === "approved" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={() => generateArticle(topic.id)}
                >
                  <FileText className="w-3 h-3 mr-1" />
                  Generate Article
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Topic Preview</DialogTitle>
          </DialogHeader>
          {previewTopic && (
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Title</label>
                <p className="text-lg font-medium">{previewTopic.title}</p>
              </div>

              {previewTopic.angle && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Angle/Approach</label>
                  <p>{previewTopic.angle}</p>
                </div>
              )}

              {previewTopic.outline && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Outline</label>
                  <pre className="text-sm bg-muted p-4 rounded-lg whitespace-pre-wrap overflow-x-auto">
                    {previewTopic.outline}
                  </pre>
                </div>
              )}

              <div className="flex gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Target Words</label>
                  <p>{previewTopic.targetWordCount}</p>
                </div>
                {previewTopic.difficultyScore && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Difficulty</label>
                    <p>{previewTopic.difficultyScore}/10</p>
                  </div>
                )}
                {previewTopic.relevanceScore && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Relevance</label>
                    <p>{previewTopic.relevanceScore}/10</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <GenerationProgressDialog
        open={showProgressDialog}
        onOpenChange={(open) => {
          setShowProgressDialog(open);
          if (!open) {
            setActiveJobId(null);
          }
        }}
        jobId={activeJobId}
        onComplete={() => {
          fetchTopics();
        }}
      />
    </div>
  );
}
