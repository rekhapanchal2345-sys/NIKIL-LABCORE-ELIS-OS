import test from "node:test";
import assert from "node:assert/strict";
import {
  formatCleanUhid,
  formatClinicalBloodGroup,
  formatDobWithAge,
  normalizeListField,
} from "./patient-form-utils";

test("formatCleanUhid prevents duplicate PAT-pat-001 prefix and preserves UHID format", () => {
  assert.equal(formatCleanUhid("pat-001"), "UHID-2026-0001");
  assert.equal(formatCleanUhid("PAT-pat-001"), "UHID-2026-0001");
  assert.equal(formatCleanUhid("pat-001", "UHID-2026-1001"), "UHID-2026-1001");
  assert.equal(formatCleanUhid("", null), "UHID-2026-1001");
});

test("formatClinicalBloodGroup formats serological codes with Rh factor", () => {
  assert.equal(formatClinicalBloodGroup("O_POSITIVE"), "O+ (Rh Positive)");
  assert.equal(formatClinicalBloodGroup("O+"), "O+ (Rh Positive)");
  assert.equal(formatClinicalBloodGroup("AB_NEGATIVE"), "AB- (Rh Negative)");
  assert.equal(formatClinicalBloodGroup(""), "—");
});

test("formatDobWithAge formats date and computes age accurately", () => {
  const res = formatDobWithAge("1968-04-12", 58);
  assert.equal(res.ageLabel, "58 Yrs");
  assert.ok(res.formattedDate.includes("1968"));
  assert.ok(res.combined.includes("58 Yrs"));
});

test("normalizeListField handles arrays, strings, and empty values", () => {
  assert.equal(normalizeListField(["Penicillin", "Sulfa"]), "Penicillin, Sulfa");
  assert.equal(normalizeListField([]), "None Reported");
  assert.equal(normalizeListField(null, "No Known Allergies"), "No Known Allergies");
});
