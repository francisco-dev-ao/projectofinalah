import { useState, useEffect, useCallback } from "react";
import { UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SmtpFormValues, transformToEmailConfig } from "@/schemas/smtpFormSchema";
import { CompanySettings } from "@/types/companySettings";

export const useSmtpConfig = (form: UseFormReturn<SmtpFormValues>) => {
  const [loading, setLoading] = useState(false);
  const [previousValues, setPreviousValues] = useState<SmtpFormValues | null>(null);

  // Load existing configuration
  useEffect(() => {
    const loadConfig = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('company_settings')
          .select('email_config')
          .limit(1)
          .single();
        
        if (error) {
          console.error("Erro ao carregar configurações SMTP:", error);
          return;
        }
        
        if (data && data.email_config) {
          // Safely cast the email_config to the expected structure
          const emailConfig = data.email_config as CompanySettings['email_config'];
          
          console.log("Configurações carregadas do banco:", emailConfig);
          
          // Create a form data object with the correct structure
          const formValues = {
            smtp_host: emailConfig.smtp_host || "mail.angohost.ao",
            smtp_port: emailConfig.smtp_port?.toString() || "587",
            auth: {
              user: emailConfig.auth?.user || "support@angohost.ao",
              pass: emailConfig.auth?.pass || "97z2lh;F4_k5"
            },
            secure: typeof emailConfig.secure === 'boolean' 
              ? (emailConfig.secure ? "tls" : "none") 
              : emailConfig.secure || "tls",
            from_email: emailConfig.from_email || "support@angohost.ao",
            from_name: emailConfig.from_name || "AngoHost"
          };
          
          form.reset(formValues);
          setPreviousValues(formValues);
        }
      } catch (error) {
        console.error("Erro em loadConfig:", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadConfig();
  }, [form]);

  // Save config function
  const saveConfig = useCallback(async (values: SmtpFormValues) => {
    try {
      setLoading(true);
      console.log("Salvando configurações SMTP. Valores recebidos:", JSON.stringify(values, null, 2));
      
      // Verificar se os valores mudaram
      if (previousValues) {
        const secureChanged = previousValues.secure !== values.secure;
        if (secureChanged) {
          console.log(`O valor de segurança mudou de ${previousValues.secure} para ${values.secure}`);
        }
      }
      
      // Transform form values to expected email_config format
      const emailConfig = transformToEmailConfig(values);
      
      // Log para depuração
      console.log("Configuração transformada antes de salvar:", JSON.stringify(emailConfig, null, 2));
      
      // Check if the settings exist first
      const { data: existingSettings, error: queryError } = await supabase
        .from('company_settings')
        .select('id, email_config')
        .limit(1);
      
      if (queryError) {
        console.error("Erro ao verificar configurações existentes:", queryError);
        toast.error("Erro ao verificar configurações existentes");
        return false;
      }

      let saveResult;
      console.log("Configurações existentes:", existingSettings);
      
      if (!existingSettings || existingSettings.length === 0) {
        // Create initial settings if they don't exist
        console.log("Criando novas configurações");
        saveResult = await supabase
          .from('company_settings')
          .insert({
            email_config: emailConfig
          });
      } else {
        // Update existing settings
        console.log("Atualizando configurações existentes para ID:", existingSettings[0].id);
        // Log das configurações existentes
        if (existingSettings[0]?.email_config) {
          console.log("Configurações antigas:", existingSettings[0].email_config);
        }
        
        // Força a atualização incluindo um timestamp
        const updatedConfig = {
          ...emailConfig,
          updated_at: new Date().toISOString()
        };
        
        saveResult = await supabase
          .from('company_settings')
          .update({ 
            email_config: updatedConfig,
            updated_at: new Date().toISOString() // Força a atualização do updated_at
          })
          .eq('id', existingSettings[0].id);
      }
      
      if (saveResult.error) {
        console.error("Erro ao salvar configurações SMTP:", saveResult.error);
        toast.error(`Erro ao salvar configurações: ${saveResult.error.message}`);
        return false;
      }
      
      console.log("Configurações salvas com sucesso:", saveResult);
      
      // Atualizar os valores anteriores
      setPreviousValues(values);
      
      // Recarregar as configurações para confirmar
      setTimeout(async () => {
        const { data: reloadedData } = await supabase
          .from('company_settings')
          .select('email_config')
          .limit(1)
          .single();
          
        console.log("Configurações após salvar:", reloadedData?.email_config);
      }, 1000);
      
      toast.success("Configurações de SMTP salvas com sucesso!");
      return true;
    } catch (error) {
      console.error("Erro em saveConfig:", error);
      let errorMessage = "Erro ao salvar configurações";
      if (error instanceof Error) {
        errorMessage += `: ${error.message}`;
      }
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [previousValues]);

  return { loading, saveConfig };
};
