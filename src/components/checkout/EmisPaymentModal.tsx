import React, { useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface EmisPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  frameUrl: string;
  orderNumber?: string;
}

const EmisPaymentModal = ({ isOpen, onClose, frameUrl, orderNumber }: EmisPaymentModalProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      {/* Aplicado flexbox para ajustar altura e removido overflow-hidden */}
      <DialogContent className="sm:max-w-lg w-full max-w-[95vw] max-h-[90vh] p-0 flex flex-col shadow-xl rounded-lg">
        <DialogHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">
              Pagamento via Multicaixa Express
              {orderNumber && <span className="text-sm text-muted-foreground ml-2">#{orderNumber}</span>}
            </DialogTitle>
            <DialogClose asChild>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
                <span className="sr-only">Fechar</span>
              </Button>
            </DialogClose>
          </div>
        </DialogHeader>
        
        {/* Container do iframe ocupa o espaço disponível, com padding e fundo branco */}
        <div className="flex-1 w-full bg-white relative">
          <iframe
            ref={iframeRef}
            src={frameUrl}
            className="w-full h-full min-h-[400px] max-h-[60vh] border-0 rounded-b-lg"
            allow="payment"
            title="Pagamento EMIS"
          ></iframe>
        </div>
        
        <div className="p-4 bg-amber-50 border-t border-amber-100 text-center rounded-b-lg">
          <p className="text-sm text-amber-800">
            Após concluir o pagamento, você será redirecionado para a página de confirmação do pedido. 
            Se fechar esta janela antes de concluir o pagamento, poderá acessar novamente através da 
            sua área de cliente em "Minhas Faturas".
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EmisPaymentModal;
