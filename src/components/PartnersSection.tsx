import React from "react";

const PartnersSection = () => {
  return (
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
        <h2 className="text-3xl sm:text-4xl font-bold text-white text-center mb-4">
          Sobre a AngoHost
        </h2>
        <div className="w-16 h-1 bg-[#FABB05] rounded-full mx-auto mb-6"></div>
        <p className="text-white text-center max-w-2xl mb-10">
          A AngoHost é uma empresa angolana autorizada pela autoridade do CCTLDA.AO (DNS.AO), especializada em hospedagem web, e-mail corporativo e soluções digitais. Oferecemos infraestrutura moderna, suporte técnico 24/7 e total confiança para o crescimento do seu negócio.
        </p>
      </div>
    </section>
  );
};

export default PartnersSection;
