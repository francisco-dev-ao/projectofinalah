
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

interface BulkActionsProps {
  selectedCount: number;
  onDeleteSelected: () => void;
  onClearSelection: () => void;
  isDeleting: boolean;
}

export default function BulkActions({
  selectedCount,
  onDeleteSelected,
  onClearSelection,
  isDeleting
}: BulkActionsProps) {
  if (selectedCount === 0) return null;

  return (
    <Card className="mb-6 border-orange-200 bg-orange-50">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <p className="text-sm font-medium text-orange-800">
              {selectedCount} fatura(s) selecionada(s)
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={onDeleteSelected}
              disabled={isDeleting}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Eliminar Selecionadas
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onClearSelection}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
