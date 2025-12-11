"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Shield,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  ArrowLeft,
  Loader2,
  AlertTriangle,
  Eye,
  MapPin,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface Business {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  address: string;
  city: string;
  state: string;
  phone: string | null;
  website: string | null;
  email: string | null;
  neighborhood: string | null;
  priceLevel: number | null;
  isVerified: boolean | null;
  createdAt: string;
  category: {
    name: string;
    slug: string;
  } | null;
}

export default function AdminBusinessesPage() {
  const { data: session, status } = useSession();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const isAdmin =
    session?.user?.email === "admin@uspickleballdirectory.com" ||
    session?.user?.email?.endsWith("@admin.com") ||
    session?.user?.email === "admin@test.com";

  useEffect(() => {
    async function fetchBusinesses() {
      try {
        const response = await fetch("/api/admin/businesses/pending");
        const data = await response.json();
        setBusinesses(data.businesses || []);
      } catch (error) {
        console.error("Error fetching businesses:", error);
      } finally {
        setIsLoading(false);
      }
    }

    if (session?.user && isAdmin) {
      fetchBusinesses();
    } else {
      setIsLoading(false);
    }
  }, [session, isAdmin]);

  const handleApprove = async (businessId: string) => {
    setIsProcessing(true);
    try {
      const response = await fetch(`/api/admin/businesses/${businessId}/approve`, {
        method: "POST",
      });

      if (response.ok) {
        setBusinesses((prev) => prev.filter((b) => b.id !== businessId));
        toast.success("Business approved and published!");
        setSelectedBusiness(null);
      } else {
        toast.error("Failed to approve business");
      }
    } catch (error) {
      toast.error("Failed to approve business");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (businessId: string) => {
    setIsProcessing(true);
    try {
      const response = await fetch(`/api/admin/businesses/${businessId}/reject`, {
        method: "POST",
      });

      if (response.ok) {
        setBusinesses((prev) => prev.filter((b) => b.id !== businessId));
        toast.success("Business rejected");
        setSelectedBusiness(null);
      } else {
        toast.error("Failed to reject business");
      }
    } catch (error) {
      toast.error("Failed to reject business");
    } finally {
      setIsProcessing(false);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    redirect("/login?callbackUrl=/admin/businesses");
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center glass-card rounded-xl p-8 max-w-md">
          <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-4">
            You don&apos;t have permission to access this page.
          </p>
          <Button asChild>
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link
            href="/admin"
            className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Admin
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Business Submissions</h1>
              <p className="text-muted-foreground">
                Review and approve new business listings
              </p>
            </div>
          </div>
        </motion.div>

        {/* Pending Businesses */}
        {businesses.length > 0 ? (
          <div className="space-y-4">
            {businesses.map((business) => (
              <motion.div
                key={business.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card rounded-xl p-5"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{business.name}</h3>
                      <Badge
                        variant="outline"
                        className="bg-amber-500/20 text-amber-500 border-amber-500/30"
                      >
                        <Clock className="w-3 h-3 mr-1" />
                        Pending Review
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {business.address}, {business.city}, {business.state}
                      </span>
                      {business.category && (
                        <span className="flex items-center gap-1">
                          <Tag className="w-4 h-4" />
                          {business.category.name}
                        </span>
                      )}
                    </div>
                    {business.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {business.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Submitted: {new Date(business.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedBusiness(business)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Review
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => handleApprove(business.id)}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleReject(business.id)}
                    >
                      <XCircle className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="glass-card rounded-xl p-12 text-center">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">All caught up!</h3>
            <p className="text-muted-foreground">
              No pending business submissions to review.
            </p>
          </div>
        )}

        {/* Review Dialog */}
        <Dialog open={!!selectedBusiness} onOpenChange={() => setSelectedBusiness(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Review Business</DialogTitle>
              <DialogDescription>
                Review the business details before approving or rejecting.
              </DialogDescription>
            </DialogHeader>
            {selectedBusiness && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Name</h4>
                  <p className="font-semibold">{selectedBusiness.name}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Category</h4>
                  <p>{selectedBusiness.category?.name || "Not specified"}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Address</h4>
                  <p>
                    {selectedBusiness.address}, {selectedBusiness.city},{" "}
                    {selectedBusiness.state}
                  </p>
                </div>
                {selectedBusiness.description && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Description</h4>
                    <p className="text-sm">{selectedBusiness.description}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  {selectedBusiness.phone && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Phone</h4>
                      <p>{selectedBusiness.phone}</p>
                    </div>
                  )}
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Contact</h4>
                    <Link
                      href="/contact"
                      className="text-primary hover:underline"
                    >
                      Contact via Contact Page
                    </Link>
                  </div>
                  {selectedBusiness.website && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Website</h4>
                      <a
                        href={selectedBusiness.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {selectedBusiness.website}
                      </a>
                    </div>
                  )}
                  {selectedBusiness.neighborhood && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">
                        Neighborhood
                      </h4>
                      <p>{selectedBusiness.neighborhood}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setSelectedBusiness(null)}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => selectedBusiness && handleReject(selectedBusiness.id)}
                disabled={isProcessing}
              >
                Reject
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={() => selectedBusiness && handleApprove(selectedBusiness.id)}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Approve & Publish"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

