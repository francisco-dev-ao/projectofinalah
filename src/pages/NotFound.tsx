import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="flex flex-col md:flex-row items-center gap-12 w-full max-w-5xl mx-auto">
        <div className="flex-shrink-0">
          <img src="/404.gif" alt="404 - Página não encontrada" className="w-[320px] md:w-[380px] lg:w-[420px] rounded-xl shadow" />
        </div>
        <div className="flex-1 text-left">
          <h1 className="text-4xl md:text-5xl font-bold text-[#19508a] mb-4 leading-tight">Ops! Página Perdida no Espaço</h1>
          <p className="text-lg text-gray-700 mb-2">Parece que você encontrou um buraco negro digital! Esta página deve ter sido abduzida por alienígenas. <span role="img" aria-label="alien">🛸</span></p>
          <p className="text-lg text-gray-700 mb-8">Não se preocupe, nossa equipe de astronautas está investigando o caso.</p>
          <a href="/" className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-[#19508a] hover:bg-[#273d74] text-white font-bold text-base shadow transition-all">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Voltar para Terra (Página Inicial)
          </a>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
