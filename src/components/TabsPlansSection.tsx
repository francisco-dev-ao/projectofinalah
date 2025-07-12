import { useState, useTransition } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import EmailPlanCard from "./EmailPlanCard";
import PricingCard from "./PricingCard";
import { useNavigate } from "react-router-dom";
import HostingPlansSection from "@/components/HostingPlansSection";

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
  }
];

const hostingPlans = [
  {
    name: "Plano P",
    price: 15000,
    period: "ano",
    popular: false,
    features: [
      "1 Site",
      "Certificado SSL Grátis",
      "Suporte Email",
      "99.9% Uptime"
    ],
    storage: "10 GB",
    bandwidth: "100 GB",
    databases: 5,
    emails: 5,
    buttonText: "Assinar"
  },
  {
    name: "Plano M",
    price: 25000,
    period: "ano",
    popular: true,
    features: [
      "10 Sites",
      "Certificado SSL Grátis",
      "Suporte 24/7",
      "99.9% Uptime",
      "Backups Diários"
    ],
    storage: "50 GB",
    bandwidth: "Ilimitado",
    databases: 20,
    emails: 20,
    buttonText: "Assinar"
  },
  {
    name: "Plano Turbo",
    price: 40000,
    period: "ano",
    popular: false,
    features: [
      "Sites Ilimitados",
      "Certificado SSL Grátis",
      "Suporte Prioritário 24/7",
      "99.9% Uptime",
      "Backups Diários",
      "CDN Grátis"
    ],
    storage: "100 GB",
    bandwidth: "Ilimitado",
    databases: 50,
    emails: 50,
    buttonText: "Assinar"
  }
];

const TabsPlansSection = () => {
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState("hosting");
  const navigate = useNavigate();

  // Função para navegar com segurança utilizando startTransition
  const handleNavigation = (path: string) => {
    startTransition(() => {
      navigate(path);
    });
  };

  const handleTabChange = (value: string) => {
    startTransition(() => {
      setActiveTab(value);
    });
  };

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="section-title">Nossos Planos</h2>
        <p className="section-subtitle">
          Escolha o plano ideal para o seu negócio
        </p>
        
        <Tabs defaultValue="hosting" value={activeTab} onValueChange={handleTabChange} className="mt-8">
          <TabsList className="grid grid-cols-2 w-full max-w-md mx-auto mb-8">
            <TabsTrigger value="hosting">Hospedagem</TabsTrigger>
            <TabsTrigger value="email">Email Profissional</TabsTrigger>
          </TabsList>
          
          <TabsContent value="hosting" className="mt-6">
            {/* Substituído por componente estilizado */}
            <HostingPlansSection />
          </TabsContent>
          
          <TabsContent value="email" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {emailPlans.map((plan, index) => (
                <EmailPlanCard key={index} plan={plan} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
};

export default TabsPlansSection;
