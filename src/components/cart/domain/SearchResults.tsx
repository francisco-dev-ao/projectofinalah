
import React, { useTransition } from "react";
import { Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import type { DomainCheckResult } from "@/contexts/CartContext";

interface SearchResultsProps {
  results: DomainCheckResult[];
  onAddDomain: (domain: DomainCheckResult) => void;
  domainAddedToCart: DomainCheckResult | null;
}

const SearchResults: React.FC<SearchResultsProps> = ({ 
  results, 
  onAddDomain,
  domainAddedToCart
}) => {
  const [isPending, startTransition] = useTransition();

  if (results.length === 0 || domainAddedToCart) return null;

  return (
    <div className="mt-4 space-y-3">
      <h3 className="font-medium">Resultados da pesquisa:</h3>
      {results.map((result) => (
        <div 
          key={result.domain}
          className={`flex justify-between items-center p-3 rounded-lg border ${
            result.available 
              ? "bg-green-50 border-green-200" 
              : "bg-red-50 border-red-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {result.available ? (
              <Check size={18} className="text-green-500" />
            ) : (
              <X size={18} className="text-red-500" />
            )}
            <span className="font-medium">{result.domain}</span>
          </div>
          <div className="flex items-center gap-2">
            {result.available ? (
              <>
                <span className="font-medium">{formatPrice(result.price || 0)}</span>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => startTransition(() => onAddDomain(result))}
                  disabled={isPending}
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Adicionar"
                  )}
                </Button>
              </>
            ) : (
              <span className="text-red-500 text-sm">Não disponível</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default SearchResults;
