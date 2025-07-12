
import { useState, useTransition } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import EmailPlanCard from "../components/EmailPlanCard";
import { useNavigate } from "react-router-dom";

const emailPlans = [
  {
    id: "email-basic",
    name: "E-mail Premium",
    description: "Recursos essenciais para pequenas empresas",
    monthlyPrice: 1000,
    annualPrice: 12000,
    renewalPrice: 14500,
    color: "blue",
    features: [
      "Domínio Personalizado",
      "Anti-spam e Anti-vírus",
      "Webmail responsivo",
      "5GB de espaço",
      "Suporte por email",
    ],
  },
  {
    id: "email-business",
    name: "Avançado Pro",
    description: "Soluções completas para empresas em crescimento",
    monthlyPrice: 3333,
    annualPrice: 40000,
    renewalPrice: 42000,
    color: "yellow",
    recommended: true,
    tag: "Recomendado",
    features: [
      "50GB por usuário",
      "Regras de Encaminhamento",
      "Aliases de e-mail",
      "Verificação Antivírus",
      "Anti-spam avançado",
      "Infraestrutura baseada na cloud",
      "Suporte por email e chat",
    ],
  },
  {
    id: "email-enterprise",
    name: "Business",
    description: "Recursos avançados para grandes empresas",
    monthlyPrice: 2500,
    annualPrice: 30000,
    renewalPrice: 32000,
    color: "purple",
    tag: "Empresas",
    features: [
      "30GB por usuário",
      "Preço por número de usuário",
      "IMAP/POP",
      "Reputação de IP limpo",
      "Classificado pelo Google",
      "Suporte prioritário 24/7",
    ],
  },
];

const EmailPage = () => {
  const [isPending, startTransition] = useTransition();
  const navigate = useNavigate();

  // Função para navegar com startTransition
  const handleNavigation = (path: string) => {
    startTransition(() => {
      navigate(path);
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      {/* Banner azul sobre email profissional - colado no menu, sem borda arredondada */}
      <main className="flex-grow">
        <section className="w-full bg-[#273a72] py-16 px-4 flex flex-col items-center justify-center text-center shadow-lg">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Tenha um e-mail profissional com o seu domínio</h2>
          <p className="text-lg md:text-xl text-white max-w-2xl mx-auto">
            Transmita mais confiança, credibilidade e profissionalismo usando um endereço de e-mail personalizado como voce@suaempresa.ao. Fortaleça sua marca e facilite a comunicação com clientes e parceiros.
          </p>
        </section>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <br />
          <br />
          <br />
          <br />
         
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-12">
            {emailPlans.map((plan, index) => (
              <div key={index} className="flex">
                <EmailPlanCard plan={plan} />
              </div>
            ))}
          </div>
          
        
          <br />
          <br />
          <br />
          <br />
          <br />

        </div>
      </main>
      <Footer />
    </div>
  );
};

export default EmailPage;
