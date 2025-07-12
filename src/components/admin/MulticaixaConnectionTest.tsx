
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const MulticaixaConnectionTest = () => {
  const [reference, setReference] = useState(`test-${Date.now().toString().slice(-6)}`);
  const [amount, setAmount] = useState('100');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTestConnection = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/admin/multicaixa-test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reference,
          amount: Number(amount)
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao testar conexão');
      }

      setResult(data);
      toast.success('Conexão com Multicaixa Express testada com sucesso!');
    } catch (error: any) {
      setError(error.message || 'Erro ao testar conexão');
      toast.error(`Erro: ${error.message || 'Falha no teste de conexão'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestCallback = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/debug-callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reference,
          amount: Number(amount)
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao enviar callback de teste');
      }

      setResult(data);
      toast.success('Callback de teste enviado com sucesso!');
    } catch (error: any) {
      setError(error.message || 'Erro ao enviar callback de teste');
      toast.error(`Erro: ${error.message || 'Falha no teste de callback'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Teste de Conexão Multicaixa Express</CardTitle>
        <CardDescription>
          Teste se a conexão com o sistema de pagamentos Multicaixa Express está funcionando corretamente.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="reference" className="text-sm font-medium">
              Referência
            </label>
            <Input
              id="reference"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Referência para teste"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="amount" className="text-sm font-medium">
              Valor (AOA)
            </label>
            <Input
              id="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Valor em AOA"
              type="number"
              min="1"
            />
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-800 rounded-md flex items-start gap-2">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-500 mt-0.5" />
            <div>
              <p className="font-medium">Erro ao testar conexão</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {result && (
          <div className="p-3 bg-green-50 text-green-800 rounded-md flex items-start gap-2">
            <CheckCircle className="h-5 w-5 flex-shrink-0 text-green-500 mt-0.5" />
            <div>
              <p className="font-medium">Teste concluído com sucesso</p>
              <pre className="text-xs mt-2 bg-gray-100 p-2 rounded overflow-auto max-h-60">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={handleTestCallback}
          disabled={isLoading}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Testar Callback
        </Button>
        <Button
          onClick={handleTestConnection}
          disabled={isLoading}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Testar Conexão
        </Button>
      </CardFooter>
    </Card>
  );
};

export default MulticaixaConnectionTest;
