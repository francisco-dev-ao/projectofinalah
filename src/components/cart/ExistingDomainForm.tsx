
import React, { useTransition, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useCart } from "@/contexts/CartContext";

interface ExistingDomainFormProps {
  existingDomain: string;
  setExistingDomain: (domain: string) => void;
  domainError: string;
  setDomainError: (error: string) => void;
  onValidate?: () => void;
}

const ExistingDomainForm: React.FC<ExistingDomainFormProps> = ({
  existingDomain,
  setExistingDomain,
  domainError,
  setDomainError,
  onValidate
}) => {
  const [isPending, startTransition] = useTransition();
  const { addExistingDomainToCart } = useCart();

  const handleDomainChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setExistingDomain(e.target.value);
    if (domainError) {
      setDomainError("");
    }
  }, [setExistingDomain, domainError, setDomainError]);

  const handleSelectDomain = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    startTransition(() => {
      if (!existingDomain) {
        setDomainError("Por favor, insira um domínio");
        return;
      }

      const success = addExistingDomainToCart(existingDomain);
      if (success) {
        toast.success(`Domínio ${existingDomain} adicionado ao carrinho`);
        setExistingDomain("");
      } else {
        setDomainError("Este domínio já está no carrinho");
      }
    });
  }, [existingDomain, setDomainError, addExistingDomainToCart, setExistingDomain]);

  return (
    <form onSubmit={handleSelectDomain}>
      <div className="space-y-4">
        <div>
          <label htmlFor="existing-domain" className="block text-sm font-medium mb-1">
            Seu domínio
          </label>
          <Input
            id="existing-domain"
            type="text"
            placeholder="exemplo.com.ao"
            value={existingDomain}
            onChange={handleDomainChange}
            className={domainError ? "border-red-500" : ""}
            disabled={isPending}
          />
          {domainError && (
            <p className="text-red-500 text-sm mt-1">{domainError}</p>
          )}
        </div>
        <Button type="submit" className="w-full" disabled={isPending}>
          Selecionar
        </Button>
      </div>
    </form>
  );
};

export default ExistingDomainForm;
