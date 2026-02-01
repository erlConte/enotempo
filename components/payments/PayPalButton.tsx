"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    paypal?: {
      Buttons: (config: {
        createOrder: (data: unknown, actions: unknown) => Promise<string>;
        onApprove: (data: { orderID: string }, actions: unknown) => Promise<void>;
        style?: { layout?: string; color?: string };
      }) => { render: (selector: string | HTMLElement) => Promise<void> };
    };
  }
}

interface PayPalButtonProps {
  reservationId: string;
  onSuccess: () => void;
  onError?: (message: string) => void;
}

export default function PayPalButton({ reservationId, onSuccess, onError }: PayPalButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [scriptError, setScriptError] = useState<string | null>(null);
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

  useEffect(() => {
    if (!clientId) {
      setScriptError("PayPal non configurato (NEXT_PUBLIC_PAYPAL_CLIENT_ID mancante)");
      setLoading(false);
      return;
    }

    if (window.paypal && containerRef.current?.children.length) {
      setLoading(false);
      return;
    }

    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=EUR&intent=capture`;
    script.async = true;
    script.onload = () => {
      if (!window.paypal || !containerRef.current) {
        setLoading(false);
        return;
      }
      window.paypal
        .Buttons({
          createOrder: async () => {
            const res = await fetch("/api/payments/paypal/create-order", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({ reservationId }),
            });
            const data = (await res.json()) as { orderId?: string; error?: string };
            if (!res.ok || !data.orderId) {
              throw new Error(data.error ?? "Errore creazione ordine");
            }
            return data.orderId;
          },
          onApprove: async (data: { orderID: string }) => {
            const res = await fetch("/api/payments/paypal/capture", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({ reservationId, orderId: data.orderID }),
            });
            const result = (await res.json()) as { ok?: boolean; error?: string };
            if (!res.ok || !result.ok) {
              onError?.(result.error ?? "Pagamento non completato");
              return;
            }
            onSuccess();
          },
          style: { layout: "vertical", color: "gold" },
        })
        .render(containerRef.current)
        .catch(() => setScriptError("Impossibile caricare il pulsante PayPal"))
        .finally(() => setLoading(false));
    };
    script.onerror = () => {
      setScriptError("Impossibile caricare PayPal");
      setLoading(false);
    };
    document.body.appendChild(script);
    return () => {
      script.remove();
    };
  }, [clientId, reservationId, onSuccess, onError]);

  if (scriptError) {
    return (
      <p className="text-borgogna font-medium rounded-xl bg-borgogna/10 p-4">
        {scriptError}
      </p>
    );
  }

  return (
    <div className="min-h-[120px] flex items-center justify-center">
      {loading && (
        <p className="text-marrone-scuro/80">Caricamento PayPal...</p>
      )}
      <div ref={containerRef} className="min-w-[200px]" />
    </div>
  );
}
