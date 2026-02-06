"use client";

/**
 * Blog Settings Page
 * 
 * Configure automation settings and brand voice
 */

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Settings, ChevronLeft, Save, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface BlogSettings {
  autopublish: boolean;
  scheduleFrequency: string;
  writingStyle: string;
  brandVoice: string;
  targetWordCountMin: number;
  targetWordCountMax: number;
  internalLinksMin: number;
  internalLinksMax: number;
  faqCountMin: number;
  faqCountMax: number;
  defaultLanguage: string;
  defaultLocale: string;
  geminiModel: string;
  geminiTemperature: number;
}

const defaultSettings: BlogSettings = {
  autopublish: false,
  scheduleFrequency: "daily",
  writingStyle: "professional",
  brandVoice: "We are experts in water damage restoration, helping property owners across the USA navigate the challenges of water damage, flooding, and mold issues. Our goal is to connect you with trusted restoration professionals who can respond quickly and restore your property efficiently.",
  targetWordCountMin: 1500,
  targetWordCountMax: 2500,
  internalLinksMin: 3,
  internalLinksMax: 7,
  faqCountMin: 3,
  faqCountMax: 6,
  defaultLanguage: "en",
  defaultLocale: "en-US",
  geminiModel: "gemini-3-flash-preview",
  geminiTemperature: 0.7,
};

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const [settings, setSettings] = useState<BlogSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const isAdmin = (session?.user as any)?.role === "admin";

  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/login");
    }
    if (status === "authenticated" && !isAdmin) {
      redirect("/");
    }
    if (status === "authenticated" && isAdmin) {
      fetchSettings();
    }
  }, [status, isAdmin]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/blog/settings");
      
      if (res.ok) {
        const data = await res.json();
        setSettings({ ...defaultSettings, ...data.settings });
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = <K extends keyof BlogSettings>(key: K, value: BlogSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      const res = await fetch("/api/blog/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        toast.success("Settings saved!");
        setHasChanges(false);
      } else {
        toast.error("Failed to save settings");
      }
    } catch (error) {
      toast.error("Error saving settings");
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-48 mb-8" />
        <div className="space-y-6">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/blog">
          <Button variant="ghost" size="icon">
            <ChevronLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="w-6 h-6 text-gray-600" />
            Blog Settings
          </h1>
        </div>
        <Button onClick={saveSettings} disabled={saving || !hasChanges}>
          {saving ? (
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Save Changes
        </Button>
      </div>

      {hasChanges && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600" />
          <span className="text-sm">You have unsaved changes</span>
        </div>
      )}

      <div className="space-y-8">
        {/* Automation Settings */}
        <section className="p-6 bg-card rounded-xl border border-border">
          <h2 className="text-lg font-semibold mb-4">Automation</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium">Auto-publish</label>
                <p className="text-sm text-muted-foreground">
                  Automatically publish posts after generation
                </p>
              </div>
              <Checkbox
                checked={settings.autopublish}
                onCheckedChange={(checked) => updateSetting("autopublish", !!checked)}
              />
            </div>

            <div>
              <label className="font-medium">Schedule Frequency</label>
              <p className="text-sm text-muted-foreground mb-2">
                How often to generate new content
              </p>
              <Select
                value={settings.scheduleFrequency}
                onValueChange={(v) => updateSetting("scheduleFrequency", v)}
              >
                <SelectTrigger className="w-full max-w-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">Every hour</SelectItem>
                  <SelectItem value="twice_daily">Twice daily</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="manual">Manual only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {/* Writing Style */}
        <section className="p-6 bg-card rounded-xl border border-border">
          <h2 className="text-lg font-semibold mb-4">Writing Style</h2>
          
          <div className="space-y-4">
            <div>
              <label className="font-medium">Tone</label>
              <Select
                value={settings.writingStyle}
                onValueChange={(v) => updateSetting("writingStyle", v)}
              >
                <SelectTrigger className="w-full max-w-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="conversational">Conversational</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="educational">Educational</SelectItem>
                  <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="font-medium">Brand Voice</label>
              <p className="text-sm text-muted-foreground mb-2">
                Describe your brand's personality and voice for the AI
              </p>
              <Textarea
                value={settings.brandVoice}
                onChange={(e) => updateSetting("brandVoice", e.target.value)}
                rows={4}
                placeholder="E.g., We are friendly experts who make complex topics easy to understand..."
              />
            </div>
          </div>
        </section>

        {/* Content Parameters */}
        <section className="p-6 bg-card rounded-xl border border-border">
          <h2 className="text-lg font-semibold mb-4">Content Parameters</h2>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="font-medium">Target Word Count (Min)</label>
              <Input
                type="number"
                value={settings.targetWordCountMin}
                onChange={(e) => updateSetting("targetWordCountMin", parseInt(e.target.value) || 1000)}
                min={500}
                max={5000}
              />
            </div>
            <div>
              <label className="font-medium">Target Word Count (Max)</label>
              <Input
                type="number"
                value={settings.targetWordCountMax}
                onChange={(e) => updateSetting("targetWordCountMax", parseInt(e.target.value) || 2500)}
                min={500}
                max={5000}
              />
            </div>
            <div>
              <label className="font-medium">Internal Links (Min)</label>
              <Input
                type="number"
                value={settings.internalLinksMin}
                onChange={(e) => updateSetting("internalLinksMin", parseInt(e.target.value) || 3)}
                min={0}
                max={10}
              />
            </div>
            <div>
              <label className="font-medium">Internal Links (Max)</label>
              <Input
                type="number"
                value={settings.internalLinksMax}
                onChange={(e) => updateSetting("internalLinksMax", parseInt(e.target.value) || 7)}
                min={0}
                max={20}
              />
            </div>
            <div>
              <label className="font-medium">FAQs (Min)</label>
              <Input
                type="number"
                value={settings.faqCountMin}
                onChange={(e) => updateSetting("faqCountMin", parseInt(e.target.value) || 3)}
                min={0}
                max={10}
              />
            </div>
            <div>
              <label className="font-medium">FAQs (Max)</label>
              <Input
                type="number"
                value={settings.faqCountMax}
                onChange={(e) => updateSetting("faqCountMax", parseInt(e.target.value) || 6)}
                min={0}
                max={15}
              />
            </div>
          </div>
        </section>

        {/* Gemini Settings */}
        <section className="p-6 bg-card rounded-xl border border-border">
          <h2 className="text-lg font-semibold mb-4">AI Model Settings</h2>
          
          <div className="space-y-4">
            <div>
              <label className="font-medium">Gemini Model</label>
              <Select
                value={settings.geminiModel}
                onValueChange={(v) => updateSetting("geminiModel", v)}
              >
                <SelectTrigger className="w-full max-w-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gemini-3-flash-preview">Gemini 3 Flash Preview (Newest)</SelectItem>
                  <SelectItem value="gemini-2.0-flash">Gemini 2.0 Flash (Fast & Modern)</SelectItem>
                  <SelectItem value="gemini-1.5-pro">Gemini 1.5 Pro (High Quality)</SelectItem>
                  <SelectItem value="gemini-1.5-flash">Gemini 1.5 Flash</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="font-medium">Temperature ({settings.geminiTemperature})</label>
              <p className="text-sm text-muted-foreground mb-2">
                Higher = more creative, Lower = more focused
              </p>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={settings.geminiTemperature}
                onChange={(e) => updateSetting("geminiTemperature", parseFloat(e.target.value))}
                className="w-full max-w-xs"
              />
            </div>
          </div>
        </section>

        {/* Language Settings */}
        <section className="p-6 bg-card rounded-xl border border-border">
          <h2 className="text-lg font-semibold mb-4">Language</h2>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="font-medium">Default Language</label>
              <Select
                value={settings.defaultLanguage}
                onValueChange={(v) => updateSetting("defaultLanguage", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="font-medium">Default Locale</label>
              <Select
                value={settings.defaultLocale}
                onValueChange={(v) => updateSetting("defaultLocale", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en-US">English (US)</SelectItem>
                  <SelectItem value="en-GB">English (UK)</SelectItem>
                  <SelectItem value="en-CA">English (Canada)</SelectItem>
                  <SelectItem value="es-ES">Spanish (Spain)</SelectItem>
                  <SelectItem value="es-MX">Spanish (Mexico)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
