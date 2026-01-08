export default function Footer() {
  return (
    <footer className="bg-marrone-scuro text-crema py-12 mt-auto border-t border-marrone-scuro/20">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto text-center">
          <p className="font-serif text-2xl mb-4 font-bold">EnoTempo</p>
          <p className="text-sm opacity-80 mb-2">
            © {new Date().getFullYear()} EnoTempo. Tutti i diritti riservati.
          </p>
          <p className="text-xs opacity-60">
            Le somme versate sul sito sono donazioni volontarie collegate ad attività associative.
          </p>
        </div>
      </div>
    </footer>
  );
}

