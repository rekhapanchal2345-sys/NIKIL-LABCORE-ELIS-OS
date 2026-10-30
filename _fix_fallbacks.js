// One-off script: replaces invented fallback values in PatientRegistrationSheet.tsx with a dash.
// Each replacement is applied only if the target text occurs exactly once (or exactly `n` times when stated).
const fs = require("fs");
const path = "frontend/apps/web/src/components/patients/PatientRegistrationSheet.tsx";
let src = fs.readFileSync(path, "utf8");
const eol = src.includes("\r\n") ? "\r\n" : "\n";
const D = "\u2014";
const nl = (s) => s.replace(/\n/g, eol);

const R = [
  ['return "58 Yrs";', 'return "' + D + '";'],
  ['patientData?.gender || "FEMALE"', 'patientData?.gender || "' + D + '"'],
  ['patientData?.bloodGroup || "O+ (Rh Positive)"', 'patientData?.bloodGroup || "' + D + '"'],
  ['bloodGroupMap[rawBlood] || rawBlood || "O+ (Rh Positive)"', 'bloodGroupMap[rawBlood] || rawBlood || "' + D + '"'],
  ['String(patientData?.phone || "+91 98250 11223").trim()', 'String(patientData?.phone || "").trim()'],
  ['const phone = rawPhone.startsWith("+") ? rawPhone :', 'const phone = !rawPhone ? "' + D + '" : rawPhone.startsWith("+") ? rawPhone :'],
  [': "rajeshwari.devi@example.com";', ': "' + D + '";'],
  [': "42 Kalyani Nagar, Pune";', ': "' + D + '";'],
  [': "Pune";', ': "' + D + '";'],
  [': "Maharashtra";', ': "' + D + '";'],
  [': "411006";', ': "' + D + '";'],
  ['patientData?.maritalStatus || "SINGLE"', 'patientData?.maritalStatus || "' + D + '"'],
  ['patientData?.patientType || patientData?.category || "REGULAR"', 'patientData?.patientType || patientData?.category || "' + D + '"'],
  [': "91-4821-7732-9910";', ': "' + D + '";'],
  [': "Walk-In / Outpatient Diagnostic & Clinical Consultation";', ': "' + D + '";'],
  [': "Authorized Family Member";', ': "' + D + '";'],
  [nl('String(patientData.emergencyContactPhone).trim()\n      : phone;'), nl('String(patientData.emergencyContactPhone).trim()\n      : "' + D + '";')],
  [': "Family";', ': "' + D + '";'],
  [': "Same as Patient";', ': "' + D + '";'],
  [': "Direct Self-Pay";', ': "' + D + '";'],
  [': "SELF-PAY";', ': "' + D + '";'],
  [': "N/A";', ': "' + D + '";'],
  [': "Active / Self";', ': "' + D + '";'],
  [': "Penicillin";', ': "None recorded";'],
  [': "None Reported at Intake";', ': "None recorded";', 2],
  [': "English";', ': "' + D + '";'],
  [': "SMS";', ': "' + D + '";'],
  [
    'const regDateDisplay = "29 Oct 2026";',
    'const regDateObj = patientData?.createdAt ? new Date(patientData.createdAt) : null;' + eol +
    '  const regValid = !!regDateObj && !isNaN(regDateObj.getTime());' + eol +
    '  const regDateDisplay = regValid ? regDateObj!.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "' + D + '";',
  ],
  [
    'const regTimeDisplay = "07:59 am";',
    'const regTimeDisplay = regValid ? regDateObj!.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "' + D + '";',
  ],
  [
    'const digits = phone.replace(/[^0-9]/g, "");',
    'const digits = phone.replace(/[^0-9]/g, "");' + eol +
    '    if (!digits) {' + eol +
    '      setNotice("No mobile number on record for this patient.");' + eol +
    '      return;' + eol +
    '    }',
  ],
  [
    nl('    setNotice(\n      `A4 Patient Registration Dossier PDF dispatched to ${email}`\n    );'),
    nl('    if (!email || email === "' + D + '") {\n      setNotice("No email address on record for this patient.");\n    } else {\n      setNotice(`Opening your mail app for ${email}. Attach the printed or saved PDF before sending.`);\n      if (typeof window !== "undefined") {\n        window.location.href = `mailto:${email}?subject=${encodeURIComponent("Patient registration details")}`;\n      }\n    }'),
  ],
];

let applied = 0;
for (const [from, to, expected] of R) {
  const want = expected || 1;
  const count = src.split(from).length - 1;
  if (count !== want) {
    console.log("SKIP (found " + count + ", expected " + want + "): " + from.slice(0, 70).replace(/\r?\n/g, " "));
    continue;
  }
  src = src.split(from).join(to);
  applied++;
  console.log("OK   : " + from.slice(0, 70).replace(/\r?\n/g, " "));
}
fs.writeFileSync(path, src, "utf8");
console.log("Applied " + applied + " of " + R.length);
