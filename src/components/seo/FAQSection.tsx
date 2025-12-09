/**
 * FAQ Section Component with Schema Markup
 * Optimized for AI search engines (ChatGPT, Perplexity, Gemini)
 */

import { JsonLd } from "./JsonLd";
import { generateFAQSchema } from "@/lib/seo/schema-markup";

interface FAQ {
  question: string;
  answer: string;
}

interface FAQSectionProps {
  faqs: FAQ[];
  title?: string;
  description?: string;
}

export function FAQSection({ faqs, title = "Frequently Asked Questions", description }: FAQSectionProps) {
  if (faqs.length === 0) return null;

  return (
    <>
      <JsonLd data={generateFAQSchema(faqs)} id="faq-schema" />
      
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{title}</h2>
            {description && (
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {description}
              </p>
            )}
          </div>

          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <h3 className="text-lg font-semibold mb-3 text-foreground">
                  {faq.question}
                </h3>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

/**
 * Generate location-specific FAQs for pickleball
 */
export function generatePickleballFAQs(cityName?: string, stateName?: string, categoryName?: string): FAQ[] {
  const location = cityName && stateName 
    ? `${cityName}, ${stateName}` 
    : stateName 
    ? stateName 
    : "the United States";

  const category = categoryName || "pickleball facilities";

  return [
    {
      question: `Where can I find ${category} in ${location}?`,
      answer: `Our comprehensive directory lists all ${category} in ${location}. Browse our curated list of pickleball courts, clubs, equipment stores, coaches, and tournaments. Each listing includes detailed information such as location, hours, contact details, and user reviews to help you find the perfect pickleball venue.`,
    },
    {
      question: `Are the ${category} listings in ${location} verified?`,
      answer: `Yes, we work to verify all pickleball businesses in our directory through multiple sources including Google Places API integration and direct business verification. We continuously update our listings to ensure accuracy and reliability.`,
    },
    {
      question: `How can I find indoor vs outdoor pickleball courts in ${location}?`,
      answer: `When browsing pickleball courts and facilities in ${location}, check the business descriptions and amenities listed for each location. Many facilities specify whether they offer indoor courts, outdoor courts, or both. You can also use our search filters to narrow down results based on your preferences.`,
    },
    {
      question: `Can I leave reviews for ${category} in ${location}?`,
      answer: `Yes! Creating an account allows you to leave reviews, rate businesses, and share your experiences with other pickleball players. Your reviews help the community make informed decisions about where to play, buy equipment, or take lessons.`,
    },
    {
      question: `How do I add my pickleball business to the ${location} directory?`,
      answer: `Business owners can easily submit their pickleball facility, club, store, or coaching service through our "Add Business" page. We'll review your submission and add it to our directory. Verified business owners can claim their listings to manage information, respond to reviews, and access analytics.`,
    },
  ];
}

/**
 * Generate general pickleball FAQs
 */
export function generateGeneralPickleballFAQs(): FAQ[] {
  return [
    {
      question: "What is pickleball?",
      answer: `Pickleball is a paddle sport that combines elements of tennis, badminton, and table tennis. Played on a court similar to a doubles badminton court, with a net slightly lower than a tennis net, players use solid paddles to hit a perforated plastic ball over the net. The game can be played as singles or doubles and is enjoyed by people of all ages and skill levels.`,
    },
    {
      question: "How do I find pickleball courts near me?",
      answer: `Use our search feature to find pickleball courts in your area. Simply enter your city, state, or zip code to discover nearby courts, clubs, and facilities. Our directory includes both public and private courts, with details about availability, fees, and amenities.`,
    },
    {
      question: "What equipment do I need to play pickleball?",
      answer: `To play pickleball, you'll need a paddle, pickleballs (indoor or outdoor depending on where you play), and appropriate court shoes. Many facilities provide equipment for beginners, but as you progress, you may want to invest in your own paddle. Our directory includes pickleball equipment stores where you can find quality gear.`,
    },
    {
      question: "How do I learn to play pickleball?",
      answer: `Many pickleball facilities offer beginner lessons, clinics, and drop-in sessions. Check our directory for certified pickleball coaches and instructors in your area. Many clubs also welcome beginners and offer introductory programs to help you learn the basics and meet other players.`,
    },
    {
      question: "Where can I find pickleball tournaments?",
      answer: `Browse our tournaments and events category to find upcoming pickleball competitions in your area. From local club tournaments to regional championships, our directory features events for all skill levels. Many clubs and facilities also host regular social play and competitive leagues.`,
    },
  ];
}

