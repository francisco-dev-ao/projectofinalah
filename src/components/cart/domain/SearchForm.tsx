
import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, Loader2 } from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { domainExtensions } from "@/data/domainPricing";

interface SearchFormProps {
  domainName: string;
  setDomainName: (name: string) => void;
  selectedExtension: string;
  setSelectedExtension: (extension: string) => void;
  isProcessing: boolean;
  onSearch: (e: React.FormEvent) => void;
  domainAddedToCart: boolean;
}

const SearchForm: React.FC<SearchFormProps> = ({
  domainName,
  setDomainName,
  selectedExtension,
  setSelectedExtension,
  isProcessing,
  onSearch,
  domainAddedToCart
}) => {
  return (
    <form onSubmit={onSearch} className="flex flex-col sm:flex-row gap-3">
      <div className="flex flex-row w-full">
        <Input
          type="text"
          value={domainName}
          onChange={e => setDomainName(e.target.value)}
          placeholder="Digite o nome do domínio..."
          className="rounded-l-md rounded-r-none h-10 text-base px-3 py-2 border border-gray-300 focus:ring-1 focus:ring-primary focus:border-primary"
          style={{ minWidth: 0 }}
          disabled={domainAddedToCart || isProcessing}
        />
        <Select 
          value={selectedExtension} 
          onValueChange={setSelectedExtension} 
          disabled={domainAddedToCart || isProcessing}
        >
          <SelectTrigger className="rounded-l-none rounded-r-md min-w-[70px] max-w-[90px] px-1 py-0 text-base h-10 border border-gray-300 focus:ring-1 focus:ring-primary focus:border-primary">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="min-w-[70px] max-w-[90px] p-0 text-base">
            {domainExtensions.map(ext => (
              <SelectItem key={ext.name} value={ext.name} className="px-2 py-1 text-base">
                {ext.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button 
        type="submit"
        disabled={isProcessing}
        className="h-10 px-4 text-base"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Verificando...
          </>
        ) : (
          domainAddedToCart ? (
            <>
              <X className="mr-2 h-4 w-4" /> Limpar
            </>
          ) : (
            <>
              <Search className="mr-2 h-4 w-4" /> Verificar
            </>
          )
        )}
      </Button>
    </form>
  );
};

export default SearchForm;
