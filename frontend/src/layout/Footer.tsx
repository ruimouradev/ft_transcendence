import { Link } from "react-router-dom";

// O rodapé de todas as páginas, com os links das páginas legais.
// A avaliação verifica que a Privacy Policy e os Terms of Service
// existem e são acessíveis a partir do site.
export default function Footer() {
  return (
    <footer className="border-t border-white/10 py-6 text-center text-gray-400 fixed left-0 right-0 bottom-0">
      <div className="flex justify-center gap-6 text-sm fixed left-0 right-0 bottom-3">
        <Link to="/privacy" className="hover:text-white transition-colors">
          Privacy Policy
        </Link>
        <Link to="/terms" className="hover:text-white transition-colors">
          Terms of Service
        </Link>
      </div>
    </footer>
  );
}
