"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, MapPin, Database, CheckCircle2, Zap } from "lucide-react";
import Link from "next/link";

const US_STATES = [
  { code: "CA", name: "California" },
  { code: "TX", name: "Texas" },
  { code: "FL", name: "Florida" },
  { code: "NY", name: "New York" },
  { code: "PA", name: "Pennsylvania" },
  { code: "IL", name: "Illinois" },
  { code: "OH", name: "Ohio" },
  { code: "GA", name: "Georgia" },
  { code: "NC", name: "North Carolina" },
  { code: "MI", name: "Michigan" },
  { code: "NJ", name: "New Jersey" },
  { code: "VA", name: "Virginia" },
  { code: "WA", name: "Washington" },
  { code: "AZ", name: "Arizona" },
  { code: "MA", name: "Massachusetts" },
  { code: "TN", name: "Tennessee" },
  { code: "IN", name: "Indiana" },
  { code: "MD", name: "Maryland" },
  { code: "MO", name: "Missouri" },
  { code: "WI", name: "Wisconsin" },
  { code: "CO", name: "Colorado" },
  { code: "MN", name: "Minnesota" },
  { code: "SC", name: "South Carolina" },
  { code: "AL", name: "Alabama" },
  { code: "LA", name: "Louisiana" },
];

interface SyncResult {
  success: boolean;
  summary?: {
    totalInserted: number;
    totalSkipped: number;
    statesSynced: number;
    apiCallsMade: number;
  };
  byState?: Record<string, { inserted: number; skipped: number; cities: string[] }>;
  error?: string;
}

export default function BulkSyncPage() {
  const [syncing, setSyncing] = useState(false);
  const [selectedState, setSelectedState] = useState<string>("all");
  const [citiesPerState, setCitiesPerState] = useState<string>("5");
  const [lastResult, setLastResult] = useState<SyncResult | null>(null);

  const handleBulkSync = async () => {
    setSyncing(true);
    setLastResult(null);
    
    const stateLabel = selectedState === "all" ? "all states" : US_STATES.find(s => s.code === selectedState)?.name;
    toast.info(`Starting bulk sync for ${stateLabel}...`);

    try {
      const body: Record<string, unknown> = {
        citiesPerState: parseInt(citiesPerState),
        queriesPerCity: 2,
      };
      
      if (selectedState !== "all") {
        body.stateCode = selectedState;
      } else {
        body.maxStates = 25;
      }

      const response = await fetch("/api/admin/bulk-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      
      const data: SyncResult = await response.json();

      if (data.success) {
        toast.success(`🎉 Added ${data.summary?.totalInserted} businesses!`);
        setLastResult(data);
      } else {
        toast.error(data.error || "Sync failed");
      }
    } catch (error) {
      console.error("Bulk sync error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setSyncing(false);
    }
  };

  const estimatedCalls = selectedState === "all" 
    ? 25 * parseInt(citiesPerState) * 2 
    : parseInt(citiesPerState) * 2;

  return (
    <div className="min-h-[calc(100vh-var(--header-height))] py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/admin" className="hover:text-primary">Admin</Link>
            <span>/</span>
            <span>Bulk Sync</span>
          </div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Database className="w-8 h-8 text-green-500" />
            Bulk Data Sync
          </h1>
          <p className="text-muted-foreground">
            Rapidly populate your database with pickleball businesses from Google Places API
          </p>
        </div>

        {/* Configuration Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              Sync Configuration
            </CardTitle>
            <CardDescription>
              Configure how much data to pull from Google Places API
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* State Selection */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Target State</label>
                <Select value={selectedState} onValueChange={setSelectedState}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">🇺🇸 All 25 States</SelectItem>
                    {US_STATES.map((state) => (
                      <SelectItem key={state.code} value={state.code}>
                        {state.name} ({state.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Cities per State</label>
                <Select value={citiesPerState} onValueChange={setCitiesPerState}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2 cities (quick test)</SelectItem>
                    <SelectItem value="5">5 cities (recommended)</SelectItem>
                    <SelectItem value="10">10 cities (thorough)</SelectItem>
                    <SelectItem value="15">15 cities (comprehensive)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Estimates */}
            <div className="p-4 rounded-lg bg-secondary/50">
              <h4 className="font-medium mb-2">Estimated Impact</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">API Calls:</span>
                  <span className="ml-2 font-medium">~{estimatedCalls}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Est. Time:</span>
                  <span className="ml-2 font-medium">~{Math.ceil(estimatedCalls * 0.5 / 60)} min</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Est. Businesses:</span>
                  <span className="ml-2 font-medium">~{estimatedCalls * 10}+</span>
                </div>
              </div>
            </div>

            {/* Sync Button */}
            <Button
              onClick={handleBulkSync}
              disabled={syncing}
              size="lg"
              className="w-full"
            >
              {syncing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Syncing... Please wait
                </>
              ) : (
                <>
                  <Database className="w-4 h-4 mr-2" />
                  Start Bulk Sync
                </>
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              ⚠️ This will make multiple Google API calls. Make sure you have sufficient quota.
            </p>
          </CardContent>
        </Card>

        {/* Results Card */}
        {lastResult && lastResult.success && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                Sync Complete!
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Summary Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
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
                  <div className="text-sm text-muted-foreground">Already Existed</div>
                </div>
                <div className="p-4 rounded-lg bg-secondary/50">
                  <div className="text-2xl font-bold">
                    {lastResult.summary?.statesSynced}
                  </div>
                  <div className="text-sm text-muted-foreground">States Synced</div>
                </div>
                <div className="p-4 rounded-lg bg-secondary/50">
                  <div className="text-2xl font-bold">
                    {lastResult.summary?.apiCallsMade}
                  </div>
                  <div className="text-sm text-muted-foreground">API Calls</div>
                </div>
              </div>

              {/* By State Breakdown */}
              {lastResult.byState && Object.keys(lastResult.byState).length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">Results by State:</h4>
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {Object.entries(lastResult.byState).map(([stateCode, data]) => (
                      <div
                        key={stateCode}
                        className="flex items-center justify-between py-2 px-3 rounded bg-secondary/30"
                      >
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{stateCode}</span>
                          <span className="text-sm text-muted-foreground">
                            ({data.cities.length} cities)
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
                            +{data.inserted}
                          </Badge>
                          {data.skipped > 0 && (
                            <span className="text-sm text-muted-foreground">
                              {data.skipped} skipped
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Tips Card */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">💡 Tips for Growing Your Data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              <strong>1. Start Small:</strong> Test with 1-2 states first to verify everything works.
            </p>
            <p>
              <strong>2. Run Multiple Times:</strong> Google returns different results for different queries. 
              Running sync multiple times can discover more businesses.
            </p>
            <p>
              <strong>3. Focus on Popular States:</strong> California, Texas, Florida, and Arizona have 
              the most pickleball activity.
            </p>
            <p>
              <strong>4. Monitor API Usage:</strong> Each sync uses Google Places API calls. 
              Check your Google Cloud Console for quota limits.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
