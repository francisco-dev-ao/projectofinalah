import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Loader2, Check, SendHorizonal } from "lucide-react";
import { smtpFormSchema, SmtpFormValues } from "@/schemas/smtpFormSchema";
import { SmtpFormFields } from "./SmtpFormFields";
import { SmtpTestSection } from "./SmtpTestSection";
import { useSmtpConfig } from "@/hooks/useSmtpConfig";
import { useCallback } from "react";
import { toast } from "sonner";

const SmtpConfigForm = () => {
  // Initialize form
  const form = useForm<SmtpFormValues>({
    resolver: zodResolver(smtpFormSchema),
    defaultValues: {
      smtp_host: "mail.angohost.ao",
      smtp_port: "465",
      auth: {
        user: "support@angohost.ao",
        pass: "97z2lh;F4_k5"
      },
      secure: "ssl",
      from_email: "support@angohost.ao",
      from_name: "AngoHost"
    }
  });

  const { loading, saveConfig } = useSmtpConfig(form);
  
  const handleSubmit = useCallback(async (values: SmtpFormValues) => {
    console.log("Valores do formulário para salvar:", values);
    toast.info("Salvando configurações...");
    await saveConfig(values);
  }, [saveConfig]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Configurações de SMTP</CardTitle>
        <CardDescription>Configure o serviço de envio de emails</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Form {...form}>
          <form 
            onSubmit={form.handleSubmit(handleSubmit)} 
            className="space-y-6"
          >
            <SmtpFormFields form={form} />
            
            <div className="flex justify-between">
              <Button 
                type="submit" 
                disabled={loading}
                className="w-full md:w-auto"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {!loading && <Check className="mr-2 h-4 w-4" />}
                Salvar Configurações
              </Button>
            </div>
          </form>
        </Form>
        
        <SmtpTestSection form={form} />
      </CardContent>
    </Card>
  );
};

export default SmtpConfigForm;
