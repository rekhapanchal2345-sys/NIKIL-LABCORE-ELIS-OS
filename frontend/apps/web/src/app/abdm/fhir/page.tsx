import { redirect } from "next/navigation";

export default function AbdmFhirPage() {
  redirect("/abdm?tab=fhir-m3");
}
