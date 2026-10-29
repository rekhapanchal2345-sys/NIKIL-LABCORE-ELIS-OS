import { COLLECTION_LOCATIONS, type TubeGroup } from "./phlebotomy-draw-utils";
import type { CollectionDetails } from "./PhlebotomyDetailsForm";

export function initialDetails(order: any): CollectionDetails {
  const isHome = order?.collectionType === "HOME_COLLECTION";
  return {
    barcode: order?.barcode || "",
    collectionType: isHome ? "HOME_COLLECTION" : "WALK_IN",
    location: isHome ? "Home Collection" : COLLECTION_LOCATIONS[0],
    patientPrep: "Not applicable",
    drawSite: "Left antecubital vein",
    attempts: 1,
    volumeMl: "",
    quality: "Adequate",
    notes: "",
  };
}

/**
 * Backend stores one free-text `notes` field on the sample tracking event.
 * Structured draw details that have no dedicated column are recorded there.
 */
export function buildStructuredNotes(details: CollectionDetails, groups: TubeGroup[]): string {
  const tubeSummary = groups.map((g) => `${g.label} (${g.tests.join(", ")})`).join("; ");
  return [
    `Patient preparation: ${details.patientPrep}`,
    `Draw site: ${details.drawSite}`,
    `Draw attempts: ${details.attempts}`,
    tubeSummary ? `Specimens: ${tubeSummary}` : "",
    "Patient identity verified with two identifiers",
    details.notes.trim() ? `Remarks: ${details.notes.trim()}` : "",
  ]
    .filter(Boolean)
    .join(" | ");
}

export function getFooterHint(opts: {
  identityConfirmed: boolean;
  allTubesConfirmed: boolean;
  qualityNeedsNote: boolean;
}): string {
  if (!opts.identityConfirmed) return "Confirm both patient identifiers to continue.";
  if (!opts.allTubesConfirmed) return "Confirm every specimen as collected.";
  if (opts.qualityNeedsNote) return "Add a remark describing the quality issue.";
  return "Enter or scan the specimen barcode.";
}
