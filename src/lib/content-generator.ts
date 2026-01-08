/**
 * Dynamic Content Generator
 * Generates unique, SEO-friendly descriptions and tips for water damage restoration businesses
 */

import type { Business, Category } from "@/lib/db/schema";

// Service detection based on business name, types, and category
export interface DetectedAmenities {
  offers24HourService: boolean;
  offersEmergencyService: boolean;
  hasInsuranceAssistance: boolean;
  offersMoldRemediation: boolean;
  offersFloodCleanup: boolean;
  offersWaterExtraction: boolean;
  offersStructuralDrying: boolean;
  offersContentRestoration: boolean;
  hasCertifiedTechnicians: boolean;
  hasCommercialServices: boolean;
  hasResidentialServices: boolean;
  offersFreeEstimates: boolean;
  isLocallyOwned: boolean;
  isNationalCompany: boolean;
  hasWarranty: boolean;
  servesRuralAreas: boolean;
}

// Detect services from business data
export function detectAmenities(business: Business, category?: Category | null): DetectedAmenities {
  const name = business.name.toLowerCase();
  const description = (business.description || "").toLowerCase();
  const categorySlug = category?.slug || "";
  const combined = `${name} ${description}`;

  return {
    offers24HourService: /24.?hour|24\/7|round.?the.?clock|always.?available/i.test(combined),
    offersEmergencyService: /emergency|urgent|immediate|rapid|fast.?response/i.test(combined),
    hasInsuranceAssistance: /insurance|claim|billing|direct.?bill/i.test(combined),
    offersMoldRemediation: /mold|mildew|fungus|remediation/i.test(combined) || categorySlug.includes("mold"),
    offersFloodCleanup: /flood|storm|hurricane|natural.?disaster/i.test(combined) || categorySlug.includes("flood"),
    offersWaterExtraction: /extraction|pump|remove.?water|water.?removal/i.test(combined),
    offersStructuralDrying: /dry|dehumidif|structural|air.?mover/i.test(combined),
    offersContentRestoration: /content|furniture|belong|personal.?item/i.test(combined),
    hasCertifiedTechnicians: /certified|iicrc|license|trained|professional/i.test(combined),
    hasCommercialServices: /commercial|business|office|industrial/i.test(combined),
    hasResidentialServices: /residential|home|house|apartment/i.test(combined) || !(/commercial/i.test(combined)),
    offersFreeEstimates: /free.?estimate|free.?quote|free.?inspection|no.?cost/i.test(combined),
    isLocallyOwned: /local|family.?owned|community|neighborhood/i.test(combined),
    isNationalCompany: /national|franchise|servpro|servicemaster|belfor/i.test(combined),
    hasWarranty: /warranty|guarantee|satisfaction/i.test(combined),
    servesRuralAreas: /rural|county|region|surrounding/i.test(combined),
  };
}

// Generate services list for display
export function generateAmenitiesList(amenities: DetectedAmenities): string[] {
  const list: string[] = [];

  if (amenities.offers24HourService) list.push("24/7 Service");
  if (amenities.offersEmergencyService) list.push("Emergency Response");
  if (amenities.hasInsuranceAssistance) list.push("Insurance Assistance");
  if (amenities.offersMoldRemediation) list.push("Mold Remediation");
  if (amenities.offersFloodCleanup) list.push("Flood Cleanup");
  if (amenities.offersWaterExtraction) list.push("Water Extraction");
  if (amenities.offersStructuralDrying) list.push("Structural Drying");
  if (amenities.offersContentRestoration) list.push("Content Restoration");
  if (amenities.hasCertifiedTechnicians) list.push("Certified Technicians");
  if (amenities.hasCommercialServices) list.push("Commercial Services");
  if (amenities.hasResidentialServices) list.push("Residential Services");
  if (amenities.offersFreeEstimates) list.push("Free Estimates");

  return list;
}

// Service type classification
type ServiceType = "emergency" | "residential" | "commercial" | "specialty" | "all";

function determineServiceTypes(business: Business, amenities: DetectedAmenities): ServiceType[] {
  const types: ServiceType[] = [];
  const name = business.name.toLowerCase();

  if (amenities.offersEmergencyService || amenities.offers24HourService) {
    types.push("emergency");
  }
  if (amenities.hasResidentialServices) {
    types.push("residential");
  }
  if (amenities.hasCommercialServices) {
    types.push("commercial");
  }
  if (amenities.offersMoldRemediation || /specialty|special/i.test(name)) {
    types.push("specialty");
  }

  return types.length > 0 ? types : ["all"];
}

// Generate dynamic description
export function generateBusinessDescription(
  business: Business,
  category?: Category | null
): string {
  const amenities = detectAmenities(business, category);
  const cityState = `${business.city}, ${business.state}`;
  const categoryName = category?.name || "water damage restoration company";
  const rating = Number(business.ratingAvg) || 0;
  const reviews = business.reviewCount || 0;

  // Build description parts
  const parts: string[] = [];

  // Opening line based on company type
  if (amenities.isLocallyOwned) {
    parts.push(`${business.name} is a locally-owned ${categoryName.toLowerCase()} proudly serving ${cityState} and surrounding areas.`);
  } else if (amenities.isNationalCompany) {
    parts.push(`${business.name} is a trusted ${categoryName.toLowerCase()} with a ${cityState} location, backed by national resources and expertise.`);
  } else {
    parts.push(`${business.name} is a professional ${categoryName.toLowerCase()} serving the ${cityState} area.`);
  }

  // Emergency services
  if (amenities.offers24HourService && amenities.offersEmergencyService) {
    parts.push("They offer 24/7 emergency response services to minimize water damage and get your property restored quickly.");
  } else if (amenities.offersEmergencyService) {
    parts.push("Emergency services are available for urgent water damage situations.");
  }

  // Rating mention
  if (rating >= 4.5 && reviews >= 20) {
    parts.push(`Highly rated by Texas property owners with ${rating.toFixed(1)} stars from ${reviews} reviews.`);
  } else if (rating >= 4.0 && reviews >= 10) {
    parts.push(`Well-reviewed by customers with a ${rating.toFixed(1)}-star rating.`);
  }

  // Services
  const services: string[] = [];
  if (amenities.offersWaterExtraction) services.push("water extraction");
  if (amenities.offersStructuralDrying) services.push("structural drying");
  if (amenities.offersMoldRemediation) services.push("mold remediation");
  if (amenities.offersContentRestoration) services.push("content restoration");

  if (services.length > 0) {
    parts.push(`Services include ${services.join(", ")}.`);
  }

  // Additional highlights
  if (amenities.hasInsuranceAssistance) {
    parts.push("They work directly with insurance companies to help streamline your claims process.");
  }
  if (amenities.hasCertifiedTechnicians) {
    parts.push("Their team includes IICRC-certified technicians trained in the latest restoration techniques.");
  }

  return parts.join(" ");
}

// Generate tips for property owners
export function generatePlayingTips(
  business: Business,
  category?: Category | null
): string[] {
  const amenities = detectAmenities(business, category);
  const tips: string[] = [];

  // General emergency tips
  tips.push("Document all damage with photos and videos before any cleanup begins for insurance purposes.");
  tips.push("Turn off electricity to affected areas if safe to do so to prevent electrical hazards.");

  // Emergency service tips
  if (amenities.offersEmergencyService || amenities.offers24HourService) {
    tips.push("Don't wait to call - water damage worsens rapidly, and quick response prevents mold growth.");
    tips.push("Keep the company's emergency number saved in your phone for quick access.");
  } else {
    tips.push("Call during business hours to schedule an inspection and get a detailed assessment.");
  }

  // Insurance tips
  if (amenities.hasInsuranceAssistance) {
    tips.push("Ask about their direct insurance billing process to simplify your claims.");
    tips.push("Request detailed documentation of all work performed for your insurance records.");
  }

  // Mold tips
  if (amenities.offersMoldRemediation) {
    tips.push("If you suspect mold, avoid disturbing it - professional remediation prevents spore spread.");
    tips.push("Ask about mold testing services to identify hidden moisture problems.");
  }

  // Service tips
  if (amenities.hasCertifiedTechnicians) {
    tips.push("Ask about their IICRC certifications and training to ensure quality restoration work.");
  }

  // Free estimate tips
  if (amenities.offersFreeEstimates) {
    tips.push("Take advantage of free estimates to understand the full scope of needed repairs.");
  }

  // Commercial vs residential
  if (amenities.hasCommercialServices) {
    tips.push("For businesses, ask about their plan to minimize downtime during restoration.");
  }

  // Local company tips
  if (amenities.isLocallyOwned) {
    tips.push("Local companies often provide faster response times and personalized service.");
  }

  return tips.slice(0, 6); // Return top 6 most relevant tips
}

// Generate "What to Expect" section
export function generateWhatToExpect(
  business: Business,
  category?: Category | null
): string[] {
  const amenities = detectAmenities(business, category);
  const expectations: string[] = [];

  // Company type expectations
  if (amenities.isLocallyOwned) {
    expectations.push("Personalized service from a locally-owned company");
    expectations.push("Quick response times from technicians who know the area");
  } else if (amenities.isNationalCompany) {
    expectations.push("Backed by national resources and standardized processes");
    expectations.push("Consistent quality with brand accountability");
  }

  // Emergency service expectations
  if (amenities.offers24HourService) {
    expectations.push("24/7 availability for water damage emergencies");
  }
  if (amenities.offersEmergencyService) {
    expectations.push("Rapid response to minimize property damage");
  }

  // Service process expectations
  expectations.push("Thorough damage assessment and detailed restoration plan");
  if (amenities.offersWaterExtraction) {
    expectations.push("Professional water extraction using industrial equipment");
  }
  if (amenities.offersStructuralDrying) {
    expectations.push("Complete structural drying with moisture monitoring");
  }
  if (amenities.offersMoldRemediation) {
    expectations.push("Comprehensive mold inspection and remediation services");
  }

  // Additional service expectations
  if (amenities.hasCertifiedTechnicians) {
    expectations.push("IICRC-certified technicians with professional training");
  }
  if (amenities.hasInsuranceAssistance) {
    expectations.push("Direct coordination with your insurance company");
  }
  if (amenities.offersFreeEstimates) {
    expectations.push("Free initial inspection and damage assessment");
  }
  if (amenities.hasWarranty) {
    expectations.push("Workmanship warranty for peace of mind");
  }

  return expectations.slice(0, 8);
}

// Generate best times to contact
export function generateBestTimes(
  business: Business,
  category?: Category | null
): { time: string; description: string }[] {
  const amenities = detectAmenities(business, category);
  const times: { time: string; description: string }[] = [];

  // Emergency situations
  if (amenities.offers24HourService) {
    times.push({
      time: "Emergency (24/7)",
      description: "For active flooding or major water damage, call immediately - they respond around the clock.",
    });
  }

  // Business hours
  times.push({
    time: "Business Hours (8 AM - 6 PM)",
    description: "Best time for scheduling inspections, getting estimates, and discussing non-emergency repairs.",
  });

  // Morning
  times.push({
    time: "Early Morning (8-10 AM)",
    description: "Ideal for scheduling same-day appointments and getting quick responses to your inquiry.",
  });

  // Off-peak
  times.push({
    time: "Mid-Week",
    description: amenities.offersEmergencyService
      ? "Tuesdays through Thursdays often have better availability for scheduled work."
      : "Better availability for inspections and estimates during mid-week.",
  });

  // Planning ahead
  times.push({
    time: "After Discovery",
    description: "Don't wait - water damage worsens within 24-48 hours. Contact them as soon as you discover the problem.",
  });

  return times;
}

// Generate service recommendations based on damage type
export function generateSkillRecommendations(
  business: Business,
  category?: Category | null
): { level: string; recommendation: string }[] {
  const amenities = detectAmenities(business, category);
  const recommendations: { level: string; recommendation: string }[] = [];

  // Residential customers
  if (amenities.hasResidentialServices) {
    recommendations.push({
      level: "Homeowners",
      recommendation: amenities.hasInsuranceAssistance
        ? "Great choice for homeowners - they handle insurance coordination and provide comprehensive home restoration."
        : "Experienced with residential water damage, from minor leaks to major flooding.",
    });
  }

  // Commercial customers
  if (amenities.hasCommercialServices) {
    recommendations.push({
      level: "Business Owners",
      recommendation: amenities.offers24HourService
        ? "Ideal for businesses - 24/7 availability minimizes downtime and gets you back to operations quickly."
        : "Experienced with commercial properties and understands the urgency of business restoration.",
    });
  }

  // Emergency situations
  if (amenities.offersEmergencyService || amenities.offers24HourService) {
    recommendations.push({
      level: "Emergency Situations",
      recommendation: "Perfect for urgent water damage - rapid response prevents mold growth and structural damage.",
    });
  }

  // Mold concerns
  if (amenities.offersMoldRemediation) {
    recommendations.push({
      level: "Mold Concerns",
      recommendation: "Equipped for mold remediation - they can test, contain, and remove mold safely and effectively.",
    });
  }

  return recommendations;
}

// Generate complete content package for a business
export interface BusinessContent {
  description: string;
  amenities: DetectedAmenities;
  amenitiesList: string[];
  playingTips: string[];
  whatToExpect: string[];
  bestTimes: { time: string; description: string }[];
  skillRecommendations: { level: string; recommendation: string }[];
}

export function generateBusinessContent(
  business: Business,
  category?: Category | null
): BusinessContent {
  const amenities = detectAmenities(business, category);

  return {
    description: generateBusinessDescription(business, category),
    amenities,
    amenitiesList: generateAmenitiesList(amenities),
    playingTips: generatePlayingTips(business, category),
    whatToExpect: generateWhatToExpect(business, category),
    bestTimes: generateBestTimes(business, category),
    skillRecommendations: generateSkillRecommendations(business, category),
  };
}
