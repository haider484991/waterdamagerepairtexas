"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import type { Metadata } from "next";
import {
  Megaphone,
  Check,
  Star,
  TrendingUp,
  Eye,
  Zap,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const pricingTiers = [
  {
    name: "Basic Listing",
    price: "Free",
    description: "Perfect for getting started",
    features: [
      "Business listing in directory",
      "Basic business information",
      "Appear in search results",
      "Category placement",
      "Customer reviews",
    ],
    popular: false,
  },
  {
    name: "Featured Listing",
    price: "$49",
    period: "/month",
    description: "Increase your visibility",
    features: [
      "Everything in Basic",
      "Featured badge on listing",
      "Priority placement in search",
      "Top of category pages",
      "Enhanced business profile",
      "Analytics dashboard",
    ],
    popular: true,
  },
  {
    name: "Premium Placement",
    price: "$99",
    period: "/month",
    description: "Maximum exposure",
    features: [
      "Everything in Featured",
      "Homepage spotlight",
      "Neighborhood page features",
      "Premium badge",
      "Priority support",
      "Advanced analytics",
      "Custom promotion campaigns",
    ],
    popular: false,
  },
];

const benefits = [
  {
    icon: Eye,
    title: "Increased Visibility",
    description: "Get your business in front of thousands of local customers actively searching for services.",
  },
  {
    icon: TrendingUp,
    title: "Higher Rankings",
    description: "Featured and premium listings appear at the top of search results and category pages.",
  },
  {
    icon: Star,
    title: "Build Trust",
    description: "Verified badges and premium placement help establish credibility with potential customers.",
  },
  {
    icon: Zap,
    title: "More Leads",
    description: "Stand out from competitors and attract more customers to your business.",
  },
];

const testimonials = [
  {
    name: "Sarah Johnson",
    business: "Plano Coffee House",
    quote: "Since upgrading to Featured Listing, we've seen a 40% increase in new customers finding us online.",
    rating: 5,
  },
  {
    name: "Mike Chen",
    business: "Chen's Auto Repair",
    quote: "The premium placement has been worth every penny. We're getting quality leads consistently.",
    rating: 5,
  },
  {
    name: "Emily Rodriguez",
    business: "Rodriguez Home Services",
    quote: "The analytics dashboard helps us understand our customers better. Great investment!",
    rating: 5,
  },
];

export default function AdvertisePage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [business, setBusiness] = useState("");
  const [phone, setPhone] = useState("");
  const [packageType, setPackageType] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) return;

    setIsSubmitting(true);
    setStatus("idle");

    try {
      const res = await fetch("/api/advertise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          business,
          phone,
          packageType,
          message,
        }),
      });

      if (!res.ok) {
        throw new Error("Request failed");
      }

      setStatus("success");
      setName("");
      setEmail("");
      setBusiness("");
      setPhone("");
      setPackageType("");
      setMessage("");
    } catch (error) {
      console.error("Advertise submit failed", error);
      setStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute top-10 left-10 w-72 h-72 bg-primary/10 blur-3xl rounded-full" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-primary/5 blur-3xl rounded-full" />

        <section className="container mx-auto px-4 py-16 lg:py-24 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto space-y-6"
          >
            <Badge variant="secondary" className="text-sm">
              <Megaphone className="w-3 h-3 mr-1" />
              Advertising Opportunities
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight text-foreground">
              Grow Your Business with Targeted Advertising
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Reach thousands of local customers actively searching for businesses like yours.
              Choose from flexible advertising packages designed to boost your visibility and drive more leads.
            </p>
          </motion.div>
        </section>
      </div>

      {/* Pricing Tiers */}
      <section className="container mx-auto px-4 pb-12 lg:pb-16">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-2xl md:text-3xl font-semibold text-foreground">
            Choose Your Advertising Package
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Select the plan that best fits your business needs. All packages include our core listing features.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3 max-w-6xl mx-auto">
          {pricingTiers.map((tier, index) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="relative"
            >
              <Card
                className={`h-full border-border/60 bg-card/80 backdrop-blur ${
                  tier.popular ? "border-primary/50 ring-2 ring-primary/20" : ""
                }`}
              >
                {tier.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                    Most Popular
                  </Badge>
                )}
                <CardContent className="p-8">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-semibold text-foreground mb-2">{tier.name}</h3>
                      <p className="text-sm text-muted-foreground mb-4">{tier.description}</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-foreground">{tier.price}</span>
                        {tier.period && (
                          <span className="text-muted-foreground">{tier.period}</span>
                        )}
                      </div>
                    </div>

                    <Separator />

                    <ul className="space-y-3">
                      {tier.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2">
                          <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                          <span className="text-sm text-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      asChild
                      className={`w-full ${tier.popular ? "btn-primary" : ""}`}
                      variant={tier.popular ? "default" : "outline"}
                    >
                      <Link href="#contact-form">
                        {tier.price === "Free" ? "Get Started" : "Choose Plan"}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="container mx-auto px-4 pb-12 lg:pb-16">
        <Card className="border-border/60 bg-card/80 backdrop-blur">
          <CardContent className="p-8 lg:p-10 space-y-8">
            <div className="text-center space-y-4">
              <h2 className="text-2xl md:text-3xl font-semibold text-foreground">
                Why Advertise with Us?
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Join hundreds of Plano businesses that trust us to help them grow.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {benefits.map((benefit, index) => {
                const Icon = benefit.icon;
                return (
                  <motion.div
                    key={benefit.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="flex flex-col gap-3 text-center"
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground">{benefit.title}</h3>
                    <p className="text-sm text-muted-foreground">{benefit.description}</p>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Testimonials */}
      <section className="container mx-auto px-4 pb-12 lg:pb-16">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-2xl md:text-3xl font-semibold text-foreground">
            Success Stories
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            See what other businesses are saying about advertising with us.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="border-border/60 bg-card/80 backdrop-blur h-full">
                <CardContent className="p-6">
                  <div className="flex items-center gap-1 mb-3">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-500 text-amber-500" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mb-4 italic">
                    &quot;{testimonial.quote}&quot;
                  </p>
                  <div>
                    <p className="font-semibold text-foreground">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.business}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Contact Form */}
      <section id="contact-form" className="container mx-auto px-4 pb-16 lg:pb-24">
        <Card className="border-border/60 bg-card/80 backdrop-blur">
          <CardContent className="p-8 lg:p-10 space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl md:text-3xl font-semibold text-foreground">
                Get Started Today
              </h2>
              <p className="text-muted-foreground">
                Fill out the form below and we'll get back to you within 24 hours to discuss your advertising needs.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl mx-auto">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="business">Business Name</Label>
                  <Input
                    id="business"
                    value={business}
                    onChange={(e) => setBusiness(e.target.value)}
                    placeholder="Your business name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="package">Interested Package</Label>
                <select
                  id="package"
                  value={packageType}
                  onChange={(e) => setPackageType(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Select a package</option>
                  <option value="basic">Basic Listing (Free)</option>
                  <option value="featured">Featured Listing ($49/month)</option>
                  <option value="premium">Premium Placement ($99/month)</option>
                  <option value="custom">Custom Package</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message *</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us about your advertising goals..."
                  rows={6}
                  required
                />
              </div>

              <div className="flex items-center justify-between gap-3 flex-wrap">
                <Button type="submit" className="btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? "Sending..." : "Send Inquiry"}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <p className="text-sm text-muted-foreground">
                  We'll respond within 24 hours.
                </p>
              </div>
            </form>

            <Separator />

            {status === "success" && (
              <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800 max-w-2xl mx-auto">
                Thanks! Your inquiry was sent. We'll get back to you within 24 hours.
              </div>
            )}
            {status === "error" && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800 max-w-2xl mx-auto">
                Sorry, we couldn't send your inquiry. Please try again later.
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
