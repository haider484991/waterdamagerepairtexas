"use client";

import { useState, Suspense, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Building2,
  Search,
  CheckCircle2,
  Phone,
  Mail,
  ArrowRight,
  Loader2,
  MapPin,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface Business {
  id: string;
  name: string;
  slug: string;
  address: string;
  ratingAvg: string | null;
  reviewCount: number | null;
  googlePlaceId: string | null;
  claimedBy: string | null;
}

const steps = [
  { id: 1, title: "Find Your Business", description: "Search for your business" },
  { id: 2, title: "Verify Ownership", description: "Confirm you're authorized" },
  { id: 3, title: "Complete Profile", description: "Add your details" },
];

function ClaimContent() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const preselectedBusinessId = searchParams.get("business");

  const [currentStep, setCurrentStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Business[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    role: "",
    phone: "",
    email: session?.user?.email || "",
    notes: "",
  });

  // If preselected business ID, fetch it
  useEffect(() => {
    if (preselectedBusinessId) {
      fetchBusinessById(preselectedBusinessId);
    }
  }, [preselectedBusinessId]);

  const fetchBusinessById = async (id: string) => {
    try {
      const response = await fetch(`/api/businesses/${id}`);
      const data = await response.json();
      
      if (data.business) {
        setSelectedBusiness({
          id: data.business.id,
          name: data.business.name,
          slug: data.business.slug,
          address: data.business.address,
          ratingAvg: data.business.ratingAvg,
          reviewCount: data.business.reviewCount,
          googlePlaceId: data.business.googlePlaceId,
          claimedBy: data.business.claimedBy,
        });
        setCurrentStep(2);
      }
    } catch (error) {
      console.error("Error fetching business:", error);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    redirect("/login?callbackUrl=/dashboard/claim");
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&limit=10`);
      const data = await response.json();
      
      setSearchResults(
        (data.data || []).map((b: any) => ({
          id: b.id,
          name: b.name,
          slug: b.googlePlaceId || b.slug,
          address: b.address,
          ratingAvg: b.ratingAvg,
          reviewCount: b.reviewCount,
          googlePlaceId: b.googlePlaceId,
          claimedBy: b.claimedBy,
        }))
      );
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Failed to search businesses");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectBusiness = (business: Business) => {
    if (business.claimedBy) {
      toast.error("This business has already been claimed");
      return;
    }
    setSelectedBusiness(business);
    setCurrentStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedBusiness || !formData.role || !formData.phone) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: selectedBusiness.id,
          role: formData.role,
          phone: formData.phone,
          email: formData.email,
          notes: formData.notes,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Claim request submitted! We'll review it within 24-48 hours.");
        setCurrentStep(3);
      } else {
        toast.error(data.error || "Failed to submit claim request");
      }
    } catch (error) {
      toast.error("Failed to submit claim request");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl gradient-accent flex items-center justify-center">
            <Building2 className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Claim Your Business</h1>
          <p className="text-muted-foreground">
            Verify ownership to manage your business listing
          </p>
        </motion.div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  currentStep >= step.id
                    ? "bg-primary border-primary text-primary-foreground"
                    : "border-border text-muted-foreground"
                }`}
              >
                {currentStep > step.id ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <span className="text-sm font-medium">{step.id}</span>
                )}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`w-12 sm:w-24 h-0.5 mx-2 ${
                    currentStep > step.id ? "bg-primary" : "bg-border"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card rounded-xl p-6"
        >
          {/* Step 1: Search for Business */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-2">Find Your Business</h2>
                <p className="text-sm text-muted-foreground">
                  Search for your business by name to claim it
                </p>
              </div>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Enter business name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="pl-10"
                  />
                </div>
                <Button onClick={handleSearch} disabled={isSearching}>
                  {isSearching ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Search"
                  )}
                </Button>
              </div>

              {searchResults.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {searchResults.length} results found
                  </p>
                  {searchResults.map((business) => (
                    <button
                      key={business.id}
                      onClick={() => handleSelectBusiness(business)}
                      disabled={!!business.claimedBy}
                      className={`w-full p-4 rounded-lg border text-left transition-colors ${
                        business.claimedBy
                          ? "border-border/50 opacity-50 cursor-not-allowed"
                          : "border-border hover:border-primary/50 hover:bg-secondary/50"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium">{business.name}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <MapPin className="w-3 h-3" />
                            {business.address}
                          </div>
                          {business.ratingAvg && (
                            <div className="flex items-center gap-1 text-sm mt-1">
                              <Star className="w-3 h-3 fill-blue-500 text-blue-500" />
                              <span>{business.ratingAvg}</span>
                              {business.reviewCount && (
                                <span className="text-muted-foreground">
                                  ({business.reviewCount} reviews)
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        {business.claimedBy ? (
                          <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded">
                            Already Claimed
                          </span>
                        ) : (
                          <ArrowRight className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <div className="pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground mb-3">
                  Can&apos;t find your business?
                </p>
                <Button variant="outline" asChild>
                  <Link href="/search">Search the Directory</Link>
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Verify Ownership */}
          {currentStep === 2 && selectedBusiness && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-2">Verify Ownership</h2>
                <div className="p-3 rounded-lg bg-secondary/50 mt-2">
                  <p className="font-medium">{selectedBusiness.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedBusiness.address}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="role">Your Role *</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) =>
                      setFormData({ ...formData, role: value })
                    }
                  >
                    <SelectTrigger id="role">
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="owner">Owner</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="employee">Authorized Employee</SelectItem>
                      <SelectItem value="marketing">Marketing Representative</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Business Phone *</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="(555) 123-4567"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      className="pl-10"
                      required
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    We may call this number to verify your claim
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Additional Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Any additional information to help verify your claim..."
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setCurrentStep(1);
                    setSelectedBusiness(null);
                  }}
                >
                  Back
                </Button>
                <Button type="submit" className="flex-1" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Claim Request"
                  )}
                </Button>
              </div>
            </form>
          )}

          {/* Step 3: Success */}
          {currentStep === 3 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Claim Request Submitted!</h2>
              <p className="text-muted-foreground mb-6">
                We&apos;ll review your request and get back to you within 24-48 hours.
                You&apos;ll receive an email confirmation shortly.
              </p>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" asChild>
                  <Link href="/dashboard">Go to Dashboard</Link>
                </Button>
                <Button asChild>
                  <Link href="/">Browse Directory</Link>
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default function ClaimBusinessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <ClaimContent />
    </Suspense>
  );
}
