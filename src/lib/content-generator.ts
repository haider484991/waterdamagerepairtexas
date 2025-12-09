/**
 * Dynamic Content Generator
 * Generates unique, SEO-friendly descriptions and tips for pickleball businesses
 */

import type { Business, Category } from "@/lib/db/schema";

// Amenity detection based on business name, types, and category
export interface DetectedAmenities {
  hasIndoorCourts: boolean;
  hasOutdoorCourts: boolean;
  hasLighting: boolean;
  hasProShop: boolean;
  hasRestrooms: boolean;
  hasParking: boolean;
  hasWaterFountain: boolean;
  hasBenchSeating: boolean;
  offersLessons: boolean;
  offersLeagues: boolean;
  offersTournaments: boolean;
  hasEquipmentRental: boolean;
  isPrivateClub: boolean;
  isPublicFacility: boolean;
  hasReservationSystem: boolean;
  wheelchairAccessible: boolean;
}

// Detect amenities from business data
export function detectAmenities(business: Business, category?: Category | null): DetectedAmenities {
  const name = business.name.toLowerCase();
  const description = (business.description || "").toLowerCase();
  const categorySlug = category?.slug || "";
  const combined = `${name} ${description}`;

  return {
    hasIndoorCourts: /indoor|covered|climate|heated|air.?condition/i.test(combined),
    hasOutdoorCourts: /outdoor|open.?air|outside/i.test(combined) || !(/indoor/i.test(combined)),
    hasLighting: /light|night|evening|lit courts/i.test(combined),
    hasProShop: /pro.?shop|store|retail|equipment/i.test(combined) || categorySlug.includes("equipment"),
    hasRestrooms: true, // Assume most facilities have restrooms
    hasParking: true, // Assume most facilities have parking
    hasWaterFountain: /recreation|community|park|center/i.test(combined),
    hasBenchSeating: true, // Assume most courts have seating
    offersLessons: /lesson|coach|instruction|training|academy|clinic/i.test(combined) || categorySlug.includes("coach"),
    offersLeagues: /league|club|association|member/i.test(combined) || categorySlug.includes("club"),
    offersTournaments: /tournament|competition|championship|event/i.test(combined) || categorySlug.includes("tournament"),
    hasEquipmentRental: /rental|rent|borrow|equipment/i.test(combined),
    isPrivateClub: /private|member|club|country/i.test(combined),
    isPublicFacility: /public|community|recreation|park|ymca|city/i.test(combined),
    hasReservationSystem: /reserv|book|schedule|appointment/i.test(combined),
    wheelchairAccessible: /accessible|wheelchair|ada|handicap/i.test(combined) || /recreation|community|public/i.test(combined),
  };
}

// Generate amenities list for display
export function generateAmenitiesList(amenities: DetectedAmenities): string[] {
  const list: string[] = [];

  if (amenities.hasIndoorCourts) list.push("Indoor Courts");
  if (amenities.hasOutdoorCourts && !amenities.hasIndoorCourts) list.push("Outdoor Courts");
  if (amenities.hasIndoorCourts && amenities.hasOutdoorCourts) list.push("Indoor & Outdoor Courts");
  if (amenities.hasLighting) list.push("Court Lighting");
  if (amenities.hasProShop) list.push("Pro Shop");
  if (amenities.offersLessons) list.push("Lessons Available");
  if (amenities.offersLeagues) list.push("League Play");
  if (amenities.offersTournaments) list.push("Tournaments");
  if (amenities.hasEquipmentRental) list.push("Equipment Rental");
  if (amenities.hasReservationSystem) list.push("Online Reservations");
  if (amenities.hasRestrooms) list.push("Restrooms");
  if (amenities.hasParking) list.push("Parking Available");
  if (amenities.wheelchairAccessible) list.push("Wheelchair Accessible");

  return list;
}

// Skill level suggestions based on facility type
type SkillLevel = "beginner" | "intermediate" | "advanced" | "all";

function determineSkillLevels(business: Business, amenities: DetectedAmenities): SkillLevel[] {
  const levels: SkillLevel[] = [];
  const name = business.name.toLowerCase();

  if (amenities.offersLessons || /beginner|learn|intro|starter/i.test(name)) {
    levels.push("beginner");
  }
  if (amenities.offersLeagues || /club|league/i.test(name)) {
    levels.push("intermediate");
  }
  if (amenities.offersTournaments || /competitive|tournament|championship/i.test(name)) {
    levels.push("advanced");
  }
  if (/recreation|community|public|park/i.test(name)) {
    levels.push("all");
  }

  return levels.length > 0 ? levels : ["all"];
}

// Generate dynamic description
export function generateBusinessDescription(
  business: Business,
  category?: Category | null
): string {
  const amenities = detectAmenities(business, category);
  const cityState = `${business.city}, ${business.state}`;
  const categoryName = category?.name || "pickleball facility";
  const rating = Number(business.ratingAvg) || 0;
  const reviews = business.reviewCount || 0;

  // Build description parts
  const parts: string[] = [];

  // Opening line based on facility type
  if (amenities.isPrivateClub) {
    parts.push(`${business.name} is a premier private ${categoryName.toLowerCase()} located in ${cityState}.`);
  } else if (amenities.isPublicFacility) {
    parts.push(`${business.name} is a public ${categoryName.toLowerCase()} serving the ${cityState} community.`);
  } else {
    parts.push(`${business.name} is a ${categoryName.toLowerCase()} located in ${cityState}.`);
  }

  // Court type
  if (amenities.hasIndoorCourts && amenities.hasOutdoorCourts) {
    parts.push("The facility features both indoor and outdoor pickleball courts, allowing year-round play regardless of weather conditions.");
  } else if (amenities.hasIndoorCourts) {
    parts.push("This indoor facility offers climate-controlled courts for comfortable play in any season.");
  } else {
    parts.push("The facility offers outdoor courts for pickleball enthusiasts.");
  }

  // Rating mention
  if (rating >= 4.5 && reviews >= 20) {
    parts.push(`Highly rated by the local pickleball community with ${rating.toFixed(1)} stars from ${reviews} reviews.`);
  } else if (rating >= 4.0 && reviews >= 10) {
    parts.push(`Well-reviewed by players with a ${rating.toFixed(1)}-star rating.`);
  }

  // Services
  const services: string[] = [];
  if (amenities.offersLessons) services.push("professional coaching and lessons");
  if (amenities.offersLeagues) services.push("organized league play");
  if (amenities.offersTournaments) services.push("tournament hosting");
  if (amenities.hasEquipmentRental) services.push("equipment rental");

  if (services.length > 0) {
    parts.push(`Services include ${services.join(", ")}.`);
  }

  // Amenities highlight
  if (amenities.hasProShop) {
    parts.push("An on-site pro shop offers paddles, balls, and accessories.");
  }
  if (amenities.hasLighting) {
    parts.push("Court lighting enables evening play sessions.");
  }

  return parts.join(" ");
}

// Generate playing tips based on facility type
export function generatePlayingTips(
  business: Business,
  category?: Category | null
): string[] {
  const amenities = detectAmenities(business, category);
  const tips: string[] = [];

  // General tips
  tips.push("Arrive 10-15 minutes early to warm up and secure your court time.");
  tips.push("Bring water and stay hydrated, especially during longer sessions.");

  // Indoor vs outdoor tips
  if (amenities.hasIndoorCourts) {
    tips.push("Indoor courts may have different ball bounce characteristics - consider using indoor-specific balls.");
    tips.push("Court shoes with non-marking soles are typically required for indoor play.");
  } else {
    tips.push("Check weather conditions before heading out for outdoor play.");
    tips.push("Outdoor balls (with smaller holes) perform better in windy conditions.");
    tips.push("Apply sunscreen and wear a hat for daytime outdoor sessions.");
  }

  // Reservation tips
  if (amenities.hasReservationSystem) {
    tips.push("Book courts in advance, especially during peak hours (evenings and weekends).");
  } else {
    tips.push("Courts may operate on a first-come, first-served basis - arrive early for best availability.");
  }

  // Club/league tips
  if (amenities.offersLeagues) {
    tips.push("Ask about league schedules and skill-level divisions to find the right competitive match.");
    tips.push("Open play sessions are great for meeting other players and improving your game.");
  }

  // Lesson tips
  if (amenities.offersLessons) {
    tips.push("Beginners should consider taking a few lessons to learn proper technique and court etiquette.");
    tips.push("Group clinics offer affordable instruction and a chance to meet fellow players.");
  }

  // Equipment tips
  if (amenities.hasEquipmentRental) {
    tips.push("Equipment rental is available if you're new to the sport or forgot your gear.");
  }
  if (amenities.hasProShop) {
    tips.push("Visit the pro shop for paddle demos - trying before buying helps find the right fit.");
  }

  // Private club tips
  if (amenities.isPrivateClub) {
    tips.push("Contact the club about membership options, guest policies, and trial visits.");
  }

  // Public facility tips
  if (amenities.isPublicFacility) {
    tips.push("Public courts may have time limits during busy periods - be courteous to waiting players.");
  }

  // Lighting tips
  if (amenities.hasLighting) {
    tips.push("Evening sessions under lights offer cooler temperatures during summer months.");
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

  // Facility type expectations
  if (amenities.isPrivateClub) {
    expectations.push("Private club atmosphere with dedicated pickleball facilities");
    expectations.push("Membership may be required for regular play");
  } else if (amenities.isPublicFacility) {
    expectations.push("Community-friendly environment welcoming all skill levels");
    expectations.push("Affordable or free court access for residents");
  }

  // Court expectations
  if (amenities.hasIndoorCourts) {
    expectations.push("Climate-controlled indoor courts for year-round comfort");
  }
  if (amenities.hasOutdoorCourts) {
    expectations.push("Outdoor courts with fresh air and natural lighting");
  }
  if (amenities.hasLighting) {
    expectations.push("Lighted courts for extended evening play hours");
  }

  // Service expectations
  if (amenities.offersLessons) {
    expectations.push("Professional instruction available for skill development");
  }
  if (amenities.offersLeagues) {
    expectations.push("Organized league play and competitive opportunities");
  }
  if (amenities.offersTournaments) {
    expectations.push("Tournament hosting with competitive play options");
  }

  // Amenity expectations
  if (amenities.hasProShop) {
    expectations.push("On-site pro shop for equipment and accessories");
  }
  if (amenities.hasEquipmentRental) {
    expectations.push("Equipment rental for beginners or visitors");
  }

  // Standard expectations
  expectations.push("Dedicated pickleball courts with proper lines and nets");
  if (amenities.hasRestrooms) {
    expectations.push("Restroom facilities available on-site");
  }
  if (amenities.hasParking) {
    expectations.push("Convenient parking for players");
  }

  return expectations.slice(0, 8);
}

// Generate best times to visit
export function generateBestTimes(
  business: Business,
  category?: Category | null
): { time: string; description: string }[] {
  const amenities = detectAmenities(business, category);
  const times: { time: string; description: string }[] = [];

  // Morning
  times.push({
    time: "Early Morning (6-9 AM)",
    description: amenities.hasOutdoorCourts 
      ? "Beat the heat and crowds. Great for serious players."
      : "Quieter courts before the day gets busy.",
  });

  // Mid-morning
  times.push({
    time: "Mid-Morning (9 AM - 12 PM)",
    description: "Popular time for retirees and flexible schedules. Expect moderate activity.",
  });

  // Afternoon
  times.push({
    time: "Afternoon (12-5 PM)",
    description: amenities.hasIndoorCourts
      ? "Good availability as many players take a break."
      : "Can be hot outdoors in summer. Indoor courts recommended.",
  });

  // Evening
  if (amenities.hasLighting || amenities.hasIndoorCourts) {
    times.push({
      time: "Evening (5-9 PM)",
      description: "Peak hours - most popular time for working professionals. Book ahead if possible.",
    });
  }

  // Weekends
  times.push({
    time: "Weekends",
    description: amenities.offersLeagues
      ? "League play and tournaments often scheduled. Check calendar for open play times."
      : "Busiest time - arrive early for best court availability.",
  });

  return times;
}

// Generate skill level recommendations
export function generateSkillRecommendations(
  business: Business,
  category?: Category | null
): { level: string; recommendation: string }[] {
  const amenities = detectAmenities(business, category);
  const recommendations: { level: string; recommendation: string }[] = [];

  // Beginners
  if (amenities.offersLessons || amenities.isPublicFacility) {
    recommendations.push({
      level: "Beginners (1.0-2.5)",
      recommendation: amenities.offersLessons
        ? "Great choice! Take advantage of beginner lessons and clinics to build proper fundamentals."
        : "Welcoming environment for new players. Look for beginner-friendly open play sessions.",
    });
  }

  // Intermediate
  recommendations.push({
    level: "Intermediate (3.0-3.5)",
    recommendation: amenities.offersLeagues
      ? "Join league play to find consistent partners at your skill level and improve through competition."
      : "Open play sessions offer good opportunities to challenge yourself against varied opponents.",
  });

  // Advanced
  if (amenities.offersTournaments || amenities.offersLeagues) {
    recommendations.push({
      level: "Advanced (4.0+)",
      recommendation: amenities.offersTournaments
        ? "Competitive environment with tournament play. Great for serious players looking to compete."
        : "Strong player community with challenging competition available.",
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
