
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface MulticaixaExpressConfigProps {
  config: {
    frametoken: string;
    callback: string;
    success: string;
    error: string;
  };
  onSave: (config: any) => Promise<void>;
  saving: boolean;
}

const MulticaixaExpressConfig = ({ config, onSave, saving }: MulticaixaExpressConfigProps) => {
  const [frameToken, setFrameToken] = useState(config.frametoken || "a53787fd-b49e-4469-a6ab-fa6acf19db48");
  const [callbackUrl, setCallbackUrl] = useState(config.callback || "");
  const [successUrl, setSuccessUrl] = useState(config.success || "");
  const [errorUrl, setErrorUrl] = useState(config.error || "");

  const handleSave = async () => {
    const updatedConfig = {
      frametoken: frameToken,
      callback: callbackUrl || `${window.location.origin}/api/multicaixa/callback`,
      success: successUrl || `${window.location.origin}/order-success`,
      error: errorUrl || `${window.location.origin}/order-failed`
    };

    try {
      await onSave(updatedConfig);
      toast.success("Configurações do Multicaixa Express atualizadas");
    } catch (error) {
      console.error("Error saving Multicaixa Express config:", error);
      toast.error("Erro ao salvar configurações do Multicaixa Express");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações do Multicaixa Express</CardTitle>
        <CardDescription>
          Configure as opções para pagamento via Multicaixa Express.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="frameToken">Frame Token</Label>
          <Input
            id="frameToken"
            value={frameToken}
            onChange={(e) => setFrameToken(e.target.value)}
            placeholder="a53787fd-b49e-4469-a6ab-fa6acf19db48"
          />
          <p className="text-sm text-muted-foreground">
            Token necessário para validar as transações no Multicaixa Express.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="callbackUrl">URL de Callback</Label>
          <Input
            id="callbackUrl"
            value={callbackUrl}
            onChange={(e) => setCallbackUrl(e.target.value)}
            placeholder={`${window.location.origin}/api/multicaixa/callback`}
          />
          <p className="text-sm text-muted-foreground">
            URL para receber as notificações de pagamento. Deixe em branco para usar o valor padrão.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="successUrl">URL de Sucesso</Label>
          <Input
            id="successUrl"
            value={successUrl}
            onChange={(e) => setSuccessUrl(e.target.value)}
            placeholder={`${window.location.origin}/order-success`}
          />
          <p className="text-sm text-muted-foreground">
            URL para redirecionar após pagamento bem-sucedido. Deixe em branco para usar o valor padrão.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="errorUrl">URL de Erro</Label>
          <Input
            id="errorUrl"
            value={errorUrl}
            onChange={(e) => setErrorUrl(e.target.value)}
            placeholder={`${window.location.origin}/order-failed`}
          />
          <p className="text-sm text-muted-foreground">
            URL para redirecionar após pagamento falhar. Deixe em branco para usar o valor padrão.
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end space-x-2">
        <Button
          disabled={saving}
          onClick={handleSave}
        >
          {saving ? "Salvando..." : "Salvar Configurações"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default MulticaixaExpressConfig;
