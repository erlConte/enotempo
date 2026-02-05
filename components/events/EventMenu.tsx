interface EventMenuProps {
  items: Array<{
    course: string;
    dish: string;
    wine?: string;
  }>;
}

/**
 * Componente Menu per evento - stile ristorante, NON form.
 * Mostra elenco piatti con eventuali vini abbinati.
 */
export default function EventMenu({ items }: EventMenuProps) {
  if (!items || items.length === 0) return null;

  return (
    <div className="space-y-6 menu-container">
      {items.map((item, idx) => (
        <div key={idx} className="border-b border-marrone-scuro/10 pb-6 last:border-0 last:pb-0 w-full menu-item">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 md:gap-6 w-full">
            <div className="flex-1">
              <h4 className="font-serif text-lg md:text-xl font-semibold text-borgogna mb-2">
                {item.course}
              </h4>
              <p className="text-marrone-scuro/90 text-base md:text-lg leading-relaxed font-light">
                {item.dish}
              </p>
            </div>
            {item.wine && (
              <div className="md:text-right md:min-w-[220px] md:flex-shrink-0">
                <p className="text-xs text-marrone-scuro/50 uppercase tracking-wider mb-2 font-medium">Vino</p>
                <p className="text-borgogna text-sm md:text-base font-semibold italic leading-relaxed wine-pairing">
                  {item.wine}
                </p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
