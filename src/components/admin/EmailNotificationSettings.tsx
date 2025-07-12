import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface EmailNotificationSettingsProps {
  autoSendInvoices: boolean;
  setAutoSendInvoices: (value: boolean) => void;
  loading: boolean;
}

export const EmailNotificationSettings: React.FC<EmailNotificationSettingsProps> = ({
  autoSendInvoices,
  setAutoSendInvoices,
  loading
}) => {
  const [saving, setSaving] = useState(false);

  const saveSettings = async () => {
    try {
      setSaving(true);
      
      // Get the most recent company settings
      const { data: latestSettings, error: fetchError } = await supabase
        .from('company_settings')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(1);

      if (fetchError) {
        console.error("Error fetching company settings:", fetchError);
        toast.error("Erro ao salvar configurações");
        return;
      }

      if (!latestSettings || latestSettings.length === 0) {
        // Create new settings if none exist
        const { error: insertError } = await supabase
          .from('company_settings')
          .insert({
            auto_send_invoices: autoSendInvoices
          });

        if (insertError) {
          console.error("Error creating email settings:", insertError);
          toast.error("Erro ao criar configurações de email");
          return;
        }
      } else {
        // Update existing settings
        const { error: updateError } = await supabase
          .from('company_settings')
          .update({
            auto_send_invoices: autoSendInvoices
          })
          .eq('id', latestSettings[0].id);

        if (updateError) {
          console.error("Error updating email settings:", updateError);
          toast.error("Erro ao atualizar configurações de email");
          return;
        }
      }

      toast.success("Configurações de notificação salvas com sucesso");
    } catch (error) {
      console.error("Error saving notification settings:", error);
      toast.error("Erro ao salvar configurações de notificação");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações de Notificações</CardTitle>
        <CardDescription>
          Configure como e quando os emails devem ser enviados
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between space-x-4">
          <div>
            <Label htmlFor="auto-send-invoices" className="font-medium">
              Envio Automático de Faturas
            </Label>
            <p className="text-sm text-muted-foreground">
              Envia automaticamente faturas por email quando são geradas
            </p>
          </div>
          <Switch
            id="auto-send-invoices"
            checked={autoSendInvoices}
            onCheckedChange={setAutoSendInvoices}
            disabled={loading}
          />
        </div>
        
        <Button onClick={saveSettings} disabled={saving || loading}>
          {saving ? "Salvando..." : "Salvar Configurações"}
        </Button>
      </CardContent>
    </Card>
  );
};