/**
 * Phlebotomy (specimen collection) helpers for the Orders module.
 * Tube classification follows the CLSI GP41 recommended order of draw.
 */

export interface SpecimenCollectionPayload {
  barcode: string;
  notes: string;
  collectionType: string;
  priority: string;
  location: string;
  sampleQuality: string;
  sampleVolume?: string;
}

export interface TubeGroup {
  key: string;
  label: string;
  cap: string;
  drawOrder: number;
  sampleType: string;
  tests: string[];
}

export function classifyTube(container?: string, sampleType?: string) {
  const c = (container || "").toLowerCase();
  const s = (sampleType || "").toLowerCase();

  if (c.includes("culture")) return { label: "Blood culture bottle", cap: "#64748B", drawOrder: 1 };
  if (c.includes("citrate") || c.includes("light blue") || c.includes("blue"))
    return { label: "Light blue (Sodium citrate)", cap: "#38BDF8", drawOrder: 2 };
  if (c.includes("sst") || c.includes("serum separator") || c.includes("gold"))
    return { label: "Gold (Serum separator)", cap: "#F59E0B", drawOrder: 3 };
  if (c.includes("red") || c.includes("plain") || c.includes("clot"))
    return { label: "Red (Plain / clot activator)", cap: "#EF4444", drawOrder: 3 };
  if (c.includes("heparin") || c.includes("green"))
    return { label: "Green (Heparin)", cap: "#10B981", drawOrder: 4 };
  if (c.includes("edta") || c.includes("lavender") || c.includes("purple"))
    return { label: "Lavender (EDTA)", cap: "#8B5CF6", drawOrder: 5 };
  if (c.includes("fluoride") || c.includes("grey") || c.includes("gray") || c.includes("oxalate"))
    return { label: "Grey (Fluoride / oxalate)", cap: "#64748B", drawOrder: 6 };
  if (c.includes("sterile") || c.includes("cup") || c.includes("container") || s.includes("urine") || s.includes("stool"))
    return { label: "Sterile container", cap: "#CA8A04", drawOrder: 7 };

  return { label: container || "Specimen container", cap: "#94A3B8", drawOrder: 8 };
}

export function buildTubeGroups(items: any[] = []): TubeGroup[] {
  const map = new Map<string, TubeGroup>();

  for (const item of items) {
    const test = item?.test;
    if (!test) continue; // package rows have no individual test / specimen
    const tube = classifyTube(test.sampleContainer, test.sampleType);
    const key = `${tube.label}|${test.sampleType || ""}`;
    const existing = map.get(key);
    const testLabel = test.testCode || test.testName;

    if (existing) {
      if (!existing.tests.includes(testLabel)) existing.tests.push(testLabel);
    } else {
      map.set(key, {
        key,
        label: tube.label,
        cap: tube.cap,
        drawOrder: tube.drawOrder,
        sampleType: test.sampleType || "—",
        tests: [testLabel],
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => a.drawOrder - b.drawOrder);
}

export const COLLECTION_TYPES = [
  { value: "WALK_IN", label: "In-house collection" },
  { value: "HOME_COLLECTION", label: "Home collection" },
];

export const COLLECTION_LOCATIONS = [
  "Phlebotomy Station",
  "OPD Collection Room",
  "IPD / Bedside",
  "Emergency Department",
  "Home Collection",
];

export const DRAW_SITES = [
  "Left antecubital vein",
  "Right antecubital vein",
  "Left hand (dorsal)",
  "Right hand (dorsal)",
  "Capillary (finger / heel)",
  "Not applicable (non-blood specimen)",
];

export const PATIENT_PREP = ["Fasting", "Non-fasting", "Not applicable"];

export const SPECIMEN_QUALITY = [
  "Adequate",
  "Haemolysed",
  "Lipaemic",
  "Icteric",
  "Clotted",
  "Insufficient volume",
];
