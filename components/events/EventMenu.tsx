interface EventMenuProps {
  items: Array<{
    course: string;
    dish: string;
    wine?: string;
  }>;
}

/**
 * Componente Menu per evento - stile ristorante con card interattive.
 * Mostra elenco piatti con eventuali vini abbinati in un layout a griglia.
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
              Wine pairing: {item.wine}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
