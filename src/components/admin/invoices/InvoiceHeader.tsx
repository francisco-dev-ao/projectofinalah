
import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Plus } from 'lucide-react';

interface InvoiceHeaderProps {
  onRefresh: () => void;
}

export default function InvoiceHeader({ onRefresh }: InvoiceHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Gerenciamento de Faturas</h1>
        <p className="text-gray-600 mt-1">Gerencie todas as faturas do sistema</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
        <Button
          onClick={onRefresh}
          variant="outline"
          size="sm"
          className="flex items-center gap-2 w-full sm:w-auto"
        >
          <RefreshCw className="h-4 w-4" />
          <span className="hidden sm:inline">Atualizar</span>
        </Button>
        <Button className="flex items-center gap-2 w-full sm:w-auto">
          <Plus className="h-4 w-4" />
          Nova Fatura
        </Button>
      </div>
    </div>
  );
}
