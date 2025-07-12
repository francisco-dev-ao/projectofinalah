
import { useState, useTransition } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import DomainRegistrationForm from "./DomainRegistrationForm";
import ExistingDomainForm from "./ExistingDomainForm";

interface DomainSelectorProps {
  existingDomain: string;
  setExistingDomain: (domain: string) => void;
  domainOption: "register" | "use";
  setDomainOption: (option: "register" | "use") => void;
  domainError: string;
  setDomainError: (error: string) => void;
  onValidate?: () => void;
}

const DomainSelector = ({
  existingDomain,
  setExistingDomain,
  domainOption,
  setDomainOption,
  domainError,
  setDomainError,
  onValidate
}: DomainSelectorProps) => {
  const [isPending, startTransition] = useTransition();
  const [searchDomain, setSearchDomain] = useState("");
  const [isCheckingDomain, setIsCheckingDomain] = useState(false);
  
  const handleDomainOptionChange = (value: string) => {
    startTransition(() => {
      setDomainOption(value as "register" | "use");
      // Clear domain error when switching options
      setDomainError("");
    });
  };

  return (
    <Card className="bg-white rounded-lg shadow-sm mb-6">
      <CardContent className="pt-6">
        <h2 className="text-xl font-semibold mb-4">Domínio</h2>
        
        <RadioGroup 
          value={domainOption} 
          onValueChange={handleDomainOptionChange}
          className="space-y-4 mb-4"
          disabled={isPending}
        >
          <div className="flex items-start space-x-2">
            <RadioGroupItem value="register" id="register-domain" />
            <div className="grid gap-1.5 leading-none">
              <Label htmlFor="register-domain">Registrar um novo domínio</Label>
              <p className="text-sm text-muted-foreground">
                Adquira um novo domínio para seu website ou serviço.
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-2">
            <RadioGroupItem value="use" id="use-domain" />
            <div className="grid gap-1.5 leading-none">
              <Label htmlFor="use-domain">Usar um domínio existente</Label>
              <p className="text-sm text-muted-foreground">
                Utilize um domínio que você já possui.
              </p>
            </div>
          </div>
        </RadioGroup>
        
        {domainOption === "register" ? (
          <DomainRegistrationForm 
            searchDomain={searchDomain}
            setSearchDomain={setSearchDomain}
            isCheckingDomain={isCheckingDomain}
            setIsCheckingDomain={setIsCheckingDomain}
          />
        ) : (
          <ExistingDomainForm 
            existingDomain={existingDomain}
            setExistingDomain={setExistingDomain}
            domainError={domainError}
            setDomainError={setDomainError}
            onValidate={onValidate}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default DomainSelector;
