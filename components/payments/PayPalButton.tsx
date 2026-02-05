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
  /** Chiamato prima di create-order (es. salva form checkout). Se lancia, onError viene usato. */
  beforeCreateOrder?: () => Promise<void>;
}

export default function PayPalButton({ reservationId, onSuccess, onError, beforeCreateOrder }: PayPalButtonProps) {
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

    // Se PayPal è già caricato e il container ha già pulsanti, non ricaricare
    if (window.paypal && containerRef.current?.children.length) {
      setLoading(false);
      return;
    }

    // Rimuovi eventuali script PayPal esistenti prima di crearne uno nuovo
    const existingScript = document.querySelector('script[src*="paypal.com/sdk"]');
    if (existingScript) {
      existingScript.remove();
    }

    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=EUR&intent=capture`;
    script.async = true;
    script.onload = () => {
      if (!window.paypal) {
        setScriptError("PayPal SDK non disponibile dopo il caricamento");
        setLoading(false);
        return;
      }
      if (!containerRef.current) {
        setLoading(false);
        return;
      }

      // Pulisci il container prima di renderizzare
      containerRef.current.innerHTML = "";

      try {
        window.paypal
          .Buttons({
            createOrder: async () => {
              try {
                if (beforeCreateOrder) {
                  try {
                    await beforeCreateOrder();
                  } catch (e) {
                    const msg = e instanceof Error ? e.message : "Salvataggio dati fallito";
                    setScriptError(msg);
                    onError?.(msg);
                    throw new Error(msg);
                  }
                }
                const res = await fetch("/api/payments/paypal/create-order", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  credentials: "include",
                  body: JSON.stringify({ reservationId }),
                });
                const data = (await res.json()) as { orderId?: string; error?: string };
                if (res.status === 503 && data.error === "PAYPAL_NOT_CONFIGURED") {
                  const errorMsg = "Pagamento non disponibile. Riprova più tardi.";
                  setScriptError(errorMsg);
                  onError?.(errorMsg);
                  throw new Error("PAYPAL_NOT_CONFIGURED");
                }
                if (!res.ok || !data.orderId) {
                  const errorMsg = data.error ?? "Errore creazione ordine";
                  setScriptError(errorMsg);
                  onError?.(errorMsg);
                  throw new Error(errorMsg);
                }
                return data.orderId;
              } catch (err) {
                const msg = err instanceof Error ? err.message : "Errore creazione ordine PayPal";
                setScriptError(msg);
                onError?.(msg);
                throw err;
              }
            },
            onApprove: async (data: { orderID: string }) => {
              try {
                const res = await fetch("/api/payments/paypal/capture", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  credentials: "include",
                  body: JSON.stringify({ reservationId, orderId: data.orderID }),
                });
                const result = (await res.json()) as { ok?: boolean; error?: string };
                if (res.status === 409 && result.error === "SOLD_OUT") {
                  const errorMsg = "Evento esaurito. Non ci sono più posti disponibili.";
                  setScriptError(errorMsg);
                  onError?.(errorMsg);
                  return;
                }
                if (res.status === 503 && result.error === "PAYPAL_NOT_CONFIGURED") {
                  const errorMsg = "Pagamento non disponibile. Riprova più tardi.";
                  setScriptError(errorMsg);
                  onError?.(errorMsg);
                  return;
                }
                if (!res.ok || !result.ok) {
                  const errorMsg = result.error ?? "Pagamento non completato";
                  setScriptError(errorMsg);
                  onError?.(errorMsg);
                  return;
                }
                onSuccess();
              } catch (err) {
                const msg = err instanceof Error ? err.message : "Errore durante il pagamento";
                setScriptError(msg);
                onError?.(msg);
              }
            },
            style: { layout: "vertical", color: "gold" },
          })
          .render(containerRef.current)
          .catch((err: unknown) => {
            const msg = err instanceof Error ? err.message : "Errore sconosciuto";
            setScriptError(`Impossibile caricare il pulsante PayPal: ${msg}`);
            onError?.(msg);
          })
          .finally(() => setLoading(false));
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Errore inizializzazione PayPal";
        setScriptError(msg);
        setLoading(false);
      }
    };
    script.onerror = () => {
      setScriptError("Impossibile caricare lo script PayPal. Verifica la connessione.");
      setLoading(false);
    };
    document.body.appendChild(script);
    return () => {
      script.remove();
    };
  }, [clientId, reservationId, onSuccess, onError, beforeCreateOrder]);

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
