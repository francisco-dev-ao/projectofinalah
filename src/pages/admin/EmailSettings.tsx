
import React, { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import SmtpConfigForm from "@/components/admin/SmtpConfigForm";
import { EmailNotificationSettings } from "@/components/admin/EmailNotificationSettings";
import { EmailTemplateSettings } from "@/components/admin/EmailTemplateSettings";

const EmailSettings = () => {
  const [autoSendInvoices, setAutoSendInvoices] = useState(false);
  const [defaultTemplate, setDefaultTemplate] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkEmailSettings();
  }, []);

  const checkEmailSettings = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error("Error checking company settings:", error);
        return;
      }

      if (data && data.length > 0) {
        const settings = data[0];
        
        if ('auto_send_invoices' in settings) {
          setAutoSendInvoices(settings.auto_send_invoices || false);
        }
        
        if ('default_email_template' in settings) {
          const templateValue = settings.default_email_template;
          if (typeof templateValue === 'string') {
            setDefaultTemplate(templateValue);
          } else {
            setDefaultTemplate("");
          }
        }
      }
    } catch (error) {
      console.error("Error checking email settings:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Configurações de Email</h1>
          <p className="text-muted-foreground">
            Gerencie as configurações de email do sistema
          </p>
        </div>

        <Tabs defaultValue="notifications">
          <TabsList className="mb-4">
            <TabsTrigger value="notifications">Notificações</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="smtp">Configurações SMTP</TabsTrigger>
          </TabsList>
          
          <TabsContent value="notifications">
            <EmailNotificationSettings
              autoSendInvoices={autoSendInvoices}
              setAutoSendInvoices={setAutoSendInvoices}
              loading={loading}
            />
          </TabsContent>
          
          <TabsContent value="templates">
            <EmailTemplateSettings
              defaultTemplate={defaultTemplate}
              setDefaultTemplate={setDefaultTemplate}
              loading={loading}
            />
          </TabsContent>
          
          <TabsContent value="smtp">
            <SmtpConfigForm />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default EmailSettings;
