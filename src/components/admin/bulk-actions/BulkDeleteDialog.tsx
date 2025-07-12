
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';

interface BulkDeleteDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  items: any[];
  isDeleting: boolean;
  entityType: string;
}

export default function BulkDeleteDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  items,
  isDeleting,
  entityType
}: BulkDeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            {title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-gray-600">{description}</p>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm font-medium text-red-800 mb-2">
              {items.length} {entityType}(s) selecionado(s):
            </p>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {items.slice(0, 5).map((item, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {item.name || item.id?.substring(0, 8) || `Item ${index + 1}`}
                </Badge>
              ))}
              {items.length > 5 && (
                <Badge variant="outline" className="text-xs">
                  +{items.length - 5} mais...
                </Badge>
              )}
            </div>
          </div>
          
          <p className="text-xs text-red-600 font-medium">
            ⚠️ Esta ação não pode ser desfeita!
          </p>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            Cancelar
          </Button>
          <Button 
            variant="destructive" 
            onClick={onConfirm} 
            disabled={isDeleting}
          >
            {isDeleting ? 'Excluindo...' : 'Confirmar Exclusão'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
