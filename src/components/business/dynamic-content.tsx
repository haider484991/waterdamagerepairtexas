"use client";

import { useState, useEffect } from "react";
// Collapsible component for expandable sections
import { motion } from "framer-motion";
import {
  Lightbulb,
  Clock,
  Target,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  MapPin,
  Users,
  Trophy,
  GraduationCap,
  ShoppingBag,
  Sun,
  Moon,
  Accessibility,
  Car,
  Droplets,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface Business {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  city: string;
  state: string;
  ratingAvg: string | null;
  reviewCount: number | null;
  category?: {
    name: string;
    slug: string;
  } | null;
}

interface DynamicContentProps {
  business: Business;
}

// Amenity icons mapping
const amenityIcons: Record<string, React.ElementType> = {
  "Indoor Courts": Sun,
  "Outdoor Courts": Sun,
  "Indoor & Outdoor Courts": Sun,
  "Court Lighting": Moon,
  "Pro Shop": ShoppingBag,
  "Lessons Available": GraduationCap,
  "League Play": Users,
  "Tournaments": Trophy,
  "Equipment Rental": ShoppingBag,
  "Online Reservations": Clock,
  "Restrooms": Droplets,
  "Parking Available": Car,
  "Wheelchair Accessible": Accessibility,
};

export function DynamicBusinessContent({ business }: DynamicContentProps) {
  const [content, setContent] = useState<{
    description: string;
    amenitiesList: string[];
    playingTips: string[];
    whatToExpect: string[];
    bestTimes: { time: string; description: string }[];
    skillRecommendations: { level: string; recommendation: string }[];
  } | null>(null);
  const [tipsOpen, setTipsOpen] = useState(true);
  const [timesOpen, setTimesOpen] = useState(false);
  const [skillsOpen, setSkillsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Generate content client-side using slug
    async function generateContent() {
      setIsLoading(true);
      setError(null);
      try {
        // Use slug from business object
        const slug = business.slug;
        if (!slug) {
          setError("No business slug available");
          setIsLoading(false);
          return;
        }
        const response = await fetch(`/api/businesses/${slug}/content`);
        if (response.ok) {
          const data = await response.json();
          setContent(data);
        } else {
          const errData = await response.json();
          setError(errData.error || "Failed to load content");
        }
      } catch (error) {
        console.error("Error fetching content:", error);
        setError("Failed to load dynamic content");
      } finally {
        setIsLoading(false);
      }
    }
    generateContent();
  }, [business.slug]);

  if (isLoading) {
    return (
      <div className="glass-card rounded-xl p-6 animate-pulse">
        <div className="h-6 bg-secondary rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-secondary rounded w-full mb-2"></div>
        <div className="h-4 bg-secondary rounded w-2/3"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card rounded-xl p-6 text-center text-muted-foreground">
        <p>Unable to load dynamic content</p>
      </div>
    );
  }

  if (!content) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Dynamic Description */}
      <div className="glass-card rounded-xl p-5 sm:p-6">
        <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          About {business.name}
        </h3>
        <p className="text-muted-foreground leading-relaxed">
          {content.description}
        </p>
      </div>

      {/* Amenities */}
      {content.amenitiesList.length > 0 && (
        <div className="glass-card rounded-xl p-5 sm:p-6">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            Amenities & Features
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {content.amenitiesList.map((amenity, index) => {
              const Icon = amenityIcons[amenity] || CheckCircle2;
              return (
                <motion.div
                  key={amenity}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50"
                >
                  <Icon className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-sm">{amenity}</span>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Playing Tips */}
      <Collapsible open={tipsOpen} onOpenChange={setTipsOpen}>
        <div className="glass-card rounded-xl overflow-hidden">
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full p-5 sm:p-6 flex items-center justify-between hover:bg-secondary/50"
            >
              <div className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-amber-500" />
                <span className="font-semibold text-lg">Tips for Playing Here</span>
              </div>
              {tipsOpen ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-5 sm:px-6 pb-5 sm:pb-6 space-y-3">
              {content.playingTips.map((tip, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-3"
                >
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-medium text-primary">{index + 1}</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{tip}</p>
                </motion.div>
              ))}
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      {/* What to Expect */}
      {content.whatToExpect.length > 0 && (
        <div className="glass-card rounded-xl p-5 sm:p-6">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-500" />
            What to Expect
          </h3>
          <div className="grid gap-2">
            {content.whatToExpect.map((item, index) => (
              <div key={index} className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                <span className="text-sm text-muted-foreground">{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Best Times to Visit */}
      <Collapsible open={timesOpen} onOpenChange={setTimesOpen}>
        <div className="glass-card rounded-xl overflow-hidden">
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full p-5 sm:p-6 flex items-center justify-between hover:bg-secondary/50"
            >
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-500" />
                <span className="font-semibold text-lg">Best Times to Visit</span>
              </div>
              {timesOpen ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-5 sm:px-6 pb-5 sm:pb-6 space-y-4">
              {content.bestTimes.map((timeSlot, index) => (
                <div key={index} className="border-l-2 border-primary/30 pl-4">
                  <h4 className="font-medium text-sm mb-1">{timeSlot.time}</h4>
                  <p className="text-sm text-muted-foreground">{timeSlot.description}</p>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      {/* Skill Level Recommendations */}
      {content.skillRecommendations.length > 0 && (
        <Collapsible open={skillsOpen} onOpenChange={setSkillsOpen}>
          <div className="glass-card rounded-xl overflow-hidden">
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full p-5 sm:p-6 flex items-center justify-between hover:bg-secondary/50"
              >
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-purple-500" />
                  <span className="font-semibold text-lg">Skill Level Guide</span>
                </div>
                {skillsOpen ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-5 sm:px-6 pb-5 sm:pb-6 space-y-4">
                {content.skillRecommendations.map((rec, index) => (
                  <div key={index} className="p-3 rounded-lg bg-secondary/50">
                    <Badge variant="outline" className="mb-2">{rec.level}</Badge>
                    <p className="text-sm text-muted-foreground">{rec.recommendation}</p>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
      )}
    </div>
  );
}
