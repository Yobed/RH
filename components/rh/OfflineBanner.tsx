"use client";

import { useEffect, useState } from "react";
import { WifiNone, WifiHigh, X } from "@phosphor-icons/react";

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const [reconnected, setReconnected] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    function onOnline() {
      setIsOffline(false);
      setReconnected(true);
      setDismissed(false);
      setTimeout(() => setReconnected(false), 4000);
    }
    function onOffline() {
      setIsOffline(true);
      setReconnected(false);
      setDismissed(false);
    }
    setIsOffline(!navigator.onLine);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  if (dismissed) return null;
  if (!isOffline && !reconnected) return null;

  if (reconnected) {
    return (
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full bg-emerald-600 text-white px-4 py-2 shadow-lg text-sm font-medium animate-in fade-in slide-in-from-bottom-2">
        <WifiHigh weight="bold" className="h-4 w-4" />
        Connexion rétablie
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-amber-500 text-white">
      <div className="flex items-center justify-between px-4 py-2.5 max-w-screen-xl mx-auto">
        <div className="flex items-center gap-2.5">
          <WifiNone weight="bold" className="h-4 w-4 shrink-0" />
          <p className="text-sm font-medium">
            Mode hors ligne — Certaines fonctionnalités sont limitées. Les données seront synchronisées à la reconnexion.
          </p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="ml-4 shrink-0 p-1 rounded hover:bg-amber-600 transition-colors"
          aria-label="Fermer"
        >
          <X className="h-4 w-4" weight="bold" />
        </button>
      </div>
    </div>
  );
}
