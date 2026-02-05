"use client";

interface SeatsProgressBarProps {
  remainingSeats: number;
  capacity: number;
  className?: string;
}

/**
 * Componente barra di progresso per mostrare i posti disponibili.
 * Crea un senso di urgenza quando i posti sono limitati.
 */
export default function SeatsProgressBar({
  remainingSeats,
  capacity,
  className = "",
}: SeatsProgressBarProps) {
  const bookedSeats = capacity - remainingSeats;
  const percentage = (bookedSeats / capacity) * 100;
  const isLow = remainingSeats <= capacity * 0.2; // Meno del 20% disponibile
  const isMedium = remainingSeats <= capacity * 0.5; // Meno del 50% disponibile

  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm md:text-base font-semibold text-marrone-scuro/90">
          Posti disponibili
        </span>
        <span
          className={`text-sm md:text-base font-bold ${
            isLow ? "text-red-600" : isMedium ? "text-orange-600" : "text-borgogna"
          }`}
        >
          {remainingSeats} / {capacity}
        </span>
      </div>
      <div className="w-full h-3 bg-marrone-scuro/10 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ${
            isLow
              ? "bg-gradient-to-r from-red-500 to-red-600"
              : isMedium
              ? "bg-gradient-to-r from-orange-500 to-orange-600"
              : "bg-gradient-to-r from-borgogna to-borgogna/80"
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {isLow && (
        <p className="text-xs md:text-sm text-red-600 font-medium mt-2 animate-pulse">
          ⚠️ Ultimi posti disponibili!
        </p>
      )}
    </div>
  );
}
