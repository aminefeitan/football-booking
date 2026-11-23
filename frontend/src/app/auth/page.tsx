"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get("redirect");

  useEffect(() => {
    const p = new URLSearchParams();
    if (redirectTarget) p.set("redirect", redirectTarget);
    const q = p.toString() ? `?${p.toString()}` : "";
    router.replace(`/login${q}`);
  }, [router, redirectTarget]);

  return (
    <div className="min-h-screen bg-nuit-pelouse flex items-center justify-center p-4">
      <p className="font-mono text-sm text-craie/60 uppercase tracking-widest animate-pulse">
        Redirection vers la connexion…
      </p>
    </div>
  );
}

export const dynamic = "force-dynamic";

export default function AuthPage() {
  return (
    <Suspense>
      <AuthContent />
    </Suspense>
  );
}
