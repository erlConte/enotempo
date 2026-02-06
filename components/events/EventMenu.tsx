interface EventMenuProps {
  items: Array<{
    course: string;
    dish: string;
    wine?: string;
  }>;
}

/**
 * Componente Menu per evento - layout a due colonne senza box.
 * Portate a sinistra, vini abbinati a destra.
 */
export default function EventMenu({ items }: EventMenuProps) {
  if (!items || items.length === 0) return null;

  return (
    <div className="menu-list-container">
      {items.map((item, idx) => (
        <div key={idx} className="menu-row">
          <div className="course-title">
            {item.course} {item.dish}
          </div>
          {item.wine && (
            <div className="wine-pairing">
              {item.wine}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
