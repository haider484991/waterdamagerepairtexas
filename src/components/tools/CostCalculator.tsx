"use client";

import { useMemo, useState } from "react";
import { Phone, Info } from "lucide-react";
import { CallLink } from "@/components/CallLink";
import { HELPLINE_DISPLAY } from "@/lib/call-tracking";
import {
  estimateCost,
  formatRange,
  formatUsd,
  CLASS_LABELS,
  CATEGORY_LABELS,
  type WaterCategory,
  type WaterClass,
} from "@/lib/cost-model";

const AREA_PRESETS = [
  { label: "Small bathroom", sqft: 40 },
  { label: "Bedroom", sqft: 150 },
  { label: "Living room", sqft: 320 },
  { label: "Basement", sqft: 800 },
  { label: "Whole floor", sqft: 1400 },
];

interface ToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}

function Toggle({ checked, onChange, label }: ToggleProps) {
  return (
    <label className="flex items-center gap-3 p-3 rounded-lg border bg-card cursor-pointer hover:border-primary/40 transition-colors">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 accent-blue-600"
      />
      <span className="text-sm font-medium">{label}</span>
    </label>
  );
}

export function CostCalculator({ cityName }: { cityName?: string }) {
  const [squareFeet, setSquareFeet] = useState(320);
  const [category, setCategory] = useState<WaterCategory>("clean");
  const [waterClass, setWaterClass] = useState<WaterClass>("class2");
  const [mouldVisible, setMouldVisible] = useState(false);
  const [hardwoodAffected, setHardwoodAffected] = useState(false);
  const [ceilingAffected, setCeilingAffected] = useState(false);
  const [contentsAffected, setContentsAffected] = useState(false);
  const [afterHours, setAfterHours] = useState(false);

  const estimate = useMemo(
    () =>
      estimateCost({
        squareFeet,
        category,
        waterClass,
        mouldVisible,
        hardwoodAffected,
        ceilingAffected,
        contentsAffected,
        afterHours,
      }),
    [squareFeet, category, waterClass, mouldVisible, hardwoodAffected, ceilingAffected, contentsAffected, afterHours]
  );

  return (
    <div className="grid lg:grid-cols-[1fr_400px] gap-8 items-start">
      {/* ---- Inputs ---- */}
      <div className="space-y-8">
        <fieldset>
          <legend className="text-base font-bold mb-1">How big is the wet area?</legend>
          <p className="text-sm text-muted-foreground mb-3">
            Rough floor area that got wet, in square feet.
          </p>
          <div className="flex items-center gap-3 mb-3">
            <input
              type="range"
              min={20}
              max={2500}
              step={10}
              value={Math.min(squareFeet, 2500)}
              onChange={(e) => setSquareFeet(Number(e.target.value))}
              className="flex-1 accent-blue-600"
              aria-label="Affected area in square feet"
            />
            <div className="flex items-center gap-1.5 shrink-0">
              <input
                type="number"
                min={1}
                max={10000}
                value={squareFeet}
                onChange={(e) => setSquareFeet(Number(e.target.value))}
                className="w-24 px-3 py-2 rounded-lg border bg-card text-right font-mono tabular-nums"
                aria-label="Affected area in square feet, exact"
              />
              <span className="text-sm text-muted-foreground">sq ft</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {AREA_PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => setSquareFeet(p.sqft)}
                className={`px-3 py-1.5 rounded-full border text-sm transition-colors ${
                  squareFeet === p.sqft
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card hover:border-primary/40"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-base font-bold mb-1">What kind of water is it?</legend>
          <p className="text-sm text-muted-foreground mb-3">
            This is the single biggest driver of cost — contaminated water means materials get
            removed rather than dried.
          </p>
          <div className="grid sm:grid-cols-3 gap-3">
            {(Object.keys(CATEGORY_LABELS) as WaterCategory[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setCategory(key)}
                aria-pressed={category === key}
                className={`text-left p-4 rounded-lg border-2 transition-colors ${
                  category === key
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card hover:border-primary/40"
                }`}
              >
                <span className="block font-semibold mb-1">{CATEGORY_LABELS[key].name}</span>
                <span className="block text-xs text-muted-foreground leading-relaxed">
                  {CATEGORY_LABELS[key].help}
                </span>
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-base font-bold mb-1">How far did it spread?</legend>
          <p className="text-sm text-muted-foreground mb-3">
            The more material that is soaked, the more drying equipment and days it takes.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {(Object.keys(CLASS_LABELS) as WaterClass[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setWaterClass(key)}
                aria-pressed={waterClass === key}
                className={`text-left p-4 rounded-lg border-2 transition-colors ${
                  waterClass === key
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card hover:border-primary/40"
                }`}
              >
                <span className="block font-semibold mb-1">{CLASS_LABELS[key].name}</span>
                <span className="block text-xs text-muted-foreground leading-relaxed">
                  {CLASS_LABELS[key].help}
                </span>
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-base font-bold mb-3">Anything else involved?</legend>
          <div className="grid sm:grid-cols-2 gap-3">
            <Toggle checked={mouldVisible} onChange={setMouldVisible} label="I can see or smell mould" />
            <Toggle checked={hardwoodAffected} onChange={setHardwoodAffected} label="Hardwood flooring is wet" />
            <Toggle checked={ceilingAffected} onChange={setCeilingAffected} label="Ceiling or drywall damaged" />
            <Toggle checked={contentsAffected} onChange={setContentsAffected} label="Furniture and belongings affected" />
            <Toggle checked={afterHours} onChange={setAfterHours} label="Need someone tonight / weekend" />
          </div>
        </fieldset>
      </div>

      {/* ---- Result ---- */}
      <aside className="lg:sticky lg:top-6 space-y-4">
        <div className="rounded-xl border-2 border-primary/30 bg-card overflow-hidden">
          <div className="p-6 bg-primary/5 border-b">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
              Estimated cost{cityName ? ` in ${cityName}` : ""}
            </p>
            <p className="text-3xl font-bold tabular-nums leading-tight">
              {formatRange(estimate.total)}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {estimate.band} damage &middot; national range, before insurance
            </p>
          </div>

          <div className="p-6 space-y-3">
            {estimate.lines.map((line) => (
              <div key={line.label} className="flex items-start justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <p className="font-medium">{line.label}</p>
                  <p className="text-xs text-muted-foreground leading-snug">{line.detail}</p>
                </div>
                <p className="tabular-nums whitespace-nowrap text-muted-foreground">
                  {formatUsd(line.range.low)}&ndash;{formatUsd(line.range.high)}
                </p>
              </div>
            ))}
          </div>

          {/* The conversion moment: they now have a number and want to know if
              it is right for their actual situation. */}
          <div className="p-6 pt-0">
            <CallLink
              placement="cost_calculator_result"
              context={cityName ? { city: cityName } : undefined}
              className="flex items-center justify-center gap-2 w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md shadow-blue-600/20"
            >
              <Phone className="w-5 h-5" />
              <span className="text-lg">{HELPLINE_DISPLAY}</span>
            </CallLink>
            <p className="text-xs text-center text-muted-foreground mt-2.5 leading-relaxed">
              Get a real quote for your situation. Free 24/7 &mdash; we connect you with a vetted
              local pro. Referral line, we may be paid by the pro you&apos;re matched with.
            </p>
          </div>
        </div>

        <div className="flex gap-2.5 p-4 rounded-lg bg-muted/50 border text-xs text-muted-foreground leading-relaxed">
          <Info className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
          <p>
            These are national ranges based on IICRC water categories and classes, the same
            framework restoration firms estimate against. Actual prices vary by region, access and
            how long the water sat. Always get at least three itemised quotes.
          </p>
        </div>
      </aside>
    </div>
  );
}
