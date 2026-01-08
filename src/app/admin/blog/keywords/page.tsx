"use client";

/**
 * Blog Keywords Management Page
 * 
 * Create keyword lists, add keywords, import/export
 */

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Tag, Plus, Trash2, Upload, Download, RefreshCw,
  ChevronLeft, Search, Filter, Edit2, Save, X
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface KeywordList {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  keywordCount?: number;
  createdAt: string;
}

interface Keyword {
  id: string;
  keyword: string;
  intent: string;
  priority: number;
  status: string;
  usageCount: number;
  lastUsedAt: string | null;
}

export default function KeywordsPage() {
  const { data: session, status } = useSession();
  const [lists, setLists] = useState<KeywordList[]>([]);
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [selectedList, setSelectedList] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNewListDialog, setShowNewListDialog] = useState(false);
  const [showAddKeywordsDialog, setShowAddKeywordsDialog] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [newListDesc, setNewListDesc] = useState("");
  const [bulkKeywords, setBulkKeywords] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      fetchLists();
    }
  }, [status, isAdmin]);

  useEffect(() => {
    if (selectedList) {
      fetchKeywords(selectedList);
    }
  }, [selectedList]);

  const fetchLists = async () => {
    try {
      const res = await fetch("/api/blog/keyword-lists?includeCount=true");
      const data = await res.json();
      setLists(data.lists || []);
      if (data.lists?.length > 0 && !selectedList) {
        setSelectedList(data.lists[0].id);
      }
    } catch (error) {
      toast.error("Failed to load keyword lists");
    } finally {
      setLoading(false);
    }
  };

  const fetchKeywords = async (listId: string) => {
    try {
      const res = await fetch(`/api/blog/keywords?listId=${listId}&limit=100`);
      const data = await res.json();
      setKeywords(data.keywords || []);
    } catch (error) {
      toast.error("Failed to load keywords");
    }
  };

  const createList = async () => {
    if (!newListName.trim()) {
      toast.error("List name is required");
      return;
    }

    try {
      const res = await fetch("/api/blog/keyword-lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newListName,
          description: newListDesc || null,
        }),
      });
      
      if (res.ok) {
        toast.success("Keyword list created");
        setShowNewListDialog(false);
        setNewListName("");
        setNewListDesc("");
        fetchLists();
      } else {
        toast.error("Failed to create list");
      }
    } catch (error) {
      toast.error("Error creating list");
    }
  };

  const addKeywords = async () => {
    if (!selectedList || !bulkKeywords.trim()) {
      toast.error("Please enter keywords");
      return;
    }

    const keywordLines = bulkKeywords
      .split("\n")
      .map(k => k.trim())
      .filter(k => k.length > 0);

    if (keywordLines.length === 0) {
      toast.error("No valid keywords found");
      return;
    }

    try {
      const res = await fetch("/api/blog/keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          keywordLines.map(keyword => ({
            listId: selectedList,
            keyword,
            intent: "informational",
            priority: 5,
          }))
        ),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(`Added ${data.keywords.length} keywords`);
        setShowAddKeywordsDialog(false);
        setBulkKeywords("");
        fetchKeywords(selectedList);
        fetchLists();
      } else {
        toast.error("Failed to add keywords");
      }
    } catch (error) {
      toast.error("Error adding keywords");
    }
  };

  const deleteKeyword = async (id: string) => {
    if (!confirm("Delete this keyword?")) return;

    try {
      const res = await fetch(`/api/blog/keywords/${id}`, {
        method: "DELETE",
      });
      
      if (res.ok) {
        toast.success("Keyword deleted");
        fetchKeywords(selectedList!);
        fetchLists();
      } else {
        toast.error("Failed to delete keyword");
      }
    } catch (error) {
      toast.error("Error deleting keyword");
    }
  };

  const updateKeyword = async (id: string, updates: Partial<Keyword>) => {
    try {
      const res = await fetch(`/api/blog/keywords/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (res.ok) {
        toast.success("Keyword updated");
        fetchKeywords(selectedList!);
      } else {
        toast.error("Failed to update keyword");
      }
    } catch (error) {
      toast.error("Error updating keyword");
    }
  };

  const exportCSV = () => {
    const csv = [
      ["Keyword", "Intent", "Priority", "Status", "Usage Count"].join(","),
      ...keywords.map(k => 
        [k.keyword, k.intent, k.priority, k.status, k.usageCount].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `keywords-${selectedList}.csv`;
    a.click();
  };

  const importCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedList) return;

    const text = await file.text();
    const lines = text.split("\n").slice(1); // Skip header
    const keywordLines = lines
      .map(line => line.split(",")[0]?.trim())
      .filter(k => k && k.length > 0);

    setBulkKeywords(keywordLines.join("\n"));
    setShowAddKeywordsDialog(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const filteredKeywords = keywords.filter(k =>
    k.keyword.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            <Tag className="w-6 h-6 text-green-600" />
            Keyword Manager
          </h1>
        </div>
        <Dialog open={showNewListDialog} onOpenChange={setShowNewListDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New List
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Keyword List</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium">Name</label>
                <Input
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  placeholder="e.g., Beginner Topics"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={newListDesc}
                  onChange={(e) => setNewListDesc(e.target.value)}
                  placeholder="Optional description..."
                />
              </div>
              <Button onClick={createList} className="w-full">
                Create List
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 lg:grid-cols-[300px,1fr]">
        {/* Lists Sidebar */}
        <div className="space-y-4">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
            Keyword Lists
          </h2>
          {lists.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No lists yet. Create one to get started.
            </p>
          ) : (
            <div className="space-y-2">
              {lists.map((list) => (
                <button
                  key={list.id}
                  onClick={() => setSelectedList(list.id)}
                  className={`w-full p-4 rounded-lg text-left transition-colors ${
                    selectedList === list.id
                      ? "bg-amber-50 border-amber-200 border-2 dark:bg-amber-950/20"
                      : "bg-card border border-border hover:border-amber-200"
                  }`}
                >
                  <div className="font-medium">{list.name}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {list.keywordCount || 0} keywords
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Keywords */}
        <div className="space-y-4">
          {selectedList && (
            <>
              {/* Toolbar */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search keywords..."
                    className="pl-9"
                  />
                </div>
                <Dialog open={showAddKeywordsDialog} onOpenChange={setShowAddKeywordsDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Keywords
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Keywords</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <p className="text-sm text-muted-foreground">
                        Enter one keyword per line
                      </p>
                      <Textarea
                        value={bulkKeywords}
                        onChange={(e) => setBulkKeywords(e.target.value)}
                        placeholder="water damage restoration&#10;emergency flood cleanup&#10;mold remediation near me"
                        rows={10}
                      />
                      <Button onClick={addKeywords} className="w-full">
                        Add {bulkKeywords.split("\n").filter(k => k.trim()).length} Keywords
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                <Button variant="outline" onClick={exportCSV}>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={importCSV}
                    className="hidden"
                  />
                  <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="w-4 h-4 mr-2" />
                    Import
                  </Button>
                </div>
              </div>

              {/* Keywords Table */}
              <div className="bg-card rounded-xl border border-border overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-4 font-medium">Keyword</th>
                      <th className="text-left p-4 font-medium">Intent</th>
                      <th className="text-left p-4 font-medium">Priority</th>
                      <th className="text-left p-4 font-medium">Status</th>
                      <th className="text-left p-4 font-medium">Used</th>
                      <th className="text-right p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredKeywords.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-muted-foreground">
                          No keywords found
                        </td>
                      </tr>
                    ) : (
                      filteredKeywords.map((keyword) => (
                        <tr key={keyword.id} className="border-t border-border">
                          <td className="p-4">{keyword.keyword}</td>
                          <td className="p-4">
                            <Select
                              value={keyword.intent}
                              onValueChange={(v) => updateKeyword(keyword.id, { intent: v } as Partial<Keyword>)}
                            >
                              <SelectTrigger className="w-[140px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="informational">Informational</SelectItem>
                                <SelectItem value="transactional">Transactional</SelectItem>
                                <SelectItem value="navigational">Navigational</SelectItem>
                                <SelectItem value="commercial">Commercial</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="p-4">
                            <Select
                              value={keyword.priority.toString()}
                              onValueChange={(v) => updateKeyword(keyword.id, { priority: parseInt(v) })}
                            >
                              <SelectTrigger className="w-[80px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {[1,2,3,4,5,6,7,8,9,10].map(n => (
                                  <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="p-4">
                            <Badge variant={
                              keyword.status === "used" ? "default" :
                              keyword.status === "pending" ? "secondary" :
                              "outline"
                            }>
                              {keyword.status}
                            </Badge>
                          </td>
                          <td className="p-4">{keyword.usageCount}x</td>
                          <td className="p-4 text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteKeyword(keyword.id)}
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
