
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { toast } from 'sonner';

interface InvoiceFormProps {
  onSubmit?: (data: any) => void;
}

export default function InvoiceForm({ onSubmit }: InvoiceFormProps) {
  const [formData, setFormData] = useState({
    invoice_number: '',
    due_date: new Date(),
    amount: 0
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.(formData);
    toast.success('Fatura criada com sucesso!');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="invoice_number">Número da Fatura</Label>
        <Input
          id="invoice_number"
          value={formData.invoice_number}
          onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
        />
      </div>
      
      <div>
        <Label>Data de Vencimento</Label>
        <DatePicker
          date={formData.due_date}
          onSelect={(date) => setFormData({ ...formData, due_date: date || new Date() })}
        />
      </div>
      
      <div>
        <Label htmlFor="amount">Valor</Label>
        <Input
          id="amount"
          type="number"
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
        />
      </div>
      
      <Button type="submit">Criar Fatura</Button>
    </form>
  );
}
