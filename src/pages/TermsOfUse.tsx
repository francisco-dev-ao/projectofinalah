import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const TermsOfUse = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-8 text-center">
              Termos e Política de Uso da AngoHost
            </h1>
            
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Termos de Uso</CardTitle>
              </CardHeader>
              <CardContent className="prose max-w-none">
                <h3>1. Aceitação dos Termos</h3>
                <p>
                  Ao utilizar os serviços da AngoHost, você concorda em cumprir 
                  estes termos de uso e todas as leis aplicáveis.
                </p>
                
                <h3>2. Descrição dos Serviços</h3>
                <p>A AngoHost oferece:</p>
                <ul>
                  <li>Registo e gestão de domínios</li>
                  <li>Hospedagem de websites</li>
                  <li>Serviços de email profissional</li>
                  <li>Certificados SSL</li>
                  <li>Suporte técnico</li>
                </ul>
                
                <h3>3. Responsabilidades do Cliente</h3>
                <ul>
                  <li>Fornecer informações verdadeiras e actualizadas</li>
                  <li>Manter a confidencialidade das credenciais de acesso</li>
                  <li>Usar os serviços de forma legal e ética</li>
                  <li>Efectuar pagamentos dentro dos prazos estabelecidos</li>
                </ul>
                
                <h3>4. Uso Proibido</h3>
                <p>É expressamente proibido usar nossos serviços para:</p>
                <ul>
                  <li>Actividades ilegais ou fraudulentas</li>
                  <li>Envio de spam ou emails não solicitados</li>
                  <li>Distribuição de malware ou vírus</li>
                  <li>Violação de direitos autorais</li>
                  <li>Actividades que prejudiquem terceiros</li>
                </ul>
                
                <h3>5. Pagamentos e Reembolsos</h3>
                <ul>
                  <li>Todos os preços estão em Kwanzas (KZ)</li>
                  <li>Pagamentos devem ser efectuados até à data de vencimento</li>
                  <li>Reembolsos são processados conforme nossa política</li>
                  <li>Serviços podem ser suspensos por falta de pagamento</li>
                </ul>
                
                <h3>6. Limitação de Responsabilidade</h3>
                <p>
                  A AngoHost não se responsabiliza por danos indirectos, 
                  perda de dados ou lucros cessantes decorrentes do uso dos serviços.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Política de Privacidade</CardTitle>
              </CardHeader>
              <CardContent className="prose max-w-none">
                <h3>1. Recolha de Dados</h3>
                <p>Recolhemos informações necessárias para:</p>
                <ul>
                  <li>Prestação dos serviços contratados</li>
                  <li>Comunicação com clientes</li>
                  <li>Cumprimento de obrigações legais</li>
                  <li>Melhoria dos nossos serviços</li>
                </ul>
                
                <h3>2. Uso dos Dados</h3>
                <p>Os seus dados são utilizados exclusivamente para:</p>
                <ul>
                  <li>Gestão da sua conta e serviços</li>
                  <li>Suporte técnico e atendimento</li>
                  <li>Envio de facturas e comunicações importantes</li>
                  <li>Cumprimento de requisitos legais</li>
                </ul>
                
                <h3>3. Partilha de Dados</h3>
                <p>
                  Não partilhamos os seus dados pessoais com terceiros, 
                  excepto quando exigido por lei ou com o seu consentimento expresso.
                </p>
                
                <h3>4. Segurança</h3>
                <p>
                  Implementamos medidas de segurança apropriadas para proteger 
                  os seus dados contra acesso não autorizado, alteração ou destruição.
                </p>
                
                <h3>5. Direitos do Titular</h3>
                <p>Você tem direito a:</p>
                <ul>
                  <li>Aceder aos seus dados pessoais</li>
                  <li>Corrigir informações incorrectas</li>
                  <li>Solicitar a eliminação dos dados</li>
                  <li>Retirar o consentimento</li>
                </ul>
                
                <div className="mt-8 p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-800">
                    <strong>Contacto:</strong> Para questões sobre privacidade, 
                    contacte privacy@angohost.ao
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <div className="mt-8 text-center text-sm text-gray-600">
              <p>Última actualização: Janeiro 2025</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TermsOfUse;