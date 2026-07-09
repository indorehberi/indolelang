"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RegisterBidderRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    router.push(token ? "/ekyc/upload" : "/register");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#F9F8F3]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-premium mx-auto mb-3"></div>
        <p className="text-body-sm text-on-surface-variant font-medium">Mengarahkan ke halaman pengajuan bidder...</p>
      </div>
    </div>
  );
}
