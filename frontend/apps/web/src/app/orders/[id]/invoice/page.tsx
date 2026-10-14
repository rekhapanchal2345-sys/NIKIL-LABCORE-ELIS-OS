"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function OrderInvoiceRedirectPage({ params }: { params?: any }) {
  const router = useRouter();
  const routeParams = useParams();
  const orderId = (routeParams?.id as string) || (params && typeof params === "object" && "id" in params ? params.id : "");

  useEffect(() => {
    if (orderId) {
      router.replace(`/orders/${orderId}/receipt`);
    }
  }, [orderId, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <p className="text-xs font-bold text-slate-500">Redirecting to Order Receipt / Bill...</p>
    </div>
  );
}
