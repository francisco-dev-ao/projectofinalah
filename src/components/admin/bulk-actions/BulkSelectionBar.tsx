
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, X } from 'lucide-react';

interface BulkSelectionBarProps {
  selectedCount: number;
  totalCount: number;
  onDeleteSelected: () => void;
  onClearSelection: () => void;
  isDeleting: boolean;
  entityType: string;
}

export default function BulkSelectionBar({
  selectedCount,
  totalCount,
  onDeleteSelected,
  onClearSelection,
  isDeleting,
  entityType
}: BulkSelectionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <Card className="mb-6 border-orange-200 bg-orange-50">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-sm font-medium text-orange-800">
                {selectedCount} de {totalCount} {entityType}(s) selecionado(s)
              </p>
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="destructive"
              size="sm"
              onClick={onDeleteSelected}
              disabled={isDeleting}
              className="flex items-center gap-2 flex-1 sm:flex-none"
            >
              <Trash2 className="h-4 w-4" />
              Excluir Selecionados
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onClearSelection}
              disabled={isDeleting}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Limpar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
