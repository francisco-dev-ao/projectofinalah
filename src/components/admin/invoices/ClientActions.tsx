
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserX } from 'lucide-react';

interface Client {
  id: string;
  name: string;
}

interface ClientActionsProps {
  clients: Client[];
  selectedClientId: string | null;
  onClientSelect: (clientId: string, clientName: string) => void;
  onDeleteClientInvoices: () => void;
  isDeleting: boolean;
}

export default function ClientActions({
  clients,
  selectedClientId,
  onClientSelect,
  onDeleteClientInvoices,
  isDeleting
}: ClientActionsProps) {
  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex-1">
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Eliminar todas as faturas de um cliente:
            </label>
            <Select
              value={selectedClientId || ""}
              onValueChange={(value) => {
                const client = clients.find(c => c.id === value);
                onClientSelect(value, client?.name || "");
              }}
            >
              <SelectTrigger className="w-full sm:w-[300px]">
                <SelectValue placeholder="Selecionar cliente..." />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="destructive"
            onClick={onDeleteClientInvoices}
            disabled={!selectedClientId || isDeleting}
            className="flex items-center gap-2"
          >
            <UserX className="h-4 w-4" />
            Eliminar Todas do Cliente
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
