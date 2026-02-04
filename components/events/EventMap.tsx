interface EventMapProps {
  locationName: string;
  locationAddress: string | null;
}

/**
 * Componente Mappa Google Maps embed.
 * Mostra mappa interattiva per il luogo dell'evento.
 * Usa iframe con URL di ricerca (funziona senza API key).
 */
export default function EventMap({ locationName, locationAddress }: EventMapProps) {
  const query = locationAddress ? `${locationName}, ${locationAddress}` : locationName;
  const encodedQuery = encodeURIComponent(query);
  // Usa iframe con URL di ricerca Google Maps (funziona senza API key)
  const embedUrl = `https://www.google.com/maps?q=${encodedQuery}&output=embed`;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedQuery}`;

  return (
    <div className="w-full aspect-[16/9] rounded-xl overflow-hidden bg-marrone-scuro/10 relative">
      <iframe
        width="100%"
        height="100%"
        style={{ border: 0 }}
        loading="lazy"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
        src={embedUrl}
        title={`Mappa: ${locationName}`}
        className="absolute inset-0"
      />
      {/* Link overlay per aprire in nuova scheda */}
      <a
        href={mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-4 right-4 bg-white/90 hover:bg-white px-4 py-2 rounded-lg text-sm font-semibold text-borgogna shadow-md hover:shadow-lg transition-shadow"
      >
        Apri in Maps ↗
      </a>
    </div>
  );
}
