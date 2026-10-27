import { redirect } from "next/navigation";

export default function AbdmVerifyPage() {
  redirect("/abdm?tab=abha-m1&mode=verify");
}
