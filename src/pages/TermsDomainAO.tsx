import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const TermsDomainAO = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-8 text-center">
              Termos e Condições para Registo de Domínio .AO
            </h1>
            
            <Card>
              <CardHeader>
                <CardTitle>Política de Registo de Domínios .AO</CardTitle>
              </CardHeader>
              <CardContent className="prose max-w-none">
                <h3>1. Elegibilidade</h3>
                <p>
                  Os domínios .ao estão disponíveis para pessoas físicas e jurídicas 
                  com presença em Angola ou que demonstrem interesse legítimo no país.
                </p>
                
                <h3>2. Documentação Necessária</h3>
                <ul>
                  <li>Pessoas físicas: Bilhete de Identidade válido</li>
                  <li>Pessoas jurídicas: Certidão de registo comercial e NIF</li>
                  <li>Entidades estrangeiras: Documentação que comprove ligação com Angola</li>
                </ul>
                
                <h3>3. Período de Registo</h3>
                <p>
                  Os domínios .ao são registados por períodos mínimos de 1 ano e 
                  máximos de 10 anos, renovável antes da data de expiração.
                </p>
                
                <h3>4. Responsabilidades do Titular</h3>
                <ul>
                  <li>Manter informações de contacto actualizadas</li>
                  <li>Usar o domínio de acordo com as leis angolanas</li>
                  <li>Renovar o registo antes da expiração</li>
                  <li>Não violar direitos de terceiros</li>
                </ul>
                
                <h3>5. Suspensão e Cancelamento</h3>
                <p>
                  O registo pode ser suspenso ou cancelado em caso de:
                </p>
                <ul>
                  <li>Violação dos termos de uso</li>
                  <li>Não pagamento das taxas</li>
                  <li>Uso indevido ou ilegal</li>
                  <li>Decisão judicial</li>
                </ul>
                
                <h3>6. Transferência de Domínio</h3>
                <p>
                  As transferências de domínio devem ser solicitadas formalmente 
                  e aprovadas pelo atual titular, seguindo os procedimentos estabelecidos.
                </p>
                
                <h3>7. Contacto</h3>
                <p>
                  Para esclarecimentos sobre estes termos, contacte:
                  <br />
                  Email: support@angohost.ao
                  <br />
                  Telefone: +244 942 090 108
                </p>
                
                <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Nota:</strong> Estes termos estão em conformidade com as 
                    regulamentações do .ao e podem ser atualizados periodicamente.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TermsDomainAO;