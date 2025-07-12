
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserX, Trash2 } from 'lucide-react';

interface Client {
  id: string;
  name: string;
  email?: string;
}

interface ClientBulkActionsProps {
  clients: Client[];
  selectedClientId: string | null;
  onClientSelect: (clientId: string, clientName: string) => void;
  onDeleteClientData: () => void;
  isDeleting: boolean;
  entityType: string;
}

export default function ClientBulkActions({
  clients,
  selectedClientId,
  onClientSelect,
  onDeleteClientData,
  isDeleting,
  entityType
}: ClientBulkActionsProps) {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <UserX className="h-5 w-5" />
          Ações por Cliente
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
          <div className="flex-1 w-full">
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Excluir todos(as) {entityType} de um cliente:
            </label>
            <Select
              value={selectedClientId || ""}
              onValueChange={(value) => {
                const client = clients.find(c => c.id === value);
                onClientSelect(value, client?.name || "");
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecionar cliente..." />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    <div className="flex flex-col">
                      <span>{client.name}</span>
                      {client.email && (
                        <span className="text-xs text-gray-500">{client.email}</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="destructive"
            onClick={onDeleteClientData}
            disabled={!selectedClientId || isDeleting}
            className="flex items-center gap-2 w-full sm:w-auto"
          >
            <Trash2 className="h-4 w-4" />
            Excluir Todos do Cliente
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
