import Link from "next/link";
import { Mail, Phone, Facebook, Twitter, Instagram } from "lucide-react";
import { Logo } from "@/components/layout/Logo";

const footerLinks = {
  categories: [
    { href: "/categories/restaurants-cafes", label: "Restaurants" },
    { href: "/categories/fitness-gyms", label: "Fitness & Gyms" },
    { href: "/categories/medical-dental", label: "Healthcare" },
    { href: "/categories/home-improvement", label: "Home Services" },
    { href: "/categories/automotive", label: "Automotive" },
  ],
  neighborhoods: [
    { href: "/neighborhoods/legacy-west", label: "Legacy West" },
    { href: "/neighborhoods/downtown-plano", label: "Downtown Plano" },
    { href: "/neighborhoods/west-plano", label: "West Plano" },
    { href: "/neighborhoods/east-plano", label: "East Plano" },
  ],
  company: [
    { href: "/about", label: "About Us" },
    { href: "/contact", label: "Contact" },
    { href: "/claim-business", label: "Claim Your Business" },
    { href: "/advertise", label: "Advertise" },
  ],
  legal: [
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/terms", label: "Terms of Service" },
    { href: "/dmca", label: "DMCA Policy" },
  ],
};

export function Footer() {
  return (
    <footer className="bg-card border-t border-border/50">
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Logo size={44} textSize="text-xl" />
            </Link>
            <p className="text-muted-foreground mb-6 max-w-md">
              Your comprehensive guide to discovering the best local businesses in
              Plano, Texas. Find restaurants, services, shops, and more with reviews
              and ratings from your community.
            </p>
            <div className="flex items-center gap-4">
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-secondary/80 transition-colors"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-secondary/80 transition-colors"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-secondary/80 transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Popular Categories</h3>
            <ul className="space-y-3">
              {footerLinks.categories.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground hover:text-primary transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Neighborhoods */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Neighborhoods</h3>
            <ul className="space-y-3">
              {footerLinks.neighborhoods.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground hover:text-primary transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Company</h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground hover:text-primary transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-border/50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Henry Harrison Plano Texas. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              {footerLinks.legal.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

