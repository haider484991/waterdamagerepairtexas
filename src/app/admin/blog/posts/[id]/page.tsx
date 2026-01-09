"use client";

/**
 * Blog Post Editor Page
 * 
 * Rich text/markdown editor with SEO preview and manual overrides
 */

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect, useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  Save, ChevronLeft, Eye, CheckCircle, Calendar, AlertCircle,
  ExternalLink, RefreshCw, FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MarkdownEditor } from "@/components/blog/MarkdownEditor";
import { toast } from "sonner";
import { getSiteUrl } from "@/lib/site-url";

const SITE_URL = getSiteUrl();

interface Post {
  id: string;
  title: string;
  slug: string;
  contentMd: string | null;
  contentHtml: string | null;
  excerpt: string | null;
  seoTitle: string | null;
  metaDescription: string | null;
  canonicalUrl: string | null;
  status: string;
  publishedAt: string | null;
  scheduledAt: string | null;
  coverImageUrl: string | null;
  coverImageAlt: string | null;
  ogImageUrl: string | null;
  wordCount: number | null;
  readingTime: number | null;
}

export default function PostEditorPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const postId = params?.id as string;

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    contentMd: "",
    excerpt: "",
    seoTitle: "",
    metaDescription: "",
    canonicalUrl: "",
    status: "draft",
    coverImageUrl: "",
    coverImageAlt: "",
    ogImageUrl: "",
    scheduledAt: "",
  });

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
    if (status === "authenticated" && isAdmin && postId) {
      if (postId === "new") {
        setLoading(false);
        setPost({ id: "new" } as any); // Marker for new post
      } else {
        fetchPost();
      }
    }
  }, [status, isAdmin, postId]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/blog/posts/${postId}`);

      if (!res.ok) {
        if (res.status === 404) {
          toast.error("Post not found");
          router.push("/admin/blog/posts");
          return;
        }
        throw new Error("Failed to load post");
      }

      const data = await res.json();
      setPost(data.post);
      setFormData({
        title: data.post.title || "",
        slug: data.post.slug || "",
        contentMd: data.post.contentMd || "",
        excerpt: data.post.excerpt || "",
        seoTitle: data.post.seoTitle || "",
        metaDescription: data.post.metaDescription || "",
        canonicalUrl: data.post.canonicalUrl || "",
        status: data.post.status || "draft",
        coverImageUrl: data.post.coverImageUrl || "",
        coverImageAlt: data.post.coverImageAlt || "",
        ogImageUrl: data.post.ogImageUrl || "",
        scheduledAt: data.post.scheduledAt ? new Date(data.post.scheduledAt).toISOString().slice(0, 16) : "",
      });
    } catch (error) {
      toast.error("Failed to load post");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const savePost = async () => {
    if (!post) return;

    try {
      setSaving(true);
      const isNew = postId === "new";
      const url = isNew ? "/api/blog/posts" : `/api/blog/posts/${post.id}`;
      const method = isNew ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(isNew ? "Post created!" : "Post saved!");

        if (isNew && data.post?.id) {
          router.push(`/admin/blog/posts/${data.post.id}`);
        } else {
          fetchPost();
        }
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to save post");
      }
    } catch (error) {
      toast.error("Error saving post");
    } finally {
      setSaving(false);
    }
  };

  const publishPost = async () => {
    if (!post) return;

    try {
      setSaving(true);
      const isNew = postId === "new";
      const url = isNew ? "/api/blog/posts" : `/api/blog/posts/${post.id}`;
      const method = isNew ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          status: "published",
          publishedAt: new Date().toISOString(),
        }),
      });

      if (res.ok) {
        toast.success("Post published!");
        router.push("/admin/blog/posts");
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to publish post");
      }
    } catch (error) {
      toast.error("Error publishing post");
    } finally {
      setSaving(false);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  if (status === "loading" || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-48 mb-8" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  if (!post) {
    return null;
  }

  const seoTitleLength = formData.seoTitle.length;
  const metaDescLength = formData.metaDescription.length;
  const previewUrl = post.status === "published"
    ? `${SITE_URL}/blog/${formData.slug || post.slug}`
    : null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/admin/blog/posts">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FileText className="w-6 h-6 text-blue-600" />
              {postId === "new" ? "New Post" : "Edit Post"}
            </h1>
          </div>
        </div>
        <div className="flex gap-3">
          {previewUrl && (
            <Link href={previewUrl} target="_blank">
              <Button variant="outline">
                <ExternalLink className="w-4 h-4 mr-2" />
                Preview
              </Button>
            </Link>
          )}
          <Button onClick={savePost} disabled={saving}>
            {saving ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save
          </Button>
          {formData.status !== "published" && (
            <Button onClick={publishPost} variant="default">
              <CheckCircle className="w-4 h-4 mr-2" />
              Publish
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr,400px]">
        {/* Main Editor */}
        <div className="space-y-6">
          {/* Title */}
          <div>
            <label className="text-sm font-medium mb-2 block">Title</label>
            <Input
              value={formData.title}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  title: e.target.value,
                  slug: formData.slug || generateSlug(e.target.value),
                });
              }}
              placeholder="Enter post title..."
              className="text-lg"
            />
          </div>

          {/* Slug */}
          <div>
            <label className="text-sm font-medium mb-2 block">Slug</label>
            <Input
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              placeholder="post-url-slug"
            />
            <p className="text-xs text-muted-foreground mt-1">
              URL: {SITE_URL}/blog/{formData.slug || "slug"}
            </p>
          </div>

          {/* Content Editor */}
          <div>
            <label className="text-sm font-medium mb-2 block">Content (Markdown)</label>
            <MarkdownEditor
              value={formData.contentMd}
              onChange={(value) => setFormData({ ...formData, contentMd: value })}
              placeholder="Write your article in Markdown..."
            />
          </div>

          {/* Excerpt */}
          <div>
            <label className="text-sm font-medium mb-2 block">Excerpt</label>
            <Textarea
              value={formData.excerpt}
              onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
              placeholder="Brief summary for blog listing..."
              rows={3}
            />
          </div>
        </div>

        {/* Sidebar - SEO & Settings */}
        <div className="space-y-6">
          {/* SEO Preview */}
          <div className="p-6 bg-card rounded-xl border border-border">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <Eye className="w-5 h-5" />
              SEO Preview
            </h2>

            {/* SEO Title */}
            <div className="mb-4">
              <label className="text-sm font-medium mb-2 block">
                SEO Title ({seoTitleLength}/60)
              </label>
              <Input
                value={formData.seoTitle}
                onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
                maxLength={60}
                className={seoTitleLength > 60 ? "border-red-500" : ""}
              />
              {seoTitleLength > 60 && (
                <p className="text-xs text-red-600 mt-1">Too long for optimal SEO</p>
              )}
              <div className="mt-2 p-3 bg-muted rounded text-sm">
                <div className="text-blue-600 font-medium line-clamp-1">
                  {formData.seoTitle || formData.title || "Title"}
                </div>
                <div className="text-green-600 text-xs mt-1">
                  {SITE_URL}/blog/{formData.slug || "slug"}
                </div>
              </div>
            </div>

            {/* Meta Description */}
            <div className="mb-4">
              <label className="text-sm font-medium mb-2 block">
                Meta Description ({metaDescLength}/160)
              </label>
              <Textarea
                value={formData.metaDescription}
                onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                maxLength={160}
                rows={3}
                className={metaDescLength > 160 ? "border-red-500" : ""}
              />
              {metaDescLength > 160 && (
                <p className="text-xs text-red-600 mt-1">Too long for optimal SEO</p>
              )}
              <div className="mt-2 p-3 bg-muted rounded text-sm text-muted-foreground line-clamp-2">
                {formData.metaDescription || formData.excerpt || "Description will appear here..."}
              </div>
            </div>

            {/* Canonical URL */}
            <div>
              <label className="text-sm font-medium mb-2 block">Canonical URL</label>
              <Input
                value={formData.canonicalUrl}
                onChange={(e) => setFormData({ ...formData, canonicalUrl: e.target.value })}
                placeholder={`${SITE_URL}/blog/${formData.slug || "slug"}`}
              />
            </div>
          </div>

          {/* Status & Publishing */}
          <div className="p-6 bg-card rounded-xl border border-border">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Publishing
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select
                  value={formData.status}
                  onValueChange={(v) => setFormData({ ...formData, status: v })}
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

              {formData.status === "scheduled" && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Schedule Date</label>
                  <Input
                    type="datetime-local"
                    value={formData.scheduledAt}
                    onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                  />
                </div>
              )}

              {post.publishedAt && (
                <div className="text-sm text-muted-foreground">
                  <p>Published: {new Date(post.publishedAt).toLocaleString()}</p>
                </div>
              )}
            </div>
          </div>

          {/* Images */}
          <div className="p-6 bg-card rounded-xl border border-border">
            <h2 className="font-semibold mb-4">Images</h2>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Cover Image URL</label>
                <Input
                  value={formData.coverImageUrl || ""}
                  onChange={(e) => setFormData({ ...formData, coverImageUrl: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Cover Image Alt Text</label>
                <Input
                  value={formData.coverImageAlt || ""}
                  onChange={(e) => setFormData({ ...formData, coverImageAlt: e.target.value })}
                  placeholder="Descriptive alt text..."
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">OG Image URL</label>
                <Input
                  value={formData.ogImageUrl || ""}
                  onChange={(e) => setFormData({ ...formData, ogImageUrl: e.target.value })}
                  placeholder="https://... (1200x630)"
                />
              </div>
            </div>
          </div>

          {/* Stats */}
          {post.wordCount && (
            <div className="p-6 bg-card rounded-xl border border-border">
              <h2 className="font-semibold mb-4">Stats</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Words:</span>
                  <span className="font-medium">{post.wordCount.toLocaleString()}</span>
                </div>
                {post.readingTime && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Reading Time:</span>
                    <span className="font-medium">{post.readingTime} min</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
