import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertCircle, ArrowLeft, HelpCircle } from 'lucide-react';

export default function OrderFailed() {
  const navigate = useNavigate();

  return (
    <div className="container max-w-2xl mx-auto px-4 py-8">
      <Card className="p-6">
        <div className="text-center mb-6">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Pedido não Processado</h2>
          <p className="text-gray-600">
            Seu pedido não pôde ser processado. Por favor, tente novamente ou entre em contato com o suporte.
          </p>
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-lg mb-3 flex items-center">
            <HelpCircle className="h-5 w-5 mr-2 text-gray-600" />
            O que fazer agora?
          </h3>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>Verifique sua conexão com a internet</li>
            <li>Certifique-se de que os dados do cartão/pagamento estão corretos</li>
            <li>Tente novamente em alguns minutos</li>
            <li>Se o problema persistir, entre em contato com nosso suporte</li>
          </ul>
        </div>

        <div className="mt-6 space-y-4">
          <Button 
            onClick={() => navigate('/checkout')} 
            className="w-full"
          >
            Tentar Novamente
          </Button>
          <Button 
            onClick={() => navigate('/')} 
            variant="outline" 
            className="w-full"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para a página inicial
          </Button>
          <div className="text-center">
            <a 
              href="mailto:support@angohost.ao" 
              className="text-sm text-primary hover:underline"
            >
              Contatar Suporte
            </a>
          </div>
        </div>
      </Card>
    </div>
  );
} 