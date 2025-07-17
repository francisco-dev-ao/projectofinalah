import React from "react";

const clientLogos = [
  { src: "aldeianova.jpg", alt: "Aldeia Nova" },
  { src: "areportointernacional.png", alt: "Dr. António Agostinho Neto" },
  { src: "clinicacatondo.png", alt: "Clínica Girassol" },
  { src: "clinicagiralsol.png", alt: "Clínica" },
  { src: "farmaciasdecoimbra.png", alt: "Empresa" },
  { src: "grupozahara.png", alt: "Grupo Zahara" },
  { src: "isptec.png", alt: "ISPTEC" },
  { src: "kero.png", alt: "Kero" },
  { src: "mstelecom.png", alt: "MSTelcom" },
  { src: "images.png", alt: "SonaGás" },
  { src: "newcare.jpeg", alt: "Newcare" },
  { src: "redegirassol.jpeg", alt: "Rede Girassol" },
  { src: "somil.png", alt: "Somiluana" },
  { src: "sonair.png", alt: "Sonair" },
  { src: "Sonangol_Logo_Horizontal_Preto4_Footer-2.png", alt: "Sonangol Distribuidora" },
  { src: "Sonangol_Distribuidora.png", alt: "Sonangol" },
  { src: "pazflor.png", alt: "Centro Cultural Paz Flor" },
  { src: "ding.png", alt: "Dinge" },
  { src: "epal.png", alt: "Centro Cultural Paz Flor" },
  { src: "ispetsoyo.png", alt: "ispetsoyo" },
  { src: "porto.png", alt: "porto de cabinda" },
  { src: "logo.jpg", alt: "UGO" },
  { src: "mabo.png", alt: "mabo" },
  { src: "gipsa.png", alt: "gipsa " },
  { src: "techkllook.png", alt: "Techlook" },
];

const TrustpilotAndClientsSection = () => (
  <section className="py-16 bg-white relative overflow-hidden">
    {/* Elementos decorativos de fundo */}
    <div className="absolute inset-0 pointer-events-none">
      {/* Bola grande no canto superior esquerdo */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-blue-100 rounded-full opacity-60"></div>
      {/* Gota no canto superior direito */}
      <div className="absolute top-20 right-20 w-24 h-32 bg-blue-50 rounded-[50%_50%_50%_50%/60%_40%_60%_40%] opacity-70"></div>
      {/* Bola média no meio esquerdo */}
      <div className="absolute top-1/3 left-5 w-20 h-20 bg-blue-200 rounded-full opacity-50"></div>
      {/* Gota pequena no meio direito */}
      <div className="absolute top-1/2 right-10 w-16 h-20 bg-blue-100 rounded-[50%_50%_50%_50%/60%_40%_60%_40%] opacity-60"></div>
      {/* Bola pequena no canto inferior esquerdo */}
      <div className="absolute bottom-20 left-20 w-16 h-16 bg-blue-50 rounded-full opacity-70"></div>
      {/* Gota no canto inferior direito */}
      <div className="absolute bottom-10 right-5 w-20 h-24 bg-blue-100 rounded-[50%_50%_50%_50%/60%_40%_60%_40%] opacity-50"></div>
    </div>
    
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
      {/* Logos dos Clientes */}
      <h2 className="text-2xl sm:text-3xl font-bold text-center text-black mb-8">
        Empresas que confiam na AngoHost
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {clientLogos.map((logo, idx) => (
          <div
            key={idx}
            className="flex items-center justify-center p-4 h-28 border border-gray-100"
            title={logo.alt}
          >
            <img
              src={logo.src}
              alt={logo.alt}
              className="max-h-16 object-contain"
              loading="lazy"
            />
          </div>
        ))}
      </div>
      
      {/* Avaliações Trustpilot customizadas */}
      <div className="mt-12 flex flex-col items-center">
        <div className="text-lg text-black mb-2">
          4.8/5 em mais de 1000 avaliações no Trustpilot
        </div>
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#FABB05" strokeWidth="2" viewBox="0 0 24 24" width="24" height="24">
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
          </svg>
          <a
            href="https://pt.trustpilot.com/review/angohost.ao"
            target="_blank"
            rel="noopener noreferrer"
            className="text-black font-medium hover:underline"
          >
            Ver todas as avaliações &rsaquo;
          </a>
        </div>
      </div>
    </div>
  </section>
);

export default TrustpilotAndClientsSection;
