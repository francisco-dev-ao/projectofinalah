import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle, X } from "lucide-react";

interface MulticaixaExpressModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
}

const MulticaixaExpressModal = ({ isOpen, onClose, token }: MulticaixaExpressModalProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const frameUrl = token ? 
    `https://pagamentonline.emis.co.ao/online-payment-gateway/portal/frame?token=${token}` : 
    '';
  
  console.log("MulticaixaExpressModal rendered with token:", token);
  console.log("Frame URL:", frameUrl);

  // Handle frame loading
  useEffect(() => {
    if (isOpen && token) {
      console.log("Modal opened, setting up iframe for token:", token);
      setLoading(true);
      setError(null);
    }
  }, [isOpen, token]);

  // Handle frame load success
  const handleFrameLoad = () => {
    console.log("Multicaixa Express iframe loaded successfully");
    setLoading(false);
  };

  // Handle frame load error
  const handleFrameError = () => {
    console.error("Error loading Multicaixa Express iframe");
    setLoading(false);
    setError("Não foi possível carregar o sistema de pagamento. Por favor, tente novamente.");
  };

  if (!token) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className="sm:max-w-4xl w-full max-w-[98vw] md:max-h-[92vh] lg:max-h-[650px] p-0 overflow-hidden !rounded-2xl"
        style={{
          padding: 0,
          maxWidth: "98vw",
          maxHeight: "92vh",
          borderRadius: "1rem",
        }}
      >
        <DialogHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">
              Pagamento via Multicaixa Express
            </DialogTitle>
            <DialogClose asChild>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
                <span className="sr-only">Fechar</span>
              </Button>
            </DialogClose>
          </div>
        </DialogHeader>
        
        <div 
          className="
            relative 
            flex 
            flex-col
            w-full 
            h-full 
            justify-center 
            items-stretch 
            bg-white
            overflow-x-hidden
            overflow-y-auto
            min-h-[350px]
            "
          style={{
            minHeight: 350,
            height: "min(600px,70vh)",
            maxHeight: "62vh",
            width: "100%",
          }}
        >
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-10">
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
              <p className="mt-4 text-lg font-medium">Carregando pagamento...</p>
              <p className="text-sm text-muted-foreground">
                Conectando ao sistema Multicaixa Express...
              </p>
            </div>
          )}
          
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background z-10">
              <div className="text-center p-6 max-w-md">
                <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Erro de Conexão</h3>
                <p className="mb-6 text-muted-foreground">{error}</p>
                <Button onClick={onClose} className="mx-auto">Fechar</Button>
              </div>
            </div>
          )}
          
          {/* Mostra apenas quando tem frameUrl E não tem erro */}
          {!error && frameUrl && (
            <div className="flex-1 flex items-stretch">
              <iframe 
                ref={iframeRef}
                src={frameUrl}
                className="
                  border-none
                  w-full
                  h-full
                  min-h-[350px]
                  rounded-b-2xl
                  bg-white
                  "
                style={{
                  minHeight: 350,
                  height: "100%",
                  width: "100%",
                  maxHeight: "100%",
                  borderRadius: "0 0 16px 16px",
                  overflow: "auto",
                  display: "block"
                }}
                onLoad={handleFrameLoad}
                onError={handleFrameError}
                title="Pagamento Multicaixa Express"
                allow="payment"
              />
            </div>
          )}
        </div>
        
        <div className="p-4 bg-blue-50 border-t border-blue-100 text-center !rounded-b-2xl">
          <p className="text-sm text-blue-800">
            Complete o pagamento seguindo as instruções na tela. 
            Após a confirmação, você será redirecionado automaticamente.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MulticaixaExpressModal;
