/**
 * Water damage restoration cost model.
 *
 * Every figure here is a national range, not a quote. The structure follows the
 * IICRC S500 standard that restoration firms actually price against — water
 * *category* (how contaminated) and water *class* (how much material is wet and
 * how hard it is to dry) — so the output lines up with the way a real estimate
 * is broken down.
 *
 * Ranges are deliberately wide and are consistent with the national figures
 * already published across the site's city pages: minor cleanup roughly
 * $450–$1,500, moderate $1,500–$5,000, major $5,000–$15,000+.
 *
 * The point of the tool is not to replace an estimate. It is to give a
 * homeowner a defensible number *before* a contractor quotes them, which is
 * the moment they most want to talk to someone.
 */

export interface Range {
  low: number;
  high: number;
}

export type WaterCategory = "clean" | "gray" | "black";
export type WaterClass = "class1" | "class2" | "class3" | "class4";

export interface CostInputs {
  squareFeet: number;
  category: WaterCategory;
  waterClass: WaterClass;
  mouldVisible: boolean;
  hardwoodAffected: boolean;
  ceilingAffected: boolean;
  contentsAffected: boolean;
  afterHours: boolean;
}

export interface LineItem {
  label: string;
  detail: string;
  range: Range;
}

export interface CostEstimate {
  total: Range;
  lines: LineItem[];
  /** Plain-language severity band, matching the site's cost tables. */
  band: "Minor" | "Moderate" | "Major";
}

/** Mitigation rate per square foot — drying equipment, labour, monitoring. */
const CLASS_RATE: Record<WaterClass, Range> = {
  class1: { low: 3.0, high: 4.5 },
  class2: { low: 4.0, high: 7.0 },
  class3: { low: 6.0, high: 9.5 },
  class4: { low: 7.5, high: 13.0 },
};

/**
 * Contamination multiplier. Category 3 ("black") water means porous materials
 * get removed rather than dried, plus antimicrobial treatment and disposal.
 */
const CATEGORY_MULTIPLIER: Record<WaterCategory, number> = {
  clean: 1.0,
  gray: 1.35,
  black: 1.9,
};

/** Most firms have a minimum call-out, so tiny jobs don't scale to zero. */
const MINIMUM_JOB: Range = { low: 450, high: 900 };

export const CLASS_LABELS: Record<WaterClass, { name: string; help: string }> = {
  class1: {
    name: "Just a small patch",
    help: "Water touched part of one room. Little soaked in — mostly hard flooring, minimal wicking up walls.",
  },
  class2: {
    name: "A whole room",
    help: "Carpet and underlay are wet, and water has wicked up the walls less than about 24 inches.",
  },
  class3: {
    name: "Came from above",
    help: "Water came down from the ceiling or an upper floor. Walls, insulation and ceilings are saturated.",
  },
  class4: {
    name: "Into hard materials",
    help: "Hardwood, plaster, concrete or crawlspace involved — these need specialty drying and take much longer.",
  },
};

export const CATEGORY_LABELS: Record<WaterCategory, { name: string; help: string }> = {
  clean: {
    name: "Clean water",
    help: "Burst supply pipe, overflowing bath, rainwater, or a failed water heater. No sewage, no contamination.",
  },
  gray: {
    name: "Grey water",
    help: "Washing machine or dishwasher discharge, a toilet overflow without solids, or clean water left standing over 24 hours.",
  },
  black: {
    name: "Black water",
    help: "Sewage backup, ground flooding, or any water that has been standing more than about 48 hours. Porous materials usually have to be removed.",
  },
};

function scale(range: Range, factor: number): Range {
  return { low: range.low * factor, high: range.high * factor };
}

function add(a: Range, b: Range): Range {
  return { low: a.low + b.low, high: a.high + b.high };
}

function roundRange(range: Range): Range {
  const r = (n: number) => Math.round(n / 25) * 25;
  return { low: r(range.low), high: r(range.high) };
}

export function estimateCost(inputs: CostInputs): CostEstimate {
  const sqft = Math.max(1, Math.min(10000, inputs.squareFeet || 0));
  const lines: LineItem[] = [];

  // --- Core mitigation: extraction, drying equipment, daily monitoring ---
  const rate = CLASS_RATE[inputs.waterClass];
  const categoryFactor = CATEGORY_MULTIPLIER[inputs.category];
  let mitigation = scale(rate, sqft * categoryFactor);

  if (mitigation.low < MINIMUM_JOB.low) mitigation = { ...MINIMUM_JOB };

  lines.push({
    label: "Water removal & structural drying",
    detail: `${sqft.toLocaleString()} sq ft · ${CLASS_LABELS[inputs.waterClass].name.toLowerCase()} · ${CATEGORY_LABELS[inputs.category].name.toLowerCase()}`,
    range: roundRange(mitigation),
  });

  let total: Range = mitigation;

  // --- Contamination handling for grey and black water ---
  if (inputs.category !== "clean") {
    const sanitising: Range =
      inputs.category === "black"
        ? { low: sqft * 1.6 + 400, high: sqft * 3.2 + 1200 }
        : { low: sqft * 0.7 + 150, high: sqft * 1.5 + 500 };
    lines.push({
      label: "Antimicrobial treatment & disposal",
      detail:
        inputs.category === "black"
          ? "Category 3 water — porous materials removed, area sanitised, waste disposed of"
          : "Category 2 water — sanitising treatment and disposal of affected soft materials",
      range: roundRange(sanitising),
    });
    total = add(total, sanitising);
  }

  // --- Add-ons ---
  if (inputs.mouldVisible) {
    const mould: Range = { low: 1100, high: 3400 };
    lines.push({
      label: "Mould remediation",
      detail: "Containment, HEPA filtration, removal of affected material and clearance testing",
      range: mould,
    });
    total = add(total, mould);
  }

  if (inputs.hardwoodAffected) {
    const hardwood: Range = { low: sqft * 2.0, high: sqft * 4.5 };
    lines.push({
      label: "Hardwood floor drying or replacement",
      detail: "Mat drying systems where boards are salvageable, replacement where cupping is permanent",
      range: roundRange(hardwood),
    });
    total = add(total, hardwood);
  }

  if (inputs.ceilingAffected) {
    const ceiling: Range = { low: 350, high: 1800 };
    lines.push({
      label: "Ceiling & drywall repair",
      detail: "Cut-out, replacement board, tape, texture and paint",
      range: ceiling,
    });
    total = add(total, ceiling);
  }

  if (inputs.contentsAffected) {
    const contents: Range = { low: 500, high: 2500 };
    lines.push({
      label: "Contents pack-out & cleaning",
      detail: "Moving, storing, cleaning and returning furniture and belongings",
      range: contents,
    });
    total = add(total, contents);
  }

  if (inputs.afterHours) {
    const surcharge: Range = { low: total.low * 0.1, high: total.high * 0.2 };
    lines.push({
      label: "Emergency call-out",
      detail: "Nights, weekends and holidays typically carry a 10–20% premium",
      range: roundRange(surcharge),
    });
    total = add(total, surcharge);
  }

  const rounded = roundRange(total);
  const midpoint = (rounded.low + rounded.high) / 2;
  const band: CostEstimate["band"] =
    midpoint < 1500 ? "Minor" : midpoint < 5000 ? "Moderate" : "Major";

  return { total: rounded, lines, band };
}

export function formatUsd(n: number): string {
  return `$${Math.round(n).toLocaleString("en-US")}`;
}

export function formatRange(range: Range): string {
  return `${formatUsd(range.low)} – ${formatUsd(range.high)}`;
}
