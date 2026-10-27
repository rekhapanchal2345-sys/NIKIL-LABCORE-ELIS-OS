import { redirect } from "next/navigation";

export default function AbdmSimulatorPage() {
  redirect("/abdm?tab=simulator");
}
