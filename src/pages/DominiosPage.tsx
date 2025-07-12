
import { useTransition } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import DomainSearchForm from "../components/DomainSearchForm";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

const DominiosPage = () => {
  const navigate = useNavigate();
  const [isPending, startTransition] = useTransition();

  // Wrap navigation in startTransition to prevent Suspense errors
  const handleRegisterClick = () => {
    startTransition(() => {
      // Scroll to form is synchronous, but wrap it for consistency
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <section className="w-full bg-[#273a72] py-16 px-4 flex flex-col items-center justify-center text-center shadow-lg">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Encontre o domínio perfeito para sua presença digital</h2>
          <p className="text-lg md:text-xl text-white max-w-2xl mx-auto">
            Registre o seu domínio .ao, .co.ao, .org.ao, .edu.ao ou .it.ao e fortaleça a identidade da sua marca em Angola. Pesquise, escolha e garanta já o endereço ideal para o seu negócio ou projeto!
          </p>
        </section>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
         <br />
         <br />
         <br />
         <br />

          <div className="max-w-3xl mx-auto mb-12">
            <div className="bg-white rounded-lg shadow-md p-6">
              {/* Wrap the DomainSearchForm in Suspense to handle any suspensions */}
              <Suspense fallback={<div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>}>
                <DomainSearchForm />
              </Suspense>
            </div>
          </div>

          <div className="w-full flex justify-center bg-[#f8f9fa] py-12">
            <div className="w-full max-w-[1140px] px-2">
              <div className="mb-10">
                <h2 className="text-[26px] md:text-[28px] font-bold text-[#1f1f1f] text-center mb-3">
                  Domínios populares adequados para você
                </h2>
                <p
                  className="text-[#6c757d] text-[16px] text-center max-w-2xl mx-auto leading-snug mb-2"
                  style={{
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  Explore a riqueza virtual de Angola através dos nossos serviços. Amplie a sua presença online com domínios que refletem a identidade e cultura angolana. Construa uma forte base digital enquanto conecta suas raízes ao mundo virtual.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* .ao */}
                <div className="bg-white rounded-[8px] shadow p-7 flex flex-col min-h-[220px]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[2rem] font-extrabold text-[#1f1f1f]">.ao</span>
                    <span className="bg-[#FEC200] text-white text-[12px] font-semibold rounded px-2 py-1">Mais Popular</span>
                  </div>
                  <p className="text-[15px] text-[#444] mb-4">
                    Demonstre aos seus clientes que sua empresa opera no mercado angolano.
                  </p>
                  <div className="mb-3 text-[16px] text-[#495057]">
                    Por apenas <span className="font-bold text-[18px] text-[#1f1f1f]">KZ 25.000,00</span> <span className="font-normal">/ano</span>
                  </div>
                  <Button 
                    className="bg-[#0D1F63] hover:bg-[#13297a] transition text-white px-5 py-2 rounded-[4px] min-w-[100px] font-semibold shadow text-[15px]"
                    onClick={handleRegisterClick}
                    disabled={isPending}
                  >
                    Registar
                  </Button>
                </div>
                {/* .co.ao */}
                <div className="bg-white rounded-[8px] shadow p-7 flex flex-col min-h-[220px]">
                  <span className="text-[2rem] font-extrabold text-[#1f1f1f]">.co.ao</span>
                  <p className="text-[15px] text-[#444] mb-4 mt-2">
                    Estabeleça confiança e credibilidade ao escolher um domínio reconhecido.
                  </p>
                  <div className="mb-3 text-[16px] text-[#495057]">
                     Por apenas <span className="font-bold text-[18px] text-[#1f1f1f]">KZ 35.000,00</span> <span className="font-normal">/ano</span>
                  </div>
                  <Button 
                    className="bg-[#0D1F63] hover:bg-[#13297a] transition text-white px-5 py-2 rounded-[4px] min-w-[100px] font-semibold shadow text-[15px]"
                    onClick={handleRegisterClick}
                    disabled={isPending}
                  >
                    Registar
                  </Button>
                </div>
                {/* .edu.ao */}
                <div className="bg-white rounded-[8px] shadow p-7 flex flex-col min-h-[220px]">
                  <span className="text-[2rem] font-extrabold text-[#1f1f1f]">.edu.ao</span>
                  <p className="text-[15px] text-[#444] mb-4 mt-2">
                    Estabeleça confiança e credibilidade ao escolher um domínio reconhecido.
                  </p>
                  <div className="mb-3 text-[16px] text-[#495057]">
                     Por apenas <span className="font-bold text-[18px] text-[#1f1f1f]">KZ 35.000,00</span> <span className="font-normal">/ano</span>
                  </div>
                  <Button 
                    className="bg-[#0D1F63] hover:bg-[#13297a] transition text-white px-5 py-2 rounded-[4px] min-w-[100px] font-semibold shadow text-[15px]"
                    onClick={handleRegisterClick}
                    disabled={isPending}
                  >
                    Registar
                  </Button>
                </div>
                {/* .org.ao */}
                <div className="bg-white rounded-[8px] shadow p-7 flex flex-col min-h-[220px]">
                  <span className="text-[2rem] font-extrabold text-[#1f1f1f]">.org.ao</span>
                  <p className="text-[15px] text-[#444] mb-4 mt-2">
                    Estabeleça confiança e credibilidade ao escolher um domínio reconhecido.
                  </p>
                  <div className="mb-3 text-[16px] text-[#495057]">
                    Por apenas <span className="font-bold text-[18px] text-[#1f1f1f]">KZ 35.000,00</span> <span className="font-normal">/ano</span>
                  </div>
                  <Button 
                    className="bg-[#0D1F63] hover:bg-[#13297a] transition text-white px-5 py-2 rounded-[4px] min-w-[100px] font-semibold shadow text-[15px]"
                    onClick={handleRegisterClick}
                    disabled={isPending}
                  >
                    Registar
                  </Button>
                </div>
                {/* .it.ao */}
                <div className="bg-white rounded-[8px] shadow p-7 flex flex-col min-h-[220px]">
                  <span className="text-[2rem] font-extrabold text-[#1f1f1f]">.it.ao</span>
                  <p className="text-[15px] text-[#444] mb-4 mt-2">
                    Estabeleça sua presença online com um domínio único e exclusivo.
                  </p>
                  <div className="mb-3 text-[16px] text-[#495057]">
                    Por apenas <span className="font-bold text-[18px] text-[#1f1f1f]">KZ 5.000,00</span> <span className="font-normal">/ano</span>
                  </div>
                  <Button 
                    className="bg-[#0D1F63] hover:bg-[#13297a] transition text-white px-5 py-2 rounded-[4px] min-w-[100px] font-semibold shadow text-[15px]"
                    onClick={handleRegisterClick}
                    disabled={isPending}
                  >
                    Registar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <br />
      <br />
      <br />
      <br />
      <br />
      <Footer />
    </div>
  );
};

export default DominiosPage;
