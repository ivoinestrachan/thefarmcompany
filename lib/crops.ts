import type { Field } from "@/components/os/types";

/* A stable, readable palette for crop types. Each distinct crop name maps to
   one colour so plots of the same crop read the same across the map, legend,
   and sidebar. */
const PALETTE = [
  "#e0c020", // wheat gold
  "#c8663a", // clay
  "#7d9b6a", // leaf
  "#7fb2cf", // sky
  "#d19a66", // soil
  "#9b7fcf", // violet
  "#c94f7c", // berry
  "#4fd0a0", // mint
  "#e08a3c", // squash
  "#6f8f4f", // brassica
];

export const NO_CROP_COLOR = "#c9c4bb"; // fallow / no crop assigned

export function cropColor(crop: string): string {
  let h = 0;
  for (let i = 0; i < crop.length; i++) h = (h * 31 + crop.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

/** The crop currently on a plot: a growing planting wins, else the newest. */
export function primaryCrop(field: Field): string | null {
  const growing = field.plantings.find((p) => p.status === "growing");
  return (growing ?? field.plantings[0])?.crop ?? null;
}

/** Distinct crops across a set of fields, for the legend. */
export function cropLegend(fields: Field[]): { crop: string; color: string; plots: number }[] {
  const counts = new Map<string, number>();
  for (const f of fields) {
    const c = primaryCrop(f);
    if (c) counts.set(c, (counts.get(c) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([crop, plots]) => ({ crop, color: cropColor(crop), plots }));
}
