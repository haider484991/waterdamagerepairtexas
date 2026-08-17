/**
 * The helpline is the site's only revenue event: calls route through Twilio to
 * eLocal, which pays per qualified call. Every `tel:` link on the site must go
 * through this module so that (a) the number can never drift between components
 * and (b) we can tell which page, city and placement actually earns a call.
 *
 * Before this existed the number was hardcoded in six components and nothing
 * was tracked, so "we get no calls" was unfalsifiable.
 */

export const HELPLINE_E164 = "+18667759098";
export const HELPLINE_DISPLAY = "(866) 775-9098";
export const HELPLINE_HREF = `tel:${HELPLINE_E164}`;

/** Where on the page the call started. Keep these stable — they become GA4 dimensions. */
export type CallPlacement =
  | "top_banner"
  | "header_desktop"
  | "header_mobile_menu"
  | "footer"
  | "floating_mobile"
  | "business_helpline_card"
  | "business_sidebar"
  | "city_hero"
  | "city_mid_page"
  | "city_footer_cta"
  | "state_hero"
  | "home_hero"
  | "cost_calculator_result"
  | "insurance_guide";

export interface CallContext {
  city?: string;
  state?: string;
  businessSlug?: string;
}

export type PageType =
  | "home"
  | "city"
  | "state"
  | "states_index"
  | "business"
  | "category"
  | "cost_calculator"
  | "insurance_guide"
  | "tool"
  | "blog"
  | "other";

/** Classify the current URL so calls can be attributed to a page type in GA4. */
export function pageTypeFromPath(pathname: string): PageType {
  const seg = pathname.split("/").filter(Boolean);
  if (seg.length === 0) return "home";
  switch (seg[0]) {
    case "states":
      if (seg.length === 1) return "states_index";
      return seg.length === 2 ? "state" : "city";
    case "business":
      return "business";
    case "categories":
      return "category";
    case "water-damage-restoration-cost":
      return "cost_calculator";
    case "does-homeowners-insurance-cover-water-damage":
      return "insurance_guide";
    case "tools":
      return "tool";
    case "blog":
      return "blog";
    default:
      return "other";
  }
}

type Gtag = (
  command: "event",
  eventName: string,
  params?: Record<string, unknown>
) => void;

interface TrackingWindow extends Window {
  gtag?: Gtag;
  dataLayer?: unknown[];
}

/**
 * Fire the call event. Sends two GA4 events on purpose:
 *   - `call_click`   — the rich custom event we segment and report on
 *   - `generate_lead` — a GA4 recommended event, so it can be marked as a
 *                       key event/conversion without custom setup
 * Never throws: a failed analytics call must not block the phone call.
 */
export function trackCall(placement: CallPlacement, ctx: CallContext = {}): void {
  if (typeof window === "undefined") return;

  try {
    const w = window as TrackingWindow;
    const pathname = window.location.pathname;
    const params: Record<string, unknown> = {
      placement,
      page_type: pageTypeFromPath(pathname),
      page_path: pathname,
      phone_number: HELPLINE_E164,
      ...(ctx.city ? { call_city: ctx.city } : {}),
      ...(ctx.state ? { call_state: ctx.state } : {}),
      ...(ctx.businessSlug ? { business_slug: ctx.businessSlug } : {}),
    };

    w.gtag?.("event", "call_click", params);
    w.gtag?.("event", "generate_lead", { ...params, currency: "USD", value: 0 });

    // GTM-compatible mirror, in case a container is added later.
    w.dataLayer?.push({ event: "call_click", ...params });
  } catch {
    // Analytics must never break the call path.
  }
}

function emit(eventName: string, params: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  try {
    const w = window as TrackingWindow;
    w.gtag?.("event", eventName, params);
    w.dataLayer?.push({ event: eventName, ...params });
  } catch {
    /* never break the UI for analytics */
  }
}

/**
 * A visitor asked to see the listed company's own number. This is the call we
 * do NOT get paid for, so the reveal rate versus `call_click` is the honest
 * measure of how much the listing pages leak.
 */
export function trackListingPhoneReveal(
  businessSlug: string,
  city?: string,
  state?: string
): void {
  emit("listing_phone_reveal", { business_slug: businessSlug, call_city: city, call_state: state });
}

/** The revealed number was actually dialled — a confirmed leak. */
export function trackListingPhoneClick(
  businessSlug: string,
  city?: string,
  state?: string
): void {
  emit("listing_phone_click", { business_slug: businessSlug, call_city: city, call_state: state });
}
