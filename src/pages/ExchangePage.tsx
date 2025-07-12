
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ExchangePlanCard from "../components/ExchangePlanCard";
import { Button } from "@/components/ui/button";
import { ExchangePlan } from "../components/ExchangePlanCard";

const exchangePlans: ExchangePlan[] = [
  {
    id: "basic",
    name: "Exchange 365 Basic",
    basePrice: 173750,
    cpuCores: 4,
    ram: "6GB",
    storage: "SSD 400GB",
    users: 50,
    features: [
      "Gestão de identidade e acesso para até 50 colaboradores",
      "E-mail empresarial personalizado",
      "Suporte por telefone e Web",
      "Permite até 50 usuários"
    ],
    applications: [
      "Exchange", "OneDrive", "SharePoint", "Word",
      "Excel", "PowerPoint", "Outlook",
      "Microsoft Loop", "Clipchamp"
    ]
  },
  {
    id: "premium",
    name: "Exchange 365 Premium",
    basePrice: 1500000,
    cpuCores: 6,
    ram: "16GB",
    storage: "SSD 1TB",
    users: 100,
    popular: true,
    features: [
      "Gestão de identidade e acesso para até 100 colaboradores",
      "Versões completas para desktop do Word, Excel, PowerPoint, Outlook",
      "Webinars com registo de participantes e relatórios",
      "Áreas de trabalho colaborativas"
    ],
    applications: [
      "Exchange", "OneDrive", "SharePoint", "Word",
      "Excel", "PowerPoint", "Outlook",
      "Microsoft Loop", "Clipchamp"
    ]
  },
  {
    id: "empresas",
    name: "Exchange 365 Empresas",
    basePrice: 3150000,
    cpuCores: 8,
    ram: "24GB",
    storage: "SSD 2TB",
    users: 100,
    features: [
      "Gestão de identidade e acesso para até 100 colaboradores",
      "Gestão de identidade e acesso avançada",
      "Proteção contra vírus e ataques de phishing",
      "Proteção de pontos finais empresariais"
    ],
    applications: [
      "Exchange", "OneDrive", "SharePoint", "Word",
      "Excel", "PowerPoint", "Outlook",
      "Microsoft Loop", "Clipchamp"
    ]
  }
];

const ExchangePage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-blue-900 to-purple-900 text-white py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
            <h1 className="text-3xl md:text-4xl font-bold mb-4 text-center">
              AngoHost – Sua Solução Completa em Serviços de Microsoft Exchange
            </h1>
            <p className="text-xl md:text-2xl text-center max-w-3xl mx-auto">
              Microsoft Exchange, Serviços cloud seguros e aplicações Web para empresas em Angola
            </p>
          </div>
        </section>

        {/* Plans Section */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
            <h2 className="text-3xl font-bold mb-12 text-center">Nossos Planos Exchange Online</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {exchangePlans.map((plan, index) => (
                <div key={index}>
                  <ExchangePlanCard plan={plan} />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
            <h2 className="text-3xl font-bold mb-8 text-center">Por Que Escolher o Exchange Online?</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <h3 className="text-xl font-semibold mb-3">Segurança Avançada</h3>
                <p className="text-gray-600 mb-4">
                  Proteja suas comunicações com recursos avançados de segurança, incluindo proteção contra phishing, malware e gerenciamento de ameaças.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <h3 className="text-xl font-semibold mb-3">Sincronização Total</h3>
                <p className="text-gray-600 mb-4">
                  Acesse emails, calendários e contatos em todos os seus dispositivos com sincronização instantânea e experiência consistente.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <h3 className="text-xl font-semibold mb-3">Suporte Local</h3>
                <p className="text-gray-600 mb-4">
                  Conte com suporte técnico local em Angola, disponível para ajudar com configurações, migrações e resolução de problemas.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <h3 className="text-xl font-semibold mb-3">Alta Disponibilidade</h3>
                <p className="text-gray-600 mb-4">
                  Garanta a continuidade dos negócios com serviços altamente disponíveis e redundância de dados, minimizando o tempo de inatividade.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <h3 className="text-xl font-semibold mb-3">Colaboração Integrada</h3>
                <p className="text-gray-600 mb-4">
                  Trabalhe em equipe com ferramentas colaborativas que integram perfeitamente com o Exchange, como SharePoint e Microsoft Teams.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <h3 className="text-xl font-semibold mb-3">Personalização</h3>
                <p className="text-gray-600 mb-4">
                  Personalize sua solução de Exchange para atender às necessidades específicas da sua empresa, com opções escaláveis e flexíveis.
                </p>
              </div>
            </div>
          </div>
        </section>
        
        {/* Call to Action */}
        <section className="bg-blue-50 py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl text-center">
            <h2 className="text-2xl font-bold mb-4">Pronto para modernizar a comunicação da sua empresa?</h2>
            <p className="mb-8 text-gray-600">
              Entre em contato com nossa equipe para uma consultoria personalizada e descubra como o Exchange Online pode transformar a produtividade do seu negócio.
            </p>
            <div className="flex justify-center gap-4 flex-wrap">
              <Button size="lg">Fale Conosco</Button>
              <Button variant="outline" size="lg">Ver Todos os Planos</Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default ExchangePage;
