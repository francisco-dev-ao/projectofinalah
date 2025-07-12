/**
 * Exemplo de componente que utiliza a função gerarEEnviar
 */
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import gerarEEnviar from '@/utils/gerarEEnviar';

const InvoiceExportActions = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleGerarEEnviarPDF = async () => {
    setIsProcessing(true);
    setError(null);
    setSuccess(false);
    
    try {
      // Chama a função de geração e envio do PDF
      const result = await gerarEEnviar();
      
      console.log('PDF enviado com sucesso:', result);
      setSuccess(true);
    } catch (err: any) {
      console.error('Erro ao gerar e enviar PDF:', err);
      setError(err.message || 'Erro ao processar fatura');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button 
        onClick={handleGerarEEnviarPDF} 
        disabled={isProcessing}
        className="bg-primary hover:bg-primary/90"
      >
        {isProcessing ? 'Processando...' : 'Gerar e Enviar PDF'}
      </Button>
      
      {error && (
        <div className="p-3 bg-red-100 text-red-800 rounded-md">
          {error}
        </div>
      )}
      
      {success && (
        <div className="p-3 bg-green-100 text-green-800 rounded-md">
          PDF gerado e enviado com sucesso!
        </div>
      )}
    </div>
  );
};

export default InvoiceExportActions;
