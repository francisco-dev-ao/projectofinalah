
import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { createAuditLog } from "@/services/audit-log-service";
import CompanyDetailsConfig from "@/components/admin/CompanyDetailsConfig";
import PaymentInstructionsConfig from "@/components/admin/PaymentInstructionsConfig";
import MulticaixaExpressConfig from "@/components/admin/MulticaixaExpressConfig";

// Define a type for company settings
interface CompanySettings {
  id: string;
  company_name: string;
  company_details: string;
  payment_instructions: string;
  bank_transfer_instructions: string;
  multicaixa_instructions: string;
  created_at: string;
  updated_at: string;
  multicaixa_express_config?: {
    frametoken: string;
    callback: string;
    success: string;
    error: string;
  };
}

const CompanySettings = () => {
  const { hasPermission, user, isAdmin, role, addAuditLogEntry } = useAdminAuth();
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      
      // Now company_settings table exists, we can fetch from it
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (error) {
        throw error;
      }
      
      const currentSettings = data?.[0] || null;
      
      if (currentSettings) {
        // Cast the data to our CompanySettings type with proper typing for multicaixa_express_config
        const typedSettings: CompanySettings = {
          ...currentSettings,
          multicaixa_express_config: currentSettings.multicaixa_express_config 
            ? typeof currentSettings.multicaixa_express_config === 'string'
              ? JSON.parse(currentSettings.multicaixa_express_config)
              : currentSettings.multicaixa_express_config
            : {
                frametoken: "a53787fd-b49e-4469-a6ab-fa6acf19db48",
                callback: "",
                success: "",
                error: ""
              }
        };
        
        setSettings(typedSettings);
      } else {
        // Create default settings if none exist
        setSettings({
          id: "",
          company_name: "AngoHost",
          company_details: "",
          payment_instructions: "",
          bank_transfer_instructions: "",
          multicaixa_instructions: "",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          multicaixa_express_config: {
            frametoken: "a53787fd-b49e-4469-a6ab-fa6acf19db48",
            callback: "",
            success: "",
            error: ""
          }
        });
      }
    } catch (error) {
      console.error("Error loading company settings:", error);
      toast.error("Erro ao carregar configurações da empresa");
    } finally {
      setLoading(false);
    }
  };

  const saveCompanyDetails = async (details: { name: string; details: string }) => {
    // Only admin role can edit settings
    if (role !== 'admin' && role !== 'super_admin') {
      toast.error("Apenas administradores podem alterar as configurações da empresa");
      return;
    }

    try {
      setSaving(true);
      
      const settingsData = {
        company_name: details.name,
        company_details: details.details
      };
      
      await updateSettings(settingsData);
      
      // Update local state
      if (settings) {
        setSettings({
          ...settings,
          company_name: details.name,
          company_details: details.details
        });
      }
      
      // Add audit log entry
      await logSettingsChange("Detalhes da empresa atualizados");
      
    } catch (error) {
      console.error("Error saving company details:", error);
      toast.error("Erro ao salvar detalhes da empresa");
    } finally {
      setSaving(false);
    }
  };
  
  const savePaymentInstructions = async (instructions: { 
    general: string;
    bankTransfer: string;
    multicaixa: string;
  }) => {
    if (role !== 'admin' && role !== 'super_admin') {
      toast.error("Apenas administradores podem alterar as configurações de pagamento");
      return;
    }

    try {
      setSaving(true);
      
      const settingsData = {
        payment_instructions: instructions.general,
        bank_transfer_instructions: instructions.bankTransfer,
        multicaixa_instructions: instructions.multicaixa,
        // Zerando outras instruções que foram desativadas
        tpa_instructions: "",
        cash_instructions: ""
      };
      
      await updateSettings(settingsData);
      
      // Update local state
      if (settings) {
        setSettings({
          ...settings,
          payment_instructions: instructions.general,
          bank_transfer_instructions: instructions.bankTransfer,
          multicaixa_instructions: instructions.multicaixa
        });
      }
      
      // Add audit log entry
      await logSettingsChange("Instruções de pagamento atualizadas");
      
    } catch (error) {
      console.error("Error saving payment instructions:", error);
      toast.error("Erro ao salvar instruções de pagamento");
    } finally {
      setSaving(false);
    }
  };
  
  const saveMulticaixaExpressConfig = async (config: {
    frametoken: string;
    callback: string;
    success: string;
    error: string;
  }) => {
    if (role !== 'admin' && role !== 'super_admin') {
      toast.error("Apenas administradores podem alterar as configurações de Multicaixa Express");
      return;
    }

    try {
      setSaving(true);
      
      const settingsData = {
        multicaixa_express_config: config
      };
      
      await updateSettings(settingsData);
      
      // Update local state
      if (settings) {
        setSettings({
          ...settings,
          multicaixa_express_config: config
        });
      }
      
      // Add audit log entry
      await logSettingsChange("Configurações do Multicaixa Express atualizadas");
      
    } catch (error) {
      console.error("Error saving Multicaixa Express config:", error);
      toast.error("Erro ao salvar configurações do Multicaixa Express");
    } finally {
      setSaving(false);
    }
  };

  // Helper function to update settings
  const updateSettings = async (settingsData: any) => {
    if (settings && settings.id) {
      // Update existing settings
      const { error } = await supabase
        .from('company_settings')
        .update(settingsData)
        .eq('id', settings.id);
      
      if (error) throw error;
    } else {
      // Create new settings
      const { data, error } = await supabase
        .from('company_settings')
        .insert(settingsData)
        .select();
      
      if (error) throw error;
      
      // Update settings id
      if (data && data[0]) {
        setSettings(prevState => ({
          ...prevState!,
          id: data[0].id
        }));
      }
    }
  };

  // Helper function to log settings changes
  const logSettingsChange = async (details: string) => {
    if (user && addAuditLogEntry) {
      await addAuditLogEntry("SETTINGS_UPDATE", details);
    } else if (user) {
      await createAuditLog(user.id, "SETTINGS_UPDATE", details);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Configurações da Empresa</h1>
          <p className="text-muted-foreground">
            Configure os detalhes da empresa e instruções de pagamento.
          </p>
        </div>

        <Tabs defaultValue="company" className="space-y-4">
          <TabsList>
            <TabsTrigger value="company">Detalhes da Empresa</TabsTrigger>
            <TabsTrigger value="payment">Instruções de Pagamento</TabsTrigger>
            <TabsTrigger value="multicaixa">Multicaixa Express</TabsTrigger>
          </TabsList>

          <TabsContent value="company" className="space-y-4">
            {!loading && settings && (
              <CompanyDetailsConfig 
                details={{
                  name: settings.company_name,
                  details: settings.company_details
                }}
                onSave={saveCompanyDetails}
                saving={saving}
              />
            )}
          </TabsContent>

          <TabsContent value="payment" className="space-y-4">
            {!loading && settings && (
              <PaymentInstructionsConfig 
                instructions={{
                  general: settings.payment_instructions,
                  bankTransfer: settings.bank_transfer_instructions,
                  multicaixa: settings.multicaixa_instructions
                }}
                onSave={savePaymentInstructions}
                saving={saving}
              />
            )}
          </TabsContent>

          <TabsContent value="multicaixa" className="space-y-4">
            {!loading && settings && settings.multicaixa_express_config && (
              <MulticaixaExpressConfig 
                config={settings.multicaixa_express_config}
                onSave={saveMulticaixaExpressConfig}
                saving={saving}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default CompanySettings;
