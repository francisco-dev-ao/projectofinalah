import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

const slides = [
  {
    imagem: "/home.png",
    titulo: <><span>Potencialize sua</span><br /><span>Presença Online</span></>,
    descricao: <><span>Domínios .AO, hospedagem de alta performance</span><br /><span>e e-mail profissional. Tudo para o crescimento digital do seu negócio em Angola.</span></>,
    botao: {
      texto: "Registar Domínio",
      onClick: (navigate: any) => navigate("/dominios")
    }
  },
  {
    imagem: "/home.png",
    titulo: <><span>Hospedagem Web</span><br /><span>com Segurança</span></>,
    descricao: <><span>Servidores nacionais, SSL grátis</span><br /><span>e suporte 24/7 para o seu site nunca sair do ar.</span></>,
    botao: {
      texto: "Hospedagem",
      onClick: (navigate: any) => navigate("/hospedagem")
    }
  },
  {
    imagem: "/home.png",
    titulo: <><span>E-mail Profissional</span><br /><span>para Empresas</span></>,
    descricao: <><span>Transmita credibilidade com e-mails personalizados</span><br /><span>e recursos avançados.</span></>,
    botao: {
      texto: "E-mail Profissional",
      onClick: (navigate: any) => navigate("/email")
    }
  }
];

const HeroSection = () => {
  const navigate = useNavigate();
  const [imagemAtual, setImagemAtual] = useState(0);

  useEffect(() => {
    const intervalo = setInterval(() => {
      setImagemAtual((prev) => (prev + 1) % slides.length);
    }, 45000); // 45 segundos
    return () => clearInterval(intervalo);
  }, []);

  const slide = slides[imagemAtual];

  return (
    <section className="relative min-h-[600px] flex items-center overflow-hidden font-[Montserrat]" style={{fontFamily: 'Montserrat, sans-serif'}}>
      {/* Pontos do carrossel */}
      <div className="absolute bottom-6 right-8 z-20 flex items-center gap-2">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setImagemAtual(idx)}
            className={`w-3 h-3 transition-all duration-200 focus:outline-none ${imagemAtual === idx ? 'bg-white opacity-100 scale-110 shadow' : 'bg-white/60 opacity-60'}`}
            aria-label={`Ir para slide ${idx + 1}`}
            style={{border: 'none', padding: 0, cursor: 'pointer', borderRadius: '3px'}}
          />
        ))}
      </div>
      {/* Carrossel de fundo */}
      <div
        className="absolute inset-0 w-full h-full bg-cover transition-all duration-1000"
        style={{ backgroundImage: `url(${slide.imagem})`, backgroundPosition: 'center 20%' }}
      >
        {/* Gradiente preto no lado esquerdo para legibilidade do texto */}
        <div className="absolute inset-0 pointer-events-none" style={{background: 'linear-gradient(90deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0) 25%)'}}></div>
      </div>
      {/* Conteúdo do Hero */}
      <div className="relative z-10 w-full max-w-5xl pl-8 md:pl-16 lg:pl-24 flex flex-col items-start justify-center min-h-[600px]">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold mb-4 text-white leading-tight drop-shadow-lg" style={{fontFamily: 'Montserrat, sans-serif'}}>
          {slide.titulo}
        </h1>
        <p className="text-lg md:text-xl text-white/90 mb-6 drop-shadow font-semibold" style={{fontFamily: 'Montserrat, sans-serif'}}>
          {slide.descricao}
        </p>
        <button
          className="bg-blue-400 hover:bg-blue-500 text-black font-semibold px-8 py-3 rounded-lg shadow transition-all duration-150 mb-8 focus:outline-none focus:ring-2 focus:ring-[#fabb05]/40 focus:ring-offset-2 active:scale-95"
          onClick={() => slide.botao.onClick(navigate)}
          style={{fontFamily: 'Montserrat, sans-serif'}}
        >
          {slide.botao.texto}
        </button>
      </div>
      <style>{`
        @keyframes float {
          0% { transform: translateY(0);}
          50% { transform: translateY(-16px);}
          100% { transform: translateY(0);}
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .animate-float-slow {
          animation: float 4.5s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
};

export default HeroSection;
