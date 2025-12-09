"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { motion } from "framer-motion";
import type { Metadata } from "next";
import {
  Building2,
  CheckCircle2,
  Shield,
  BarChart3,
  MessageSquare,
  Star,
  ArrowRight,
  Users,
  TrendingUp,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const benefits = [
  {
    icon: Shield,
    title: "Verify Your Business",
    description: "Establish credibility and trust with verified business information that customers can rely on.",
  },
  {
    icon: BarChart3,
    title: "Access Analytics",
    description: "Get insights into how customers find and interact with your business listing.",
  },
  {
    icon: MessageSquare,
    title: "Respond to Reviews",
    description: "Engage with customers by responding to reviews and building your online reputation.",
  },
  {
    icon: FileText,
    title: "Update Information",
    description: "Keep your business hours, contact info, and description accurate and up-to-date.",
  },
  {
    icon: Star,
    title: "Featured Placement",
    description: "Increase visibility with featured placement in search results and category pages.",
  },
  {
    icon: TrendingUp,
    title: "Boost Discoverability",
    description: "Improve your search rankings and make it easier for customers to find you.",
  },
];

const steps = [
  {
    number: 1,
    title: "Find Your Business",
    description: "Search for your business in our directory or add it if it's not listed yet.",
  },
  {
    number: 2,
    title: "Verify Ownership",
    description: "Complete a simple verification process to confirm you're authorized to manage the listing.",
  },
  {
    number: 3,
    title: "Claim & Manage",
    description: "Start managing your business profile, responding to reviews, and accessing analytics.",
  },
];

const faqs = [
  {
    question: "How long does the verification process take?",
    answer: "Most verification requests are processed within 24-48 hours. We'll contact you via phone or email to verify your ownership.",
  },
  {
    question: "Is there a cost to claim my business?",
    answer: "No, claiming your business is completely free. You can manage your basic listing at no charge.",
  },
  {
    question: "What information do I need to provide?",
    answer: "You'll need to provide your business role, contact phone number, and email address. We may call to verify your claim.",
  },
  {
    question: "Can I claim multiple businesses?",
    answer: "Yes, if you own or manage multiple businesses, you can claim each one separately through your account.",
  },
  {
    question: "What if my business is already claimed?",
    answer: "If your business is already claimed by someone else, please contact our support team with proof of ownership.",
  },
];

export default function ClaimBusinessPage() {
  const { data: session } = useSession();
  const claimUrl = session ? "/dashboard/claim" : "/login?callbackUrl=/dashboard/claim";

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
              Claim Your Business
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight text-foreground">
              Take Control of Your Business Listing
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Claim your business to verify ownership, update information, respond to reviews,
              and access valuable insights about how customers find you.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Button asChild size="lg" className="btn-primary">
                <Link href={claimUrl}>
                  Claim Your Business
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/search">Search for Your Business</Link>
              </Button>
            </div>
          </motion.div>
        </section>
      </div>

      {/* Benefits Section */}
      <section className="container mx-auto px-4 pb-12 lg:pb-16">
        <Card className="border-border/60 bg-card/80 backdrop-blur">
          <CardContent className="p-8 lg:p-10 space-y-8">
            <div className="text-center space-y-4">
              <h2 className="text-2xl md:text-3xl font-semibold text-foreground">
                Why Claim Your Business?
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Unlock powerful tools to manage your online presence and connect with customers.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {benefits.map((benefit, index) => {
                const Icon = benefit.icon;
                return (
                  <motion.div
                    key={benefit.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="flex flex-col gap-3 p-6 rounded-xl border border-border/60 bg-secondary/30 hover:bg-secondary/50 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-lg text-foreground">{benefit.title}</h3>
                    <p className="text-sm text-muted-foreground">{benefit.description}</p>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Process Steps */}
      <section className="container mx-auto px-4 pb-12 lg:pb-16">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-2xl md:text-3xl font-semibold text-foreground">
            How It Works
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Claiming your business is quick and easy. Follow these simple steps to get started.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3 max-w-4xl mx-auto">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="relative"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold">
                  {step.number}
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg text-foreground">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-8 left-full w-full">
                  <div className="h-0.5 bg-border relative">
                    <ArrowRight className="w-5 h-5 text-muted-foreground absolute right-0 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </section>

      {/* Social Proof */}
      <section className="container mx-auto px-4 pb-12 lg:pb-16">
        <Card className="border-border/60 bg-card/80 backdrop-blur">
          <CardContent className="p-8 lg:p-10">
            <div className="text-center space-y-6">
              <div className="flex items-center justify-center gap-2">
                <Users className="w-6 h-6 text-primary" />
                <h2 className="text-2xl md:text-3xl font-semibold text-foreground">
                  Join Hundreds of Verified Businesses
                </h2>
              </div>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Business owners across Plano trust us to help them manage their online presence
                and connect with local customers.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-6 pt-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-foreground">500+</div>
                  <div className="text-sm text-muted-foreground">Businesses Claimed</div>
                </div>
                <Separator orientation="vertical" className="h-12" />
                <div className="text-center">
                  <div className="text-3xl font-bold text-foreground">24-48hr</div>
                  <div className="text-sm text-muted-foreground">Verification Time</div>
                </div>
                <Separator orientation="vertical" className="h-12" />
                <div className="text-center">
                  <div className="text-3xl font-bold text-foreground">Free</div>
                  <div className="text-sm text-muted-foreground">To Claim</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* FAQs */}
      <section className="container mx-auto px-4 pb-12 lg:pb-16">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-2xl md:text-3xl font-semibold text-foreground">
            Frequently Asked Questions
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Everything you need to know about claiming your business.
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={faq.question}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="border-border/60 bg-card/80 backdrop-blur">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-foreground mb-2">{faq.question}</h3>
                  <p className="text-sm text-muted-foreground">{faq.answer}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 pb-16 lg:pb-24">
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-8 lg:p-12 text-center space-y-6">
            <Building2 className="w-16 h-16 mx-auto text-primary" />
            <h2 className="text-2xl md:text-3xl font-semibold text-foreground">
              Ready to Claim Your Business?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Get started today and take control of your business listing. It's free and takes just a few minutes.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Button asChild size="lg" className="btn-primary">
                <Link href={claimUrl}>
                  Claim Your Business Now
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/contact">Contact Support</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
