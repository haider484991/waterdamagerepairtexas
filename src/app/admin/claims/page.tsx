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
  User,
  Phone,
  Mail,
  ArrowLeft,
  Loader2,
  AlertTriangle,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface Claim {
  id: string;
  status: string;
  businessRole: string | null;
  phone: string | null;
  notes: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  business: {
    id: string;
    name: string;
    slug: string;
    address: string;
  };
}

export default function AdminClaimsPage() {
  const { data: session, status } = useSession();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const isAdmin = (session?.user as any)?.role === "admin";

  useEffect(() => {
    async function fetchClaims() {
      try {
        const response = await fetch("/api/admin/claims");
        const data = await response.json();
        setClaims(data.claims || []);
      } catch (error) {
        console.error("Error fetching claims:", error);
      } finally {
        setIsLoading(false);
      }
    }

    if (session?.user && isAdmin) {
      fetchClaims();
    } else {
      setIsLoading(false);
    }
  }, [session, isAdmin]);

  const handleApprove = async (claimId: string) => {
    setIsProcessing(true);
    try {
      const response = await fetch(`/api/admin/claims/${claimId}/approve`, {
        method: "POST",
      });

      if (response.ok) {
        setClaims((prev) =>
          prev.map((c) => (c.id === claimId ? { ...c, status: "approved" } : c))
        );
        toast.success("Claim approved successfully");
        setSelectedClaim(null);
      } else {
        toast.error("Failed to approve claim");
      }
    } catch (error) {
      toast.error("Failed to approve claim");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (claimId: string) => {
    setIsProcessing(true);
    try {
      const response = await fetch(`/api/admin/claims/${claimId}/reject`, {
        method: "POST",
      });

      if (response.ok) {
        setClaims((prev) =>
          prev.map((c) => (c.id === claimId ? { ...c, status: "rejected" } : c))
        );
        toast.success("Claim rejected");
        setSelectedClaim(null);
      } else {
        toast.error("Failed to reject claim");
      }
    } catch (error) {
      toast.error("Failed to reject claim");
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
    redirect("/login?callbackUrl=/admin/claims");
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center glass-card rounded-xl p-8 max-w-md">
          <AlertTriangle className="w-16 h-16 text-blue-500 mx-auto mb-4" />
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

  const pendingClaims = claims.filter((c) => c.status === "pending");
  const processedClaims = claims.filter((c) => c.status !== "pending");

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
              <Shield className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Business Claims</h1>
              <p className="text-muted-foreground">
                Review and approve business ownership claims
              </p>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="glass-card rounded-xl p-4 text-center">
            <Clock className="w-6 h-6 text-blue-500 mx-auto mb-2" />
            <div className="text-2xl font-bold">{pendingClaims.length}</div>
            <div className="text-sm text-muted-foreground">Pending</div>
          </div>
          <div className="glass-card rounded-xl p-4 text-center">
            <CheckCircle2 className="w-6 h-6 text-green-500 mx-auto mb-2" />
            <div className="text-2xl font-bold">
              {claims.filter((c) => c.status === "approved").length}
            </div>
            <div className="text-sm text-muted-foreground">Approved</div>
          </div>
          <div className="glass-card rounded-xl p-4 text-center">
            <XCircle className="w-6 h-6 text-red-500 mx-auto mb-2" />
            <div className="text-2xl font-bold">
              {claims.filter((c) => c.status === "rejected").length}
            </div>
            <div className="text-sm text-muted-foreground">Rejected</div>
          </div>
        </div>

        {/* Pending Claims */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Pending Claims</h2>
          {pendingClaims.length > 0 ? (
            <div className="space-y-4">
              {pendingClaims.map((claim) => (
                <motion.div
                  key={claim.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card rounded-xl p-5"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">{claim.business.name}</h3>
                        <Badge
                          variant="outline"
                          className="bg-blue-500/20 text-blue-500 border-blue-500/30"
                        >
                          Pending
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {claim.business.address}
                      </p>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {claim.user.name}
                        </span>
                        <Link
                          href="/contact"
                          className="flex items-center gap-1 text-primary hover:underline"
                        >
                          <Mail className="w-4 h-4" />
                          Contact via Contact Page
                        </Link>
                        {claim.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-4 h-4" />
                            {claim.phone}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Role: {claim.businessRole || "Not specified"} •
                        Submitted: {new Date(claim.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedClaim(claim)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Review
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleApprove(claim.id)}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleReject(claim.id)}
                      >
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="glass-card rounded-xl p-8 text-center">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">All caught up!</h3>
              <p className="text-muted-foreground">
                No pending claims to review.
              </p>
            </div>
          )}
        </div>

        {/* Processed Claims */}
        {processedClaims.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
            <div className="space-y-3">
              {processedClaims.slice(0, 10).map((claim) => (
                <div
                  key={claim.id}
                  className="glass-card rounded-lg p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        claim.status === "approved"
                          ? "bg-green-500/20"
                          : "bg-red-500/20"
                      }`}
                    >
                      {claim.status === "approved" ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{claim.business.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {claim.user.name} • {claim.status}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(claim.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Review Dialog */}
        <Dialog open={!!selectedClaim} onOpenChange={() => setSelectedClaim(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Review Claim</DialogTitle>
              <DialogDescription>
                Review the claim details before approving or rejecting.
              </DialogDescription>
            </DialogHeader>
            {selectedClaim && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Business</h4>
                  <p className="font-semibold">{selectedClaim.business.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedClaim.business.address}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Claimant</h4>
                  <p>{selectedClaim.user.name}</p>
                  <Link
                    href="/contact"
                    className="text-sm text-primary hover:underline"
                  >
                    Contact via Contact Page
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Role</h4>
                    <p>{selectedClaim.businessRole || "Not specified"}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Phone</h4>
                    <p>{selectedClaim.phone || "Not provided"}</p>
                  </div>
                </div>
                {selectedClaim.notes && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Notes</h4>
                    <p className="text-sm">{selectedClaim.notes}</p>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setSelectedClaim(null)}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => selectedClaim && handleReject(selectedClaim.id)}
                disabled={isProcessing}
              >
                Reject
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={() => selectedClaim && handleApprove(selectedClaim.id)}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Approve"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

