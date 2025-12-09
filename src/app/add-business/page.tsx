"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Building2,
  MapPin,
  Phone,
  Globe,
  Mail,
  Clock,
  Tag,
  FileText,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  Info,
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

const categories = [
  { value: "restaurants-cafes", label: "Restaurants & Cafes" },
  { value: "grocery-specialty-food", label: "Grocery & Specialty Food" },
  { value: "clothing-accessories", label: "Clothing & Accessories" },
  { value: "home-goods-furniture", label: "Home Goods & Furniture" },
  { value: "electronics-tech", label: "Electronics & Tech" },
  { value: "medical-dental", label: "Medical & Dental" },
  { value: "fitness-gyms", label: "Fitness & Gyms" },
  { value: "spas-beauty", label: "Spas & Beauty" },
  { value: "automotive", label: "Automotive Services" },
  { value: "home-improvement", label: "Home Improvement" },
  { value: "legal-financial", label: "Legal & Financial" },
  { value: "real-estate", label: "Real Estate" },
  { value: "pet-care", label: "Pet Care" },
  { value: "schools-tutoring", label: "Schools & Tutoring" },
  { value: "childcare-daycares", label: "Childcare & Daycares" },
  { value: "arts-culture-events", label: "Arts, Culture & Events" },
  { value: "parks-recreation", label: "Parks & Recreation" },
  { value: "nightlife-bars", label: "Nightlife & Bars" },
  { value: "hotels-accommodations", label: "Hotels & Accommodations" },
  { value: "transportation", label: "Transportation" },
  { value: "it-tech-services", label: "IT & Tech Services" },
  { value: "photography-video", label: "Photography & Video" },
  { value: "event-wedding-services", label: "Event & Wedding Services" },
];

const neighborhoods = [
  { value: "Legacy West", label: "Legacy West" },
  { value: "Downtown Plano", label: "Downtown Plano" },
  { value: "West Plano", label: "West Plano" },
  { value: "East Plano", label: "East Plano" },
  { value: "Plano", label: "Plano (Central)" },
];

export default function AddBusinessPage() {
  const { data: session, status } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    address: "",
    city: "Plano",
    state: "TX",
    zip: "",
    phone: "",
    website: "",
    email: "",
    category: "",
    neighborhood: "",
    priceLevel: "",
  });

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    redirect("/login?callbackUrl=/add-business");
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.address || !formData.category) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/businesses/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitted(true);
        toast.success("Business submitted for review!");
      } else {
        toast.error(data.error || "Failed to submit business");
      }
    } catch (error) {
      toast.error("Failed to submit business");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card rounded-xl p-8 text-center"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Business Submitted!</h1>
            <p className="text-muted-foreground mb-6">
              Thank you for submitting your business. Our team will review it
              within 24-48 hours. You&apos;ll receive an email notification once
              it&apos;s approved.
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" asChild>
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
              <Button asChild>
                <Link href="/">Browse Directory</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link
            href="/"
            className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Directory
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl gradient-accent flex items-center justify-center">
              <Building2 className="w-7 h-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Add Your Business</h1>
              <p className="text-muted-foreground">
                Submit your business to Henry Harrison Plano Texas
              </p>
            </div>
          </div>
        </motion.div>

        {/* Info Alert */}
        <Alert className="mb-6 bg-blue-500/10 border-blue-500/30">
          <Info className="h-4 w-4 text-blue-500" />
          <AlertDescription className="text-blue-400">
            All business submissions are reviewed by our admin team before being
            published. This typically takes 24-48 hours.
          </AlertDescription>
        </Alert>

        {/* Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleSubmit}
          className="glass-card rounded-xl p-6 space-y-6"
        >
          {/* Basic Info */}
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Basic Information
            </h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Business Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Joe's Pizza"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Tell customers about your business..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category: value })
                    }
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="priceLevel">Price Level</Label>
                  <Select
                    value={formData.priceLevel}
                    onValueChange={(value) =>
                      setFormData({ ...formData, priceLevel: value })
                    }
                  >
                    <SelectTrigger id="priceLevel">
                      <SelectValue placeholder="Select price" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">$ - Budget</SelectItem>
                      <SelectItem value="2">$$ - Moderate</SelectItem>
                      <SelectItem value="3">$$$ - Upscale</SelectItem>
                      <SelectItem value="4">$$$$ - Fine Dining</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* Location */}
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Location
            </h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="address">Street Address *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  placeholder="123 Main St"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                    disabled
                  />
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) =>
                      setFormData({ ...formData, state: e.target.value })
                    }
                    disabled
                  />
                </div>
                <div>
                  <Label htmlFor="zip">ZIP Code</Label>
                  <Input
                    id="zip"
                    value={formData.zip}
                    onChange={(e) =>
                      setFormData({ ...formData, zip: e.target.value })
                    }
                    placeholder="75024"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="neighborhood">Neighborhood</Label>
                <Select
                  value={formData.neighborhood}
                  onValueChange={(value) =>
                    setFormData({ ...formData, neighborhood: value })
                  }
                >
                  <SelectTrigger id="neighborhood">
                    <SelectValue placeholder="Select neighborhood" />
                  </SelectTrigger>
                  <SelectContent>
                    {neighborhoods.map((n) => (
                      <SelectItem key={n.value} value={n.value}>
                        {n.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Phone className="w-5 h-5 text-primary" />
              Contact Information
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="contact@business.com"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) =>
                    setFormData({ ...formData, website: e.target.value })
                  }
                  placeholder="https://www.example.com"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-4 border-t border-border">
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Building2 className="w-4 h-4 mr-2" />
                  Submit Business for Review
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-3">
              By submitting, you agree to our Terms of Service and confirm the
              information is accurate.
            </p>
          </div>
        </motion.form>
      </div>
    </div>
  );
}

