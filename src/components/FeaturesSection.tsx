import { Server, Globe, Mail, Users } from "lucide-react";

const features = [
  {
    title: "Hospedagem de Alta Performance",
    description: "Servidores optimizados para websites em Angola, com acesso rápido e tempos de carregamento excepcionais.",
    icon: <Server className="w-10 h-10 text-primary" />, // Mantém "text-primary"
  },
  {
    title: "Domínios .AO",
    description: "Registo e gestão de domínios .ao, .co.ao, .org.ao e mais extensões angolanas.",
    icon: <Globe className="w-10 h-10 text-primary" />, // Ajustado para "text-primary"
  },
  {
    title: "Email Profissional",
    description: "Soluções de email corporativo com o nome do seu domínio para maior credibilidade.",
    icon: <Mail className="w-10 h-10 text-primary" />, // Ajustado para "text-primary"
  },
  {
    title: "Suporte Local",
    description: "Equipa de suporte angolana disponível para ajudar em qualquer situação.",
    icon: <Users className="w-10 h-10 text-primary" />, // Ajustado para "text-primary"
  },
];

const FeaturesSection = () => {
  return (
    <section className="bg-gray-100 py-12">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl font-bold text-center mb-8">Soluções Sob Medida</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="flex flex-col items-center text-center bg-white shadow-lg rounded-lg p-6 space-y-4"
            >
              <div>{feature.icon}</div>
              <h3 className="text-lg font-semibold">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;