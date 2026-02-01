"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import PayPalButton from "@/components/payments/PayPalButton";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PayPalButtonWrapperProps {
  reservationId: string;
  locale: string;
}

export default function PayPalButtonWrapper({ reservationId, locale }: PayPalButtonWrapperProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const handleSuccess = () => {
    router.push(`/${locale}/conferma/${reservationId}`);
  };

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive" className="rounded-xl">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <PayPalButton
        reservationId={reservationId}
        onSuccess={handleSuccess}
        onError={setError}
      />
    </div>
  );
}
