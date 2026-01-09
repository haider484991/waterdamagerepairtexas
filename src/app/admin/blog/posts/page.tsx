"use client";

/**
 * Blog Posts Management Page
 * 
 * View, edit, and publish blog posts
 */

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect, useRouter } from "next/navigation";
import Link from "next/link";
import {
  FileText, Plus, RefreshCw, ChevronLeft, Search, Edit2,
  Eye, Trash2, Clock, CheckCircle, Calendar, ExternalLink
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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  seoTitle: string | null;
  metaDescription: string | null;
  status: string;
  publishedAt: string | null;
  scheduledAt: string | null;
  wordCount: number | null;
  readingTime: number | null;
  createdAt: string;
  updatedAt: string;
}

export default function PostsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    slug: "",
    seoTitle: "",
    metaDescription: "",
    excerpt: "",
    status: "draft",
  });
  const [saving, setSaving] = useState(false);

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
      fetchPosts();
    }
  }, [status, isAdmin]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/blog/posts?all=true&limit=100");
      const data = await res.json();
      setPosts(data.posts || []);
    } catch (error) {
      toast.error("Failed to load posts");
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (post: Post) => {
    setSelectedPost(post);
    setEditForm({
      title: post.title,
      slug: post.slug,
      seoTitle: post.seoTitle || "",
      metaDescription: post.metaDescription || "",
      excerpt: post.excerpt || "",
      status: post.status,
    });
    setShowEditDialog(true);
  };

  const savePost = async () => {
    if (!selectedPost) return;

    try {
      setSaving(true);
      const res = await fetch(`/api/blog/posts/${selectedPost.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      if (res.ok) {
        toast.success("Post updated");
        setShowEditDialog(false);
        fetchPosts();
      } else {
        toast.error("Failed to update post");
      }
    } catch (error) {
      toast.error("Error saving post");
    } finally {
      setSaving(false);
    }
  };

  const publishPost = async (id: string) => {
    try {
      const res = await fetch(`/api/blog/posts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "published",
          publishedAt: new Date().toISOString(),
        }),
      });

      if (res.ok) {
        toast.success("Post published!");
        fetchPosts();
      } else {
        toast.error("Failed to publish post");
      }
    } catch (error) {
      toast.error("Error publishing post");
    }
  };

  const deletePost = async (id: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    try {
      const res = await fetch(`/api/blog/posts/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Post deleted");
        fetchPosts();
      } else {
        toast.error("Failed to delete post");
      }
    } catch (error) {
      toast.error("Error deleting post");
    }
  };

  const filteredPosts = posts.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.slug.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || p.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (status === "loading" || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-48 mb-8" />
        <div className="grid gap-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
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
            <FileText className="w-6 h-6 text-blue-600" />
            Blog Posts
          </h1>
        </div>
        <Button onClick={() => router.push("/admin/blog/posts/new")}>
          <Plus className="w-4 h-4 mr-2" />
          New Post
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search posts..."
            className="pl-9"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Drafts</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="published">Published</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={fetchPosts}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Posts Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-4 font-medium">Title</th>
              <th className="text-left p-4 font-medium">Status</th>
              <th className="text-left p-4 font-medium">Words</th>
              <th className="text-left p-4 font-medium">Date</th>
              <th className="text-right p-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPosts.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-muted-foreground">
                  No posts found
                </td>
              </tr>
            ) : (
              filteredPosts.map((post) => (
                <tr key={post.id} className="border-t border-border">
                  <td className="p-4">
                    <div>
                      <div className="font-medium line-clamp-1">{post.title}</div>
                      <div className="text-sm text-muted-foreground">/blog/{post.slug}</div>
                    </div>
                  </td>
                  <td className="p-4">
                    <Badge variant={
                      post.status === "published" ? "default" :
                      post.status === "scheduled" ? "secondary" :
                      "outline"
                    }>
                      {post.status === "published" && <CheckCircle className="w-3 h-3 mr-1" />}
                      {post.status === "scheduled" && <Calendar className="w-3 h-3 mr-1" />}
                      {post.status === "draft" && <Clock className="w-3 h-3 mr-1" />}
                      {post.status}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <span className="text-sm">
                      {post.wordCount?.toLocaleString() || 0}
                    </span>
                    {post.readingTime && (
                      <span className="text-xs text-muted-foreground ml-1">
                        ({post.readingTime} min)
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {post.publishedAt 
                      ? new Date(post.publishedAt).toLocaleDateString()
                      : new Date(post.createdAt).toLocaleDateString()
                    }
                  </td>
                  <td className="p-4">
                    <div className="flex justify-end gap-2">
                      {post.status === "published" && (
                        <Link href={`/blog/${post.slug}`} target="_blank">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </Link>
                      )}
                      <Link href={`/admin/blog/posts/${post.id}`}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Full Editor"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      </Link>
                      {post.status === "draft" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => publishPost(post.id)}
                        >
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => deletePost(post.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Post</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Slug</label>
              <Input
                value={editForm.slug}
                onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium">
                SEO Title ({editForm.seoTitle.length}/60)
              </label>
              <Input
                value={editForm.seoTitle}
                onChange={(e) => setEditForm({ ...editForm, seoTitle: e.target.value })}
                maxLength={60}
              />
              {editForm.seoTitle.length > 60 && (
                <p className="text-xs text-red-600 mt-1">Too long for optimal SEO</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium">
                Meta Description ({editForm.metaDescription.length}/160)
              </label>
              <Textarea
                value={editForm.metaDescription}
                onChange={(e) => setEditForm({ ...editForm, metaDescription: e.target.value })}
                maxLength={160}
                rows={2}
              />
              {editForm.metaDescription.length > 160 && (
                <p className="text-xs text-red-600 mt-1">Too long for optimal SEO</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium">Excerpt</label>
              <Textarea
                value={editForm.excerpt}
                onChange={(e) => setEditForm({ ...editForm, excerpt: e.target.value })}
                rows={3}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Status</label>
              <Select
                value={editForm.status}
                onValueChange={(v) => setEditForm({ ...editForm, status: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={savePost} disabled={saving} className="flex-1">
                {saving ? "Saving..." : "Save Changes"}
              </Button>
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
