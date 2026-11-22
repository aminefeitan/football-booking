"use client";

import { useEffect, useState } from "react";
import { API_BASE, getStoredToken } from "@/lib/api";

interface FieldPhotoProps {
  photoUrl?: string | null;
  alt: string;
  className?: string;
  fallbackClassName?: string;
}

export function FieldPhoto({ photoUrl, alt, className = "", fallbackClassName = "" }: FieldPhotoProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!photoUrl) {
      setObjectUrl(null);
      setHasError(false);
      return;
    }

    let isMounted = true;
    let createdUrl: string | null = null;

    async function loadPhoto() {
      setLoading(true);
      setHasError(false);
      try {
        const fullUrl = photoUrl!.startsWith("http") ? photoUrl! : `${API_BASE}${photoUrl!.replace(/^\/api\/v1/, "")}`;
        const token = getStoredToken();
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch(fullUrl, { headers });
        if (!res.ok) {
          throw new Error("Photo non disponible");
        }
        const blob = await res.blob();
        if (isMounted) {
          createdUrl = URL.createObjectURL(blob);
          setObjectUrl(createdUrl);
        }
      } catch {
        if (isMounted) {
          setHasError(true);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadPhoto();

    return () => {
      isMounted = false;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [photoUrl]);

  if (!photoUrl || hasError) {
    return (
      <div className={`flex items-center justify-center bg-encre/40 text-craie/30 font-mono text-xs uppercase ${className} ${fallbackClassName}`}>
        <span>⚽ Pas de photo</span>
      </div>
    );
  }

  if (loading && !objectUrl) {
    return (
      <div className={`flex items-center justify-center bg-encre/40 text-craie/30 font-mono text-xs animate-pulse ${className} ${fallbackClassName}`}>
        <span>Chargement...</span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={objectUrl!}
      alt={alt}
      className={`object-cover ${className}`}
    />
  );
}
