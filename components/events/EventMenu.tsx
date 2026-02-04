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
    <div className="space-y-6">
      {items.map((item, idx) => (
        <div key={idx} className="border-b border-marrone-scuro/10 pb-6 last:border-0 last:pb-0">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
            <div className="flex-1">
              <h4 className="font-serif text-lg md:text-xl font-semibold text-borgogna mb-1">
                {item.course}
              </h4>
              <p className="text-marrone-scuro/90 text-base md:text-lg leading-relaxed">
                {item.dish}
              </p>
            </div>
            {item.wine && (
              <div className="md:text-right md:min-w-[200px]">
                <p className="text-sm text-marrone-scuro/60 uppercase tracking-wide mb-1">Vino</p>
                <p className="text-marrone-scuro/80 text-sm md:text-base font-medium italic">
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
