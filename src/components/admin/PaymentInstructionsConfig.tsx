
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface PaymentInstructionsProps {
  instructions: {
    general: string;
    bankTransfer: string;
    multicaixa: string;
  };
  onSave: (instructions: any) => Promise<void>;
  saving: boolean;
}

const PaymentInstructionsConfig = ({ instructions, onSave, saving }: PaymentInstructionsProps) => {
  const [generalInstructions, setGeneralInstructions] = useState(instructions.general || "");
  // Mantendo as variáveis de estado, mas não exibindo os campos na interface
  const [bankTransferInstructions, setBankTransferInstructions] = useState("");
  const [multicaixaInstructions, setMulticaixaInstructions] = useState("");

  const handleSave = async () => {
    try {
      await onSave({
        general: generalInstructions,
        bankTransfer: "", // Sempre salvar vazio para remover instruções bancárias
        multicaixa: ""    // Sempre salvar vazio para remover instruções do Multicaixa
      });
      toast.success("Instruções de pagamento atualizadas");
    } catch (error) {
      console.error("Error saving payment instructions:", error);
      toast.error("Erro ao salvar instruções de pagamento");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Instruções de Pagamento</CardTitle>
        <CardDescription>
          Configure as instruções de pagamento para os métodos disponíveis.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="generalInstructions">Instruções Gerais</Label>
          <Textarea
            id="generalInstructions"
            value={generalInstructions}
            onChange={(e) => setGeneralInstructions(e.target.value)}
            placeholder="Por favor, efetue o pagamento no prazo de 7 dias usando o método de pagamento online."
            rows={4}
          />
          <p className="text-sm text-muted-foreground">
            Estas instruções serão exibidas em todas as faturas.
          </p>
        </div>

        {/* Instruções de pagamento bancário e Multicaixa foram removidas conforme solicitado */}
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

export default PaymentInstructionsConfig;
