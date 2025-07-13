import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Mail, AlertTriangle, Save, TestTube } from "lucide-react";
import { toast } from "sonner";
import { SmtpFormValues } from "@/schemas/smtpFormSchema";
import { UseFormReturn } from "react-hook-form";
import { useSmtpConfig } from "@/hooks/useSmtpConfig";
import { testEmailConfiguration } from "@/services/emailTestService";

interface SmtpTestSectionProps {
  form: UseFormReturn<SmtpFormValues>;
}

// Definindo interfaces para os tipos de retorno
interface SmtpTestResult {
  data: {
    success?: boolean;
    error?: string;
  } | null;
  error: {
    message?: string;
  } | null;
}

export const SmtpTestSection = ({ form }: SmtpTestSectionProps) => {
  const [testLoading, setTestLoading] = useState(false);
  const [testStatus, setTestStatus] = useState<string>("");
  const [testEmail, setTestEmail] = useState("");
  // Usar o hook existente para salvar configurações
  const { saveConfig } = useSmtpConfig(form);


  const handleSaveClick = useCallback(async () => {
    try {
      const values = form.getValues();
      console.log("Salvando configurações manualmente:", values);
      const success = await saveConfig(values);
      
      if (success) {
        toast.success("Configurações SMTP salvas com sucesso!");
      }
    } catch (error) {
      console.error("Erro ao salvar configurações manualmente:", error);
      toast.error("Erro ao salvar configurações");
    }
  }, [form, saveConfig]);

  const testSmtp = async () => {
    try {
      setTestLoading(true);
      setTestStatus("Iniciando teste...");
      
      if (!testEmail) {
        toast.error("Informe um email para teste");
        setTestStatus("");
        return;
      }
      
      // Validate form before sending
      const hasErrors = Object.keys(form.formState.errors).length > 0;
      if (hasErrors) {
        toast.error("Corrija os erros no formulário antes de testar");
        setTestStatus("");
        return;
      }
      
      console.log("🔄 Iniciando teste de SMTP...");
      setTestStatus("Salvando configurações...");
      toast.info("Salvando configurações e preparando teste...");
      
      // First save the configuration
      const values = form.getValues();
      const saveSuccess = await saveConfig(values);
      
      if (!saveSuccess) {
        toast.error("Erro ao salvar configurações. Não é possível testar.");
        setTestStatus("Erro ao salvar configurações");
        return;
      }
      
      console.log("✅ Configurações salvas. Iniciando teste de envio...");
      setTestStatus("Conectando ao servidor SMTP...");
      toast.info("Enviando email de teste... Aguarde...");
      
      // Use the new email test service
      const result = await testEmailConfiguration(testEmail);
      
      if (result.success) {
        console.log("✅ Teste de email concluído com sucesso!");
        setTestStatus(`Email enviado com sucesso para ${testEmail}!`);
        toast.success(`Email de teste enviado para ${testEmail}`);
      } else {
        console.error("❌ Falha no teste de email:", result.error);
        setTestStatus(`Falha: ${result.error}`);
        toast.error(result.error || "Erro ao enviar email de teste");
      }
      
    } catch (error) {
      console.error("❌ Erro crítico em testSmtp:", error);
      setTestStatus("Erro crítico no teste");
      toast.error("Erro crítico ao testar configurações de SMTP");
    } finally {
      setTestLoading(false);
      // Clear status after 5 seconds
      setTimeout(() => setTestStatus(""), 5000);
    }
  };

  return (
    <div className="border-t pt-4 mt-4">
      <div className="space-y-4">
        <h3 className="font-medium">Testar Configurações</h3>
        
        <div className="flex space-x-2 mb-4">
          <Input
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="Enviar teste para este email"
          />
          <Button 
            onClick={testSmtp} 
            disabled={testLoading}
            variant="outline"
            className="shrink-0"
          >
            {testLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Mail className="mr-2 h-4 w-4" />
            )}
            Enviar Teste
          </Button>
        </div>
        
        {testStatus && (
          <div className="text-sm p-3 rounded-md bg-blue-50 border border-blue-200">
            <div className="flex items-center space-x-2">
              <div className="animate-pulse w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-blue-700">{testStatus}</span>
            </div>
          </div>
        )}
        
        <Button
          onClick={handleSaveClick}
          variant="default"
          className="w-full sm:w-auto"
        >
          <Save className="mr-2 h-4 w-4" />
          Salvar Configurações Apenas
        </Button>
        
        <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md flex items-start space-x-2">
          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0 text-amber-500" />
          <span>
            Se o teste falhar, verifique:<br/>
            1. O servidor SMTP está aceitando conexões externas<br/>
            2. As credenciais (usuário/senha) estão corretas<br/>
            3. A porta está correta (geralmente 587 para TLS, 465 para SSL)<br/>
            4. A configuração de segurança (TLS/SSL/Nenhuma) está correta para o seu provedor
          </span>
        </div>
      </div>
    </div>
  );
};
