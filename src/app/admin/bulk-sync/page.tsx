"use client";

import { useState, useEffect, useRef } from "react";
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
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2, MapPin, Database, CheckCircle2, Zap, RefreshCw, Clock, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import { MAJOR_CITIES, TOP_25_STATES } from "@/lib/location-data";


interface SyncResult {
  success: boolean;
  jobId?: string;
  summary?: {
    totalInserted: number;
    totalSkipped: number;
    statesSynced: number;
    apiCallsMade: number;
  };
  byState?: Record<string, { inserted: number; skipped: number; cities: string[] }>;
  error?: string;
}

interface SyncStatus {
  currentJob: {
    id: string;
    status: string;
    totalCities: number;
    completedCities: number;
    totalBusinessesInserted: number;
    totalBusinessesSkipped: number;
    totalApiCalls: number;
    startedAt: Date | null;
    completedAt: Date | null;
    errorMessage: string | null;
  } | null;
  progress: {
    percentage: number;
    completedCities: number;
    totalCities: number;
    inserted: number;
    skipped: number;
    apiCalls: number;
  };
  stats: {
    totalBusinesses: number;
    byState: Array<{ state: string; count: number }>;
    byCategory: Array<{ categoryName: string; count: number }>;
  };
  history: Array<{
    id: string;
    status: string;
    totalBusinessesInserted: number;
    startedAt: Date | null;
    completedAt: Date | null;
  }>;
}

export default function BulkSyncPage() {
  const [syncing, setSyncing] = useState(false);
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [citiesPerState, setCitiesPerState] = useState<string>("6");
  const [queriesPerCity, setQueriesPerCity] = useState<string>("3");
  const [lastResult, setLastResult] = useState<SyncResult | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [showStates, setShowStates] = useState(true);
  const [showCities, setShowCities] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Get cities for selected states
  const availableCities = selectedStates.length > 0
    ? MAJOR_CITIES.filter(city => selectedStates.includes(city.stateCode))
        .sort((a, b) => b.population - a.population)
    : [];

  // Group cities by state
  const citiesByState = availableCities.reduce((acc, city) => {
    if (!acc[city.stateCode]) {
      acc[city.stateCode] = [];
    }
    acc[city.stateCode].push(city);
    return acc;
  }, {} as Record<string, typeof MAJOR_CITIES>);

  // Poll for sync status when a job is running
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch("/api/admin/sync-status");
        const data: SyncStatus = await response.json();
        setSyncStatus(data);

        // Stop polling if job is completed or failed
        if (data.currentJob && (data.currentJob.status === "completed" || data.currentJob.status === "failed")) {
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          setSyncing(false);
          setCurrentJobId(null);
          
          if (data.currentJob.status === "completed") {
            toast.success(`Sync completed! Added ${data.currentJob.totalBusinessesInserted} businesses.`);
          } else {
            toast.error(`Sync failed: ${data.currentJob.errorMessage || "Unknown error"}`);
          }
        }
      } catch (error) {
        console.error("Error fetching sync status:", error);
      }
    };

    if (currentJobId || syncing) {
      fetchStatus(); // Initial fetch
      pollingIntervalRef.current = setInterval(fetchStatus, 2000); // Poll every 2 seconds
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [currentJobId, syncing]);

  const handleBulkSync = async () => {
    if (selectedStates.length === 0 && selectedCities.length === 0) {
      toast.error("Please select at least one state or city");
      return;
    }

    setSyncing(true);
    setLastResult(null);
    
    const stateLabel = selectedStates.length > 0 
      ? `${selectedStates.length} state(s)` 
      : selectedCities.length > 0 
        ? `${selectedCities.length} city/cities`
        : "all states";
    toast.info(`Starting bulk sync for ${stateLabel}...`);

    try {
      const body: Record<string, unknown> = {
        queriesPerCity: parseInt(queriesPerCity),
      };
      
      if (selectedCities.length > 0) {
        // If specific cities are selected, use those
        body.selectedCities = selectedCities;
      } else if (selectedStates.length > 0) {
        // If states are selected, use citiesPerState
        body.selectedStates = selectedStates;
        body.citiesPerState = parseInt(citiesPerState);
      } else {
        // Default: all states
        body.maxStates = 25;
        body.citiesPerState = parseInt(citiesPerState);
      }

      const response = await fetch("/api/admin/bulk-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      
      const data: SyncResult = await response.json();

      if (data.success) {
        setCurrentJobId(data.jobId || null);
        toast.info("Sync started! Monitoring progress...");
        // Don't set syncing to false - let polling handle it
      } else {
        toast.error(data.error || "Sync failed");
        setSyncing(false);
      }
    } catch (error) {
      console.error("Bulk sync error:", error);
      toast.error("An unexpected error occurred");
      setSyncing(false);
    }
  };

  const estimatedCalls = selectedCities.length > 0
    ? selectedCities.length * parseInt(queriesPerCity)
    : selectedStates.length > 0
      ? selectedStates.length * parseInt(citiesPerState) * parseInt(queriesPerCity)
      : 25 * parseInt(citiesPerState) * parseInt(queriesPerCity);

  const handleStateToggle = (stateCode: string) => {
    if (selectedStates.includes(stateCode)) {
      setSelectedStates(selectedStates.filter(s => s !== stateCode));
      // Remove cities from deselected state
      setSelectedCities(selectedCities.filter(city => {
        const cityData = MAJOR_CITIES.find(c => c.name === city);
        return cityData?.stateCode !== stateCode;
      }));
    } else {
      setSelectedStates([...selectedStates, stateCode]);
    }
  };

  const handleCityToggle = (cityName: string) => {
    if (selectedCities.includes(cityName)) {
      setSelectedCities(selectedCities.filter(c => c !== cityName));
    } else {
      setSelectedCities([...selectedCities, cityName]);
    }
  };

  const handleSelectAllStates = () => {
    if (selectedStates.length === TOP_25_STATES.length) {
      setSelectedStates([]);
      setSelectedCities([]);
    } else {
      setSelectedStates(TOP_25_STATES.map(s => s.code));
    }
  };

  const handleSelectAllCities = () => {
    if (selectedCities.length === availableCities.length) {
      setSelectedCities([]);
    } else {
      setSelectedCities(availableCities.map(c => c.name));
    }
  };

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
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Select States</label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAllStates}
                  className="h-7 text-xs"
                >
                  {selectedStates.length === TOP_25_STATES.length ? "Deselect All" : "Select All"}
                </Button>
              </div>
              <div className="max-h-64 overflow-y-auto border rounded-lg p-3 space-y-2">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {TOP_25_STATES.map((state) => (
                    <div key={state.code} className="flex items-center space-x-2">
                      <Checkbox
                        id={`state-${state.code}`}
                        checked={selectedStates.includes(state.code)}
                        onCheckedChange={() => handleStateToggle(state.code)}
                      />
                      <label
                        htmlFor={`state-${state.code}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {state.name} ({state.code})
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              {selectedStates.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {selectedStates.length} state(s) selected
                </p>
              )}
            </div>

            {/* City Selection - Show when states are selected */}
            {selectedStates.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Select Specific Cities (Optional)</label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleSelectAllCities}
                      className="h-7 text-xs"
                      disabled={availableCities.length === 0}
                    >
                      {selectedCities.length === availableCities.length ? "Deselect All" : "Select All"}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowCities(!showCities)}
                      className="h-7 text-xs"
                    >
                      {showCities ? (
                        <>
                          <ChevronUp className="w-3 h-3 mr-1" />
                          Hide
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-3 h-3 mr-1" />
                          Show
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                {showCities && (
                  <div className="max-h-64 overflow-y-auto border rounded-lg p-3 space-y-4">
                    {Object.entries(citiesByState).map(([stateCode, cities]) => {
                      const state = TOP_25_STATES.find(s => s.code === stateCode);
                      return (
                        <div key={stateCode} className="space-y-2">
                          <h4 className="text-sm font-semibold text-primary">
                            {state?.name} ({cities.length} cities)
                          </h4>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pl-4">
                            {cities.map((city) => (
                              <div key={city.name} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`city-${city.name}-${stateCode}`}
                                  checked={selectedCities.includes(city.name)}
                                  onCheckedChange={() => handleCityToggle(city.name)}
                                />
                                <label
                                  htmlFor={`city-${city.name}-${stateCode}`}
                                  className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                >
                                  {city.name}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {selectedCities.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {selectedCities.length} city/cities selected. These will override "Cities per State" setting.
                  </p>
                )}
              </div>
            )}

            {/* Configuration Options */}
            <div className="grid sm:grid-cols-2 gap-4 border-t pt-4">
              {selectedCities.length === 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Cities per State</label>
                  <Select value={citiesPerState} onValueChange={setCitiesPerState}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 cities (quick test)</SelectItem>
                      <SelectItem value="6">6 cities (recommended - ~500 calls)</SelectItem>
                      <SelectItem value="10">10 cities (thorough)</SelectItem>
                      <SelectItem value="15">15 cities (comprehensive)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Only used when specific cities are not selected
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Queries per City</label>
                <Select value={queriesPerCity} onValueChange={setQueriesPerCity}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2 queries (faster)</SelectItem>
                    <SelectItem value="3">3 queries (recommended)</SelectItem>
                    <SelectItem value="5">5 queries (comprehensive)</SelectItem>
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

            {/* Progress Display */}
            {syncing && syncStatus?.currentJob && (
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Sync Progress</span>
                  <span className="text-sm text-muted-foreground">
                    {syncStatus.progress.completedCities} / {syncStatus.progress.totalCities} cities
                  </span>
                </div>
                <Progress value={syncStatus.progress.percentage} className="mb-3" />
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Inserted:</span>
                    <span className="ml-2 font-medium text-green-500">
                      +{syncStatus.progress.inserted}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Skipped:</span>
                    <span className="ml-2 font-medium">{syncStatus.progress.skipped}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">API Calls:</span>
                    <span className="ml-2 font-medium">{syncStatus.progress.apiCalls}</span>
                  </div>
                </div>
              </div>
            )}

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

        {/* Current Stats Card */}
        {syncStatus && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-blue-500" />
                Current Database Stats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <div className="text-2xl font-bold text-primary">
                    {syncStatus.stats.totalBusinesses.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Businesses</div>
                </div>
                <div className="p-4 rounded-lg bg-secondary/50">
                  <div className="text-2xl font-bold">
                    {syncStatus.stats.byState.length}
                  </div>
                  <div className="text-sm text-muted-foreground">States Covered</div>
                </div>
                <div className="p-4 rounded-lg bg-secondary/50">
                  <div className="text-2xl font-bold">
                    {syncStatus.stats.byCategory.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Categories</div>
                </div>
                <div className="p-4 rounded-lg bg-secondary/50">
                  <div className="text-2xl font-bold">
                    {syncStatus.history.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Sync Jobs</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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

        {/* Sync History */}
        {syncStatus && syncStatus.history.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">📜 Recent Sync History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {syncStatus.history.slice(0, 5).map((job) => (
                  <div
                    key={job.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/30"
                  >
                    <div className="flex items-center gap-3">
                      {job.status === "completed" ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : job.status === "failed" ? (
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      ) : (
                        <Clock className="w-4 h-4 text-blue-500" />
                      )}
                      <div>
                        <div className="font-medium">
                          {job.status === "completed" ? "Completed" : job.status === "failed" ? "Failed" : "Running"}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {job.startedAt && new Date(job.startedAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    {job.status === "completed" && (
                      <Badge variant="outline" className="bg-green-500/10 text-green-500">
                        +{job.totalBusinessesInserted} businesses
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
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
              <strong>2. Use CLI for Large Syncs:</strong> For syncing thousands of businesses, use the CLI script 
              (<code className="bg-secondary px-1 rounded">npx tsx scripts/bulk-sync.ts</code>) which is faster.
            </p>
            <p>
              <strong>3. Focus on Popular States:</strong> California, Texas, Florida, and Arizona have 
              the most pickleball activity.
            </p>
            <p>
              <strong>4. Monitor API Usage:</strong> Each sync uses Google Places API calls (~$0.017 per call). 
              Check your Google Cloud Console for quota limits.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
