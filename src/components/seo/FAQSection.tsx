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
 * Generate location-specific FAQs for water damage services
 */
export function generateWaterDamageFAQs(cityName?: string, regionName?: string, categoryName?: string): FAQ[] {
  const location = cityName && regionName
    ? `${cityName}, ${regionName}`
    : regionName
    ? regionName
    : "USA";

  const service = categoryName || "water damage restoration services";

  return [
    {
      question: `Where can I find ${service} in ${location}?`,
      answer: `Our comprehensive directory lists all ${service} in ${location}. Browse our curated list of water damage restoration companies, emergency flood cleanup services, mold remediation specialists, and insurance claim assistance providers. Each listing includes detailed information such as location, hours, contact details, and user reviews to help you find the right professional for your needs.`,
    },
    {
      question: `Are the ${service} listings in ${location} verified?`,
      answer: `Yes, we work to verify all water damage restoration businesses in our directory through multiple sources including Google Places API integration and direct business verification. We continuously update our listings to ensure accuracy and reliability.`,
    },
    {
      question: `Do water damage restoration companies in ${location} offer 24/7 emergency services?`,
      answer: `Many water damage restoration companies in ${location} offer 24/7 emergency services for urgent situations like burst pipes, flooding, or storm damage. Check the business descriptions and contact information for each listing to confirm their emergency availability. Time is critical in water damage situations to prevent mold growth and structural damage.`,
    },
    {
      question: `Can I leave reviews for ${service} in ${location}?`,
      answer: `Yes! Creating an account allows you to leave reviews, rate businesses, and share your experiences with other property owners. Your reviews help the community make informed decisions about which water damage restoration company to hire for their emergency or restoration needs.`,
    },
    {
      question: `How do I add my water damage restoration business to the ${location} directory?`,
      answer: `Business owners can easily submit their water damage restoration company, mold remediation service, or flood cleanup business through our "Add Business" page. We'll review your submission and add it to our directory. Verified business owners can claim their listings to manage information, respond to reviews, and access analytics.`,
    },
  ];
}

/**
 * Generate general water damage restoration FAQs
 */
export function generateGeneralWaterDamageFAQs(): FAQ[] {
  return [
    {
      question: "What should I do immediately after water damage occurs?",
      answer: `First, ensure safety by turning off electricity if water levels are high. Document the damage with photos and videos for insurance purposes. Contact your insurance company to report the claim. Then, call a professional water damage restoration company immediately - the first 24-48 hours are critical to prevent mold growth and minimize damage.`,
    },
    {
      question: "How do I find water damage restoration services near me?",
      answer: `Use our search feature to find water damage restoration companies in your area. Simply enter your city or region to discover nearby services including emergency water extraction, flood cleanup, mold remediation, and structural drying. Our directory includes both residential and commercial service providers with details about availability, services offered, and customer reviews.`,
    },
    {
      question: "What services do water damage restoration companies provide?",
      answer: `Water damage restoration companies typically offer emergency water extraction, structural drying, dehumidification, mold remediation, content restoration, and reconstruction services. Many also provide assistance with insurance claims documentation. Our directory helps you find specialists for each type of service based on your specific needs.`,
    },
    {
      question: "How long does water damage restoration take?",
      answer: `The timeline depends on the extent of damage. Minor water damage may be resolved in 3-5 days, while severe flooding or structural damage can take several weeks. A professional assessment will provide a more accurate timeline. Quick action is essential - call a restoration company immediately to minimize damage and reduce restoration time.`,
    },
    {
      question: "Will my insurance cover water damage restoration?",
      answer: `Many homeowner's insurance policies cover water damage from sudden, accidental events like burst pipes or appliance failures. Flood damage typically requires separate flood insurance. Our directory includes insurance claim assistance specialists who can help you navigate the claims process and maximize your coverage.`,
    },
  ];
}
