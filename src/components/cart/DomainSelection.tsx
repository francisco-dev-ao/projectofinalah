
import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { toast } from "sonner";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

interface DomainSelectionProps {
  domainOption: "register" | "use";
  setDomainOption: (option: "register" | "use") => void;
  existingDomain: string;
  setExistingDomain: (domain: string) => void;
  validateExistingDomain: () => boolean;
  domainName: string;
  setDomainName: (name: string) => void;
  domainExtension: string;
  setDomainExtension: (extension: string) => void;
  checkDomainAvailability: () => void;
  isCheckingDomain: boolean;
}

const DomainSelection = ({
  domainOption,
  setDomainOption,
  existingDomain,
  setExistingDomain,
  validateExistingDomain,
  domainName,
  setDomainName,
  domainExtension,
  setDomainExtension,
  checkDomainAvailability,
  isCheckingDomain
}: DomainSelectionProps) => {
  const domainExtensions = ['.ao', '.co.ao', '.org.ao', '.edu.ao', '.it.ao'];

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <h3 className="text-lg font-medium mb-4">Escolha do Domínio</h3>
        
        <RadioGroup 
          value={domainOption} 
          onValueChange={(value) => setDomainOption(value as "register" | "use")} 
          className="space-y-4 mb-4"
        >
          <div className="flex items-start space-x-2">
            <RadioGroupItem value="register" id="register" />
            <div className="grid gap-1.5">
              <Label htmlFor="register" className="font-medium">Registrar novo domínio</Label>
              {domainOption === "register" && (
                <div className="mt-2 flex flex-col md:flex-row gap-2">
                  <div className="flex-1">
                    <Input 
                      placeholder="Digite o nome do domínio" 
                      value={domainName}
                      onChange={(e) => setDomainName(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div className="w-full md:w-32">
                    <Select value={domainExtension} onValueChange={setDomainExtension}>
                      <SelectTrigger>
                        <SelectValue placeholder="Extensão" />
                      </SelectTrigger>
                      <SelectContent>
                        {domainExtensions.map((ext) => (
                          <SelectItem key={ext} value={ext}>{ext}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    onClick={checkDomainAvailability}
                    disabled={isCheckingDomain || !domainName} 
                    className="md:w-auto"
                  >
                    {isCheckingDomain ? "Verificando..." : <Search className="mr-2 h-4 w-4" />}
                    Verificar
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-start space-x-2">
            <RadioGroupItem value="use" id="use" />
            <div className="grid gap-1.5">
              <Label htmlFor="use" className="font-medium">Usar domínio que já tenho</Label>
              {domainOption === "use" && (
                <div className="mt-2">
                  <Input 
                    placeholder="Digite seu domínio existente" 
                    value={existingDomain}
                    onChange={(e) => setExistingDomain(e.target.value)}
                    className="w-full md:w-96"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Você precisará apontar seu domínio para nossos servidores após a compra.
                  </p>
                </div>
              )}
            </div>
          </div>
        </RadioGroup>
      </CardContent>
    </Card>
  );
};

export default DomainSelection;
