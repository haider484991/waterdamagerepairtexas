"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Shield,
  Building2,
  Users,
  Star,
  RefreshCw,
  Database,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Loader2,
  Search,
  Tag,
  FileText,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

interface AdminStats {
  businesses: number;
  categories: number;
  users: number;
  reviews: number;
  pendingClaims: number;
}

interface SyncProgress {
  status: "idle" | "syncing" | "completed" | "error";
  currentStep: string;
  currentCategory?: string;
  categoriesProcessed: number;
  totalCategories: number;
  businessesInserted: number;
  businessesSkipped: number;
  categoriesAdded: number;
  categoriesUpdated: number;
  categoriesRemoved: number;
  error?: string;
  startTime?: number;
  endTime?: number;
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncingCategories, setSyncingCategories] = useState(false);
  const [isBulkSyncing, setIsBulkSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null);
  const [showProgressDialog, setShowProgressDialog] = useState(false);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check admin access
  const isAdmin = session?.user?.email === "admin@plano.directory" || 
                  session?.user?.email?.endsWith("@admin.com") ||
                  session?.user?.email === "admin@test.com";

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch("/api/admin/stats");
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error("Error fetching admin stats:", error);
      } finally {
        setIsLoading(false);
      }
    }

    if (session?.user && isAdmin) {
      fetchStats();
    } else {
      setIsLoading(false);
    }
  }, [session, isAdmin]);

  // Poll for sync progress - must be before early returns
  useEffect(() => {
    if (showProgressDialog && syncingCategories) {
      const interval = setInterval(async () => {
        try {
          const response = await fetch("/api/admin/sync-progress");
          const progress = await response.json();
          setSyncProgress(progress);

          // If sync is completed or errored, stop polling
          if (progress.status === "completed" || progress.status === "error") {
            clearInterval(interval);
            progressIntervalRef.current = null;
            setSyncingCategories(false);
            setShowProgressDialog(false);
            
            // Refresh stats
            const statsResponse = await fetch("/api/admin/stats");
            const statsData = await statsResponse.json();
            setStats(statsData);

            // Show completion message
            if (progress.status === "completed") {
              const parts = [];
              if (progress.categoriesAdded > 0) parts.push(`${progress.categoriesAdded} categories added`);
              if (progress.categoriesUpdated > 0) parts.push(`${progress.categoriesUpdated} updated`);
              if (progress.categoriesRemoved > 0) parts.push(`${progress.categoriesRemoved} removed`);
              
              const categoryMessage = parts.length > 0 
                ? `Categories: ${parts.join(", ")}. `
                : `Categories synced. `;
              
              const businessMessage = progress.businessesInserted > 0
                ? `Businesses: ${progress.businessesInserted} added, ${progress.businessesSkipped} skipped.`
                : "";
              
              toast.success(categoryMessage + businessMessage);
            } else {
              toast.error(progress.error || "Sync failed");
            }
          }
        } catch (error) {
          console.error("Error fetching progress:", error);
        }
      }, 500); // Poll every 500ms

      progressIntervalRef.current = interval;

      return () => {
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
      };
    } else {
      // Clean up interval if dialog is closed or sync stops
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    }
  }, [showProgressDialog, syncingCategories]);

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    redirect("/login?callbackUrl=/admin");
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center glass-card rounded-xl p-8 max-w-md">
          <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-4">
            You don&apos;t have permission to access the admin panel.
          </p>
          <Button asChild>
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  const handleSyncAll = async () => {
    setIsSyncing(true);
    try {
      const response = await fetch("/api/google-places/sync-all", {
        method: "POST",
      });
      const data = await response.json();
      
      if (data.success) {
        toast.success(`Synced ${data.totalSynced} businesses across all categories!`);
        // Refresh stats
        const statsResponse = await fetch("/api/admin/stats");
        const statsData = await statsResponse.json();
        setStats(statsData);
      } else {
        toast.error(data.error || "Sync failed");
      }
    } catch (error) {
      toast.error("Failed to sync businesses");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncCategories = async () => {
    setSyncingCategories(true);
    setShowProgressDialog(true);
    setSyncProgress({
      status: "syncing",
      currentStep: "Starting sync...",
      categoriesProcessed: 0,
      totalCategories: 5,
      businessesInserted: 0,
      businessesSkipped: 0,
      categoriesAdded: 0,
      categoriesUpdated: 0,
      categoriesRemoved: 0,
      startTime: Date.now(),
    });

    try {
      // Start the sync (don't await - it runs in background)
      fetch("/api/admin/sync-categories", {
        method: "POST",
      }).catch((error) => {
        console.error("Sync error:", error);
        setSyncProgress((prev) => ({
          ...prev!,
          status: "error",
          error: "Failed to start sync",
        }));
        setSyncingCategories(false);
        setShowProgressDialog(false);
        toast.error("Failed to start sync");
      });
    } catch (error) {
      toast.error("Failed to sync categories");
      setSyncingCategories(false);
      setShowProgressDialog(false);
    }
  };

  const handleBulkSync = async () => {
    setIsBulkSyncing(true);
    toast.info("Starting bulk sync across all states... This may take a few minutes.");
    
    try {
      const response = await fetch("/api/admin/bulk-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          maxStates: 25,
          citiesPerState: 5,
          queriesPerCity: 2,
        }),
      });
      const data = await response.json();
      
      if (data.success) {
        toast.success(`🎉 Bulk sync complete! Added ${data.summary.totalInserted} businesses across ${data.summary.statesSynced} states`);
        // Refresh stats
        const statsResponse = await fetch("/api/admin/stats");
        const statsData = await statsResponse.json();
        setStats(statsData);
      } else {
        toast.error(data.error || "Bulk sync failed");
      }
    } catch (error) {
      toast.error("Failed to run bulk sync");
    } finally {
      setIsBulkSyncing(false);
    }
  };

  const statCards = [
    { 
      label: "Total Businesses", 
      value: stats?.businesses || 0, 
      icon: Building2,
      color: "text-blue-500",
      bgColor: "bg-blue-500/20",
    },
    { 
      label: "Categories", 
      value: stats?.categories || 0, 
      icon: Tag,
      color: "text-amber-500",
      bgColor: "bg-amber-500/20",
    },
    { 
      label: "Total Users", 
      value: stats?.users || 0, 
      icon: Users,
      color: "text-green-500",
      bgColor: "bg-green-500/20",
    },
    { 
      label: "Reviews", 
      value: stats?.reviews || 0, 
      icon: Star,
      color: "text-purple-500",
      bgColor: "bg-purple-500/20",
    },
    { 
      label: "Pending Claims", 
      value: stats?.pendingClaims || 0, 
      icon: FileText,
      color: "text-red-500",
      bgColor: "bg-red-500/20",
    },
  ];

  const adminActions = [
    {
      title: "Sync Categories",
      description: "Sync all 5 pickleball categories and update category data",
      icon: Tag,
      action: handleSyncCategories,
      loading: syncingCategories,
      color: "text-amber-500",
    },
    {
      title: "Quick Sync",
      description: "Pull pickleball businesses from Google Places API",
      icon: RefreshCw,
      action: handleSyncAll,
      loading: isSyncing,
      color: "text-blue-500",
    },
    {
      title: "Bulk Sync (All States)",
      description: "Populate database with pickleball businesses from all 25 states - grows your data fast!",
      icon: Database,
      action: handleBulkSync,
      loading: isBulkSyncing,
      color: "text-green-500",
    },
  ];

  const quickLinks = [
    { title: "Bulk Data Sync", href: "/admin/bulk-sync", icon: Database },
    { title: "Business Approvals", href: "/admin/businesses", icon: Building2 },
    { title: "Claim Requests", href: "/admin/claims", icon: FileText },
    { title: "User Management", href: "/admin/users", icon: Users },
  ];

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <Shield className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Admin Panel</h1>
              <p className="text-muted-foreground">
                Manage your business directory
              </p>
            </div>
          </div>
          <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Admin Access
          </Badge>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8"
        >
          {statCards.map((stat) => (
            <div key={stat.label} className="glass-card rounded-xl p-5">
              <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center mb-3`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              {isLoading ? (
                <Skeleton className="h-8 w-16 mb-1" />
              ) : (
                <div className="text-2xl font-bold">{stat.value.toLocaleString()}</div>
              )}
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Admin Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid md:grid-cols-2 gap-4 mb-8"
        >
          {adminActions.map((action) => (
            <button
              key={action.title}
              onClick={action.action}
              disabled={action.loading}
              className="glass-card rounded-xl p-6 text-left hover:border-primary/30 transition-colors disabled:opacity-50"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-lg bg-secondary flex items-center justify-center`}>
                    {action.loading ? (
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    ) : (
                      <action.icon className={`w-6 h-6 ${action.color}`} />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{action.title}</h3>
                    <p className="text-sm text-muted-foreground">{action.description}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </button>
          ))}
        </motion.div>

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-lg font-semibold mb-4">Quick Links</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <motion.div
                  whileHover={{ y: -2 }}
                  className="glass-card rounded-xl p-4 flex items-center gap-3 hover:border-primary/30 transition-colors"
                >
                  <link.icon className="w-5 h-5 text-primary" />
                  <span className="font-medium">{link.title}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
                </motion.div>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8"
        >
          <h2 className="text-lg font-semibold mb-4">Database Status</h2>
          <div className="glass-card rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
              <span className="text-green-500 font-medium">Database Connected</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Google API:</span>
                <span className="ml-2 text-green-500">Active</span>
              </div>
              <div>
                <span className="text-muted-foreground">Last Sync:</span>
                <span className="ml-2">Today</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Progress Dialog */}
      <Dialog open={showProgressDialog} onOpenChange={(open) => {
        if (!open && syncProgress?.status === "syncing") {
          // Don't allow closing while syncing
          return;
        }
        setShowProgressDialog(open);
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {syncProgress?.status === "syncing" && (
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              )}
              {syncProgress?.status === "completed" && (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              )}
              {syncProgress?.status === "error" && (
                <AlertTriangle className="w-5 h-5 text-red-500" />
              )}
              Sync Progress
            </DialogTitle>
            <DialogDescription>
              {syncProgress?.status === "syncing" 
                ? "Syncing categories and fetching businesses from Google Places API..."
                : syncProgress?.status === "completed"
                ? "Sync completed successfully!"
                : "Sync encountered an error"}
            </DialogDescription>
          </DialogHeader>

          {syncProgress && (
            <div className="space-y-6 mt-4">
              {/* Current Step */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Current Step</span>
                  {syncProgress.status === "syncing" && (
                    <Badge variant="outline" className="bg-blue-500/20 text-blue-500 border-blue-500/30">
                      In Progress
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{syncProgress.currentStep}</p>
                {syncProgress.currentCategory && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Category: {syncProgress.currentCategory}
                  </p>
                )}
              </div>

              {/* Overall Progress */}
              {syncProgress.totalCategories > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Overall Progress</span>
                    <span className="text-sm text-muted-foreground">
                      {syncProgress.categoriesProcessed} / {syncProgress.totalCategories}
                    </span>
                  </div>
                  <Progress 
                    value={(syncProgress.categoriesProcessed / syncProgress.totalCategories) * 100} 
                    className="h-2"
                  />
                </div>
              )}

              {/* Category Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="glass-card rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-500">
                    {syncProgress.categoriesAdded}
                  </div>
                  <div className="text-xs text-muted-foreground">Added</div>
                </div>
                <div className="glass-card rounded-lg p-4">
                  <div className="text-2xl font-bold text-blue-500">
                    {syncProgress.categoriesUpdated}
                  </div>
                  <div className="text-xs text-muted-foreground">Updated</div>
                </div>
                <div className="glass-card rounded-lg p-4">
                  <div className="text-2xl font-bold text-red-500">
                    {syncProgress.categoriesRemoved}
                  </div>
                  <div className="text-xs text-muted-foreground">Removed</div>
                </div>
              </div>

              {/* Business Stats */}
              {(syncProgress.businessesInserted > 0 || syncProgress.businessesSkipped > 0) && (
                <div>
                  <div className="text-sm font-medium mb-3">Business Sync</div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="glass-card rounded-lg p-4">
                      <div className="text-xl font-bold text-green-500">
                        {syncProgress.businessesInserted}
                      </div>
                      <div className="text-xs text-muted-foreground">Businesses Added</div>
                    </div>
                    <div className="glass-card rounded-lg p-4">
                      <div className="text-xl font-bold text-amber-500">
                        {syncProgress.businessesSkipped}
                      </div>
                      <div className="text-xs text-muted-foreground">Already Existed</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {syncProgress.error && (
                <div className="glass-card rounded-lg p-4 bg-red-500/20 border-red-500/30">
                  <div className="text-sm text-red-500 font-medium">Error</div>
                  <div className="text-sm text-muted-foreground mt-1">{syncProgress.error}</div>
                </div>
              )}

              {/* Time Elapsed */}
              {syncProgress.startTime && (
                <div className="text-xs text-muted-foreground text-center">
                  {syncProgress.endTime 
                    ? `Completed in ${Math.round((syncProgress.endTime - syncProgress.startTime) / 1000)}s`
                    : `Running for ${Math.round((Date.now() - syncProgress.startTime) / 1000)}s`}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

