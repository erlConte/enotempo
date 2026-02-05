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
    <div className="menu-container">
      {items.map((item, idx) => (
        <div key={idx} className="menu-item">
          <div className="flex-1">
            <span className="font-semibold">{item.course} </span>
            <span>{item.dish}</span>
          </div>
          {item.wine && (
            <span className="wine-pairing ml-4 flex-shrink-0 whitespace-nowrap">
              {item.wine}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
