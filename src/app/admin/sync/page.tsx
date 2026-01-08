"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, RefreshCw, Database, CheckCircle2 } from "lucide-react";

interface SyncStatus {
  status: string;
  businessCount: number;
  categoryCount: number;
  apiConfigured: boolean;
}

interface SyncResult {
  success: boolean;
  summary?: {
    totalInserted: number;
    totalSkipped: number;
    categoriesSynced: number;
  };
  byCategory?: Record<string, { inserted: number; skipped: number }>;
  error?: string;
}

export default function AdminSyncPage() {
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastResult, setLastResult] = useState<SyncResult | null>(null);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/google-places/sync-all");
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error("Error fetching status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncAll = async () => {
    setSyncing(true);
    setLastResult(null);
    toast.info("Starting full sync for all categories...");

    try {
      const response = await fetch("/api/google-places/sync-all", {
        method: "POST",
      });
      const data: SyncResult = await response.json();

      if (data.success) {
        toast.success(
          `Synced ${data.summary?.totalInserted} new businesses across ${data.summary?.categoriesSynced} categories!`
        );
        setLastResult(data);
        fetchStatus(); // Refresh status
      } else {
        toast.error(data.error || "Sync failed");
      }
    } catch (error) {
      console.error("Error during sync:", error);
      toast.error("An unexpected error occurred during sync.");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-var(--header-height))] py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Google Places Sync</h1>
          <p className="text-muted-foreground">
            Synchronize business data from Google Places API for all categories
          </p>
        </div>

        {/* Status Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Database Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading status...</span>
              </div>
            ) : status ? (
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-secondary/50">
                  <div className="text-2xl font-bold">{status.businessCount}</div>
                  <div className="text-sm text-muted-foreground">Businesses</div>
                </div>
                <div className="p-4 rounded-lg bg-secondary/50">
                  <div className="text-2xl font-bold">{status.categoryCount}</div>
                  <div className="text-sm text-muted-foreground">Categories</div>
                </div>
                <div className="p-4 rounded-lg bg-secondary/50">
                  <div className="flex items-center gap-2">
                    {status.apiConfigured ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                        <span className="text-green-500 font-medium">API Ready</span>
                      </>
                    ) : (
                      <Badge variant="destructive">API Not Configured</Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">Google Places API</div>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">Unable to fetch status</p>
            )}
          </CardContent>
        </Card>

        {/* Sync Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Sync All Categories</CardTitle>
            <CardDescription>
              This will fetch businesses from Google Places API for all 5 water damage service categories.
              The sync stores only essential data (name, address, contact info) to keep
              the database lean. Photos and reviews are fetched live from Google API.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button
                onClick={handleSyncAll}
                disabled={syncing || !status?.apiConfigured}
                className="w-full sm:w-auto"
              >
                {syncing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Syncing All Categories...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Start Full Sync
                  </>
                )}
              </Button>

              {!status?.apiConfigured && (
                <p className="text-sm text-amber-500">
                  ⚠️ Google Places API key not configured. Add GOOGLE_PLACES_API_KEY to your environment variables.
                </p>
              )}

              <div className="text-sm text-muted-foreground">
                <p className="font-medium mb-2">What gets synced:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Business name, address, and location</li>
                  <li>Google Place ID (for fetching live photos & reviews)</li>
                  <li>Rating and review count (as reference)</li>
                  <li>Category assignment</li>
                  <li>Single thumbnail photo reference</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Card */}
        {lastResult && lastResult.success && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                Sync Complete
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-3 gap-4 mb-6">
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                  <div className="text-2xl font-bold text-green-500">
                    +{lastResult.summary?.totalInserted}
                  </div>
                  <div className="text-sm text-muted-foreground">New Businesses</div>
                </div>
                <div className="p-4 rounded-lg bg-secondary/50">
                  <div className="text-2xl font-bold">
                    {lastResult.summary?.totalSkipped}
                  </div>
                  <div className="text-sm text-muted-foreground">Skipped (Existing)</div>
                </div>
                <div className="p-4 rounded-lg bg-secondary/50">
                  <div className="text-2xl font-bold">
                    {lastResult.summary?.categoriesSynced}
                  </div>
                  <div className="text-sm text-muted-foreground">Categories Synced</div>
                </div>
              </div>

              {lastResult.byCategory && (
                <div>
                  <h4 className="font-medium mb-3">By Category:</h4>
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {Object.entries(lastResult.byCategory).map(([slug, data]) => (
                      <div
                        key={slug}
                        className="flex items-center justify-between py-2 px-3 rounded bg-secondary/30"
                      >
                        <span className="text-sm">{slug}</span>
                        <div className="flex items-center gap-3 text-sm">
                          <span className="text-green-500">+{data.inserted}</span>
                          <span className="text-muted-foreground">({data.skipped} skipped)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
