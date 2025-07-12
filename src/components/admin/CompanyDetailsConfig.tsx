
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface CompanyDetailsProps {
  details: {
    name: string;
    details: string;
  };
  onSave: (details: any) => Promise<void>;
  saving: boolean;
}

const CompanyDetailsConfig = ({ details, onSave, saving }: CompanyDetailsProps) => {
  const [companyName, setCompanyName] = useState(details.name || "");
  const [companyDetails, setCompanyDetails] = useState(details.details || "");

  const handleSave = async () => {
    try {
      await onSave({
        name: companyName,
        details: companyDetails
      });
      toast.success("Detalhes da empresa atualizados");
    } catch (error) {
      console.error("Error saving company details:", error);
      toast.error("Erro ao salvar detalhes da empresa");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informações da Empresa</CardTitle>
        <CardDescription>
          Estas informações serão exibidas nas faturas e outros documentos.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="companyName">Nome da Empresa</Label>
          <Input
            id="companyName"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="AngoHost"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="companyDetails">Detalhes da Empresa</Label>
          <Textarea
            id="companyDetails"
            value={companyDetails}
            onChange={(e) => setCompanyDetails(e.target.value)}
            placeholder="NIF: 0000000000&#10;Endereço: Luanda, Angola&#10;Email: contato@angohost.co.ao&#10;Telefone: +244 000 000 000"
            rows={6}
          />
          <p className="text-sm text-muted-foreground">
            Insira os detalhes da empresa que serão exibidos nas faturas (NIF, endereço, contato, etc). 
            Cada linha será exibida separadamente.
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end space-x-2">
        <Button
          disabled={saving}
          onClick={handleSave}
        >
          {saving ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CompanyDetailsConfig;
