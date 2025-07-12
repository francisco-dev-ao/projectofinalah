
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, RotateCw, ShoppingCart } from 'lucide-react';
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/contexts/CartContext";
import { domainPriceMap } from "@/data/domainPricing";
import { toast } from "sonner";
import { v4 as uuidv4 } from 'uuid';

interface DomainRenewalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  domain: {
    id: string;
    domain_name: string;
    tld: string;
    expiration_date: string;
  };
}

const DomainRenewalDialog: React.FC<DomainRenewalDialogProps> = ({
  open,
  onOpenChange,
  domain
}) => {
  const [selectedYears, setSelectedYears] = useState('1');
  const [isProcessing, setIsProcessing] = useState(false);
  const { addToCart } = useCart();

  const getRenewalPrice = (tld: string, years: number): number => {
    const tldKey = tld.startsWith('.') ? tld : `.${tld}`;
    const priceInfo = domainPriceMap[tldKey];
    const basePrice = priceInfo ? priceInfo.renewalPrice : 20000;
    return basePrice * years;
  };

  const calculateNewExpirationDate = (currentExpiration: string, years: number): string => {
    const currentDate = new Date(currentExpiration);
    const newDate = new Date(currentDate);
    newDate.setFullYear(newDate.getFullYear() + years);
    return newDate.toLocaleDateString('pt-PT');
  };

  const handleRenewal = async () => {
    setIsProcessing(true);
    
    try {
      const years = parseInt(selectedYears);
      const totalPrice = getRenewalPrice(domain.tld, years);
      
      const renewalItem = {
        id: uuidv4(),
        name: `Renovação de Domínio: ${domain.domain_name}.${domain.tld}`,
        price: totalPrice,
        type: 'domain_renewal',
        description: `Renovação de domínio por ${years} ${years === 1 ? 'ano' : 'anos'}`,
        unitPrice: totalPrice,
        period: `${years} ${years === 1 ? 'ano' : 'anos'}`,
        metadata: {
          domainId: domain.id,
          domainName: `${domain.domain_name}.${domain.tld}`,
          tld: domain.tld,
          years: years
        }
      };

      addToCart(renewalItem);
      toast.success(`Renovação adicionada ao carrinho!`);
      onOpenChange(false);
      
      // Redirect to cart
      window.location.href = '/cart';
    } catch (error) {
      console.error('Erro ao adicionar renovação ao carrinho:', error);
      toast.error('Erro ao processar renovação. Tente novamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  const years = parseInt(selectedYears);
  const totalPrice = getRenewalPrice(domain.tld, years);
  const newExpirationDate = calculateNewExpirationDate(domain.expiration_date, years);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCw className="h-5 w-5" />
            Renovar Domínio
          </DialogTitle>
          <DialogDescription>
            Renove seu domínio {domain.domain_name}.{domain.tld}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="years">Período de Renovação</Label>
            <Select value={selectedYears} onValueChange={setSelectedYears}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 ano</SelectItem>
                <SelectItem value="2">2 anos</SelectItem>
                <SelectItem value="3">3 anos</SelectItem>
                <SelectItem value="5">5 anos</SelectItem>
                <SelectItem value="10">10 anos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardContent className="pt-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Período:</span>
                  <span className="font-medium">{years} {years === 1 ? 'ano' : 'anos'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Nova expiração:</span>
                  <span className="font-medium flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {newExpirationDate}
                  </span>
                </div>
                <div className="flex justify-between items-center text-lg font-bold border-t pt-2">
                  <span>Total:</span>
                  <span className="text-primary">{formatPrice(totalPrice)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>
            Cancelar
          </Button>
          <Button onClick={handleRenewal} disabled={isProcessing} className="w-full sm:w-auto">
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processando...
              </>
            ) : (
              <>
                <ShoppingCart className="h-4 w-4 mr-2" />
                Adicionar ao Carrinho
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DomainRenewalDialog;
