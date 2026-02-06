interface EventMenuProps {
  items: Array<{
    course: string;
    dish: string;
    wine?: string;
  }>;
}

/**
 * Componente Menu per evento - stile ristorante con card interattive.
 * Mostra elenco piatti con nome piatto a sinistra e vino abbinato a destra.
 */
export default function EventMenu({ items }: EventMenuProps) {
  if (!items || items.length === 0) return null;

  return (
    <div className="menu-card-container">
      {items.map((item, idx) => (
        <div key={idx} className="menu-card">
          <div className="course-title">
            {item.course} {item.dish}
          </div>
          {item.wine && (
            <div className="wine-pairing">
              Abbinamento vino: {item.wine}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
