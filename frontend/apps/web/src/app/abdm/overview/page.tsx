import { redirect } from "next/navigation";

export default function AbdmOverviewPage() {
  redirect("/abdm?tab=overview");
}
