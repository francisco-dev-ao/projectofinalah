
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useCart } from "@/contexts/CartContext";
import type { DomainCheckResult } from "@/contexts/CartContext";
import { domainExtensions } from "@/data/domainPricing";

// Import our new components
import SearchForm from "./domain/SearchForm";
import DomainAddedNotice from "./domain/DomainAddedNotice";
import ExtensionsDisplay from "./domain/ExtensionsDisplay";
import SearchResults from "./domain/SearchResults";

interface DomainRegistrationFormProps {
  searchDomain: string;
  setSearchDomain: (domain: string) => void;
  isCheckingDomain: boolean;
  setIsCheckingDomain: (isChecking: boolean) => void;
}

const DomainRegistrationForm: React.FC<DomainRegistrationFormProps> = ({
  searchDomain,
  setSearchDomain,
  isCheckingDomain,
  setIsCheckingDomain
}) => {
  const { addDomainToCart } = useCart();
  const [isPending, startTransition] = useTransition();
  const [searchResults, setSearchResults] = useState<DomainCheckResult[]>([]);
  const [domainAddedToCart, setDomainAddedToCart] = useState<DomainCheckResult | null>(null);
  const [domainName, setDomainName] = useState("");
  const [selectedExtension, setSelectedExtension] = useState(domainExtensions[0].name);
  
  // Handle domain search form submission
  const handleDomainSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // If a domain has already been added to cart, clear it first
    if (domainAddedToCart) {
      startTransition(() => {
        setDomainAddedToCart(null);
        setSearchResults([]);
        setDomainName("");
        setSelectedExtension(domainExtensions[0].name);
        setSearchDomain("");
      });
      return;
    }

    if (!domainName.trim()) {
      toast.error("Por favor, digite o nome do domínio.");
      return;
    }
    
    const fullDomain = `${domainName.trim().toLowerCase()}${selectedExtension}`;
    setIsCheckingDomain(true);
    
    try {
      // Consulta DNS pública para registros A, NS e TXT
      const isPremium = domainName.trim().length === 3;
      const premiumPrice = 300000;
      const endpoints = [
        `https://dns.google/resolve?name=${fullDomain}&type=A`,
        `https://dns.google/resolve?name=${fullDomain}&type=NS`,
        `https://dns.google/resolve?name=${fullDomain}&type=TXT`,
      ];
      
      // Faz as 3 consultas em paralelo
      const results = await Promise.all(
        endpoints.map(url => fetch(url).then(res => res.json()))
      );
      
      // Se algum resultado tiver resposta válida, considera indisponível
      const hasRecords = results.some(r => Array.isArray(r.Answer) && r.Answer.length > 0);
      
      // Use startTransition para atualizar o estado após a operação assíncrona
      startTransition(() => {
        setSearchResults([
          {
            domain: fullDomain,
            available: !hasRecords,
            price: isPremium ? premiumPrice : domainExtensions.find(ext => ext.name === selectedExtension)?.price || 0,
            renewalPrice: domainExtensions.find(ext => ext.name === selectedExtension)?.price || 0,
            isPremium,
          },
        ]);
        setIsCheckingDomain(false);
      });
    } catch (error) {
      startTransition(() => {
        toast.error("Erro ao verificar disponibilidade do domínio. Por favor, tente novamente.");
        setIsCheckingDomain(false);
      });
    }
  };
  
  // Add domain to cart
  const handleAddDomainToCart = (domain: DomainCheckResult) => {
    startTransition(() => {
      const added = addDomainToCart(domain);
      if (added) {
        toast.success(`Domínio ${domain.domain} adicionado ao carrinho!`);
        setDomainAddedToCart(domain);
        setSearchResults([]);
      } else {
        toast.error("Este domínio já está no seu carrinho.");
      }
    });
  };

  // Combine isPending with isCheckingDomain for UI state
  const isProcessing = isPending || isCheckingDomain;

  // Determine whether to show extensions list
  const shouldShowExtensions = !searchResults.length && 
                               !isProcessing && 
                               searchDomain.trim() !== "" && 
                               !domainAddedToCart;

  return (
    <div className="space-y-4">
      <SearchForm 
        domainName={domainName}
        setDomainName={setDomainName}
        selectedExtension={selectedExtension}
        setSelectedExtension={setSelectedExtension}
        isProcessing={isProcessing}
        onSearch={handleDomainSearch}
        domainAddedToCart={!!domainAddedToCart}
      />
      
      <DomainAddedNotice domain={domainAddedToCart} />
      
      <ExtensionsDisplay shouldShow={shouldShowExtensions} />
      
      <SearchResults 
        results={searchResults} 
        onAddDomain={handleAddDomainToCart}
        domainAddedToCart={domainAddedToCart}
      />
    </div>
  );
};

export default DomainRegistrationForm;
