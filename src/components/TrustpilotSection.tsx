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
  <section className="py-16 bg-white">
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      {/* Avaliações Trustpilot customizadas */}
      <div className="mb-12 flex flex-col items-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-center text-black mb-2">
          Clientes Satisfeitos
        </h2>
        <div className="flex gap-1 mb-2">
          {[...Array(5)].map((_, i) => (
            <svg key={i} xmlns="http://www.w3.org/2000/svg" fill="#FABB05" viewBox="0 0 24 24" width="32" height="32">
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
            </svg>
          ))}
        </div>
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
      {/* Logos dos Clientes */}
      <h2 className="text-2xl sm:text-3xl font-bold text-center text-black mb-8">
        Empresas que confiam na AngoHost
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {clientLogos.map((logo, idx) => (
          <div
            key={idx}
            className="flex items-center justify-center bg-gray-50 rounded-lg shadow p-4 h-28 transition-transform duration-200 hover:scale-105 hover:shadow-lg cursor-pointer"
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
    </div>
  </section>
);

export default TrustpilotAndClientsSection;
