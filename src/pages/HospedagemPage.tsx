import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import HostingPlansSection from "../components/HostingPlansSection";

const HospedagemPage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        {/* Card azul ocupa todo o topo, sem espaço em branco */}
        <section className="bg-[#273d74] py-16 relative overflow-hidden">
          {/* Círculo decorativo esquerdo */}
          <span className="absolute left-0 bottom-0 w-48 h-48 bg-[#2e4fa3] opacity-80 rounded-full -translate-x-1/3 translate-y-1/3 pointer-events-none"></span>
          {/* Forma decorativa direita */}
          <span className="absolute right-0 top-1/2 w-72 h-56 bg-[#2e4fa3] opacity-60 rounded-[40%_60%_60%_40%/60%_40%_60%_40%] -translate-y-1/2 translate-x-1/3 pointer-events-none"></span>

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <h1 className="text-3xl font-bold text-white mb-8 text-center">Planos de Hospedagem Web</h1>
            <p className="text-center text-lg mb-12 max-w-3xl mx-auto text-white">
              Escolha o plano perfeito para o seu negócio com recursos escaláveis e preço em Kwanzas.
              Todos os planos incluem suporte técnico 24/7 e garantia de 99.9% de uptime.
            </p>
           
          </div>
        </section>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Removido o título e descrição duplicados */}
          <HostingPlansSection />
          
          <div className="max-w-6xl mx-auto mt-16 flex flex-col md:flex-row items-center gap-12">
            {/* Texto à esquerda */}
            <div className="flex-1">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">
                Por que hospedar seu site com a AngoHost?
              </h2>
              <p className="text-base md:text-lg text-gray-700 mb-6">
                Nossa hospedagem oferece alta performance, segurança avançada e suporte local especializado. Tenha seu site online 24 horas por dia, com backups automáticos, proteção contra ataques e infraestrutura robusta em servidores nacionais.
              </p>
              <ul className="space-y-3 mb-4">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span>
                    Uptime garantido de 99.9% para o seu site nunca sair do ar
                  </span>
                </li>
                
              </ul>
              
            </div>
            {/* Espaço para imagem à direita */}
            <div className="flex-1 flex justify-center">
              <div className="w-full max-w-md aspect-video bg-[#eaf0fa] rounded-xl flex items-center justify-center shadow-inner border border-[#dbeafe]">
                <img
                  src="/equipe.png"
                  alt="Equipe AngoHost"
                  className="object-cover w-full h-full rounded-xl"
                />
              </div>
            </div>
          </div>

          
        
        </div>
        <br />
        <br />
        <br />
        <br />
        <br />
      </main>
      <Footer />
    </div>
  );
};

export default HospedagemPage;
