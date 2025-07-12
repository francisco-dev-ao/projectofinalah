import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const CallToActionSection = () => {
  return (
    <>
      <section className="relative py-20 bg-[#273d74] overflow-hidden">
        {/* Forma decorativa à direita */}
        <div className="absolute right-0 top-0 h-full w-1/3 pointer-events-none hidden md:block">
          <svg width="100%" height="100%" viewBox="0 0 400 400" fill="none">
            <path
              d="M400,200 Q350,100 250,150 Q150,200 200,300 Q250,400 350,350 Q400,300 400,200 Z"
              fill="#365f95"
              opacity="0.4"
            />
          </svg>
        </div>
        {/* Forma decorativa à esquerda */}
        <div className="absolute left-0 bottom-0 h-40 w-40 pointer-events-none hidden md:block">
          <svg width="100%" height="100%" viewBox="0 0 160 160" fill="none">
            <ellipse cx="80" cy="80" rx="80" ry="80" fill="#2563eb" opacity="0.4" />
          </svg>
        </div>
        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center">
          <div className="max-w-4xl mx-auto text-center text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Pronto para Iniciar o Seu Projeto Online?
            </h2>
            <p className="text-xl mb-8 text-white/80">
              Junte-se a milhares de negócios angolanos que confiam na AngoHost para os seus projetos web.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/dominios">
                <Button size="lg" variant="secondary">
                  Verificar Domínios
                </Button>
              </Link>
              <Link to="/hospedagem">
                <Button size="lg" variant="outline" className="bg-white text-primary hover:bg-white/90">
                  Ver Planos de Hospedagem
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default CallToActionSection;
