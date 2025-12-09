"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) return;

    setIsSubmitting(true);
    setStatus("idle");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message }),
      });

      if (!res.ok) {
        throw new Error("Request failed");
      }

      setStatus("success");
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
    } catch (error) {
      console.error("Contact submit failed", error);
      setStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Last Updated: 12-4-25</p>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">Contact Us</h1>
            <p className="text-muted-foreground leading-relaxed">
              Have a question, need support, or want to feature your business? Use the form below and we’ll
              route your message privately to our team.
            </p>
          </div>

          <Card className="border-border/60 bg-card/80 backdrop-blur">
            <CardContent className="p-6 md:p-8 space-y-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
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

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="How can we help?"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us about your request..."
                    rows={6}
                    required
                  />
                </div>

                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <Button type="submit" className="btn-primary" disabled={isSubmitting}>
                    {isSubmitting ? "Sending..." : "Send Message"}
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    We’ll deliver your message securely to our team.
                  </p>
                </div>
              </form>

              <Separator />

              {status === "success" && (
                <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
                  Thanks! Your message was sent. We’ll get back to you soon.
                </div>
              )}
              {status === "error" && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
                  Sorry, we couldn’t send your message. Please try again later.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

