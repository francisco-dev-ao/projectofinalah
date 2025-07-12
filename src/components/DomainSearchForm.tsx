import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, X, Search, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { formatPrice } from '@/lib/utils';
import { domainExtensions } from '@/data/domainPricing';
import type { DomainCheckResult } from '@/contexts/CartContext';
import { toast } from 'sonner';

interface DomainSearchFormProps {
  variant?: string;
}

const DomainSearchForm = ({ variant }: DomainSearchFormProps) => {
  const navigate = useNavigate();
  const { addDomainToCart } = useCart();
  const [isPending, startTransition] = useTransition();
  
  const [domain, setDomain] = useState('');
  const [extension, setExtension] = useState('.co.ao');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [searchResults, setSearchResults] = useState<DomainCheckResult[]>([]);
  
  // Clear search results when domain input changes
  const handleDomainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDomain(e.target.value);
    setSearchResults([]);
    setSearchError('');
  };
  
  // Handle form submission for domain search
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!domain) {
      setSearchError('Por favor, digite um nome de domínio');
      return;
    }
    
    setIsSearching(true);
    setSearchError('');
    setSearchResults([]);
    
    try {
      const isPremium = domain.trim().length === 3;
      const premiumPrice = 300000;
      const fullDomain = `${domain.trim().toLowerCase()}${extension}`;
      
      // Consulta DNS pública para registros A, NS e TXT
      const endpoints = [
        `https://dns.google/resolve?name=${fullDomain}&type=A`,
        `https://dns.google/resolve?name=${fullDomain}&type=NS`,
        `https://dns.google/resolve?name=${fullDomain}&type=TXT`,
      ];
      
      const results = await Promise.all(
        endpoints.map(url => fetch(url).then(res => res.json()))
      );
      
      const hasRecords = results.some(r => Array.isArray(r.Answer) && r.Answer.length > 0);
      
      // Get the price from domain extensions
      const domainPrice = isPremium ? premiumPrice : domainExtensions.find(ext => ext.name === extension)?.price || 0;
      const domainRenewalPrice = domainExtensions.find(ext => ext.name === extension)?.price || 0;
      
      // Use startTransition for updating UI state
      startTransition(() => {
        setSearchResults([
          {
            domain: fullDomain,
            available: !hasRecords,
            price: domainPrice,
            renewalPrice: domainRenewalPrice,
            isPremium,
          },
        ]);
        setIsSearching(false);
      });
    } catch (error) {
      startTransition(() => {
        setSearchError('Erro ao pesquisar domínio. Por favor, tente novamente.');
        setIsSearching(false);
      });
    }
  };
  
  // Handle domain selection and add to cart
  const handleSelectDomain = (domain: DomainCheckResult) => {
    const success = addDomainToCart(domain);
    if (success) {
      startTransition(() => {
        navigate('/cart');
      });
    }
  };
  
  // Combine isPending with isSearching for UI feedback
  const isProcessing = isPending || isSearching;
  
  return (
    <div>
      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
        <div className="flex-grow flex">
          <Input 
            type="text"
            value={domain}
            onChange={handleDomainChange}
            placeholder="Digite o nome do domínio"
            className="rounded-r-none border-r-0"
            disabled={isProcessing}
          />
          <select 
            value={extension}
            onChange={(e) => setExtension(e.target.value)}
            className="bg-background border border-input px-3 py-2 text-sm rounded-l-none min-w-[80px]"
            disabled={isProcessing}
          >
            {domainExtensions.map((ext) => (
              <option key={ext.name} value={ext.name}>{ext.name}</option>
            ))}
          </select>
        </div>
        <Button type="submit" disabled={isProcessing}>
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verificando
            </>
          ) : (
            <>
              <Search className="mr-2 h-4 w-4" />
              Verificar
            </>
          )}
        </Button>
      </form>
      
      {searchError && (
        <p className="text-red-500 text-sm mt-2">{searchError}</p>
      )}
      
      <div className="mt-4 space-y-3">
        {searchResults.map((result) => (
          <div 
            key={result.domain} 
            className={`flex justify-between items-center p-3 border rounded-md ${
              result.available ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
            }`}
          >
            <div className="flex items-center">
              {result.available ? (
                <Check className="text-green-500 mr-2 h-5 w-5" />
              ) : (
                <X className="text-red-500 mr-2 h-5 w-5" />
              )}
              <span className="font-medium">{result.domain}</span>
            </div>
            
            <div>
              {result.available ? (
                <div className="flex items-center gap-3">
                  <span className="font-medium">{formatPrice(result.price || 0)}/ano</span>
                  <Button 
                    size="sm" 
                    onClick={() => handleSelectDomain(result)}
                    disabled={isPending}
                  >
                    {isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Adicionar ao carrinho"
                    )}
                  </Button>
                </div>
              ) : (
                <span className="text-sm text-red-600">Não disponível</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DomainSearchForm;
