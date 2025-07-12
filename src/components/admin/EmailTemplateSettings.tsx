import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface EmailTemplateSettingsProps {
  defaultTemplate: string;
  setDefaultTemplate: (value: string) => void;
  loading: boolean;
}

export const EmailTemplateSettings: React.FC<EmailTemplateSettingsProps> = ({
  defaultTemplate,
  setDefaultTemplate,
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
            default_email_template: defaultTemplate
          });

        if (insertError) {
          console.error("Error creating email template settings:", insertError);
          toast.error("Erro ao criar configurações de template");
          return;
        }
      } else {
        // Update existing settings
        const { error: updateError } = await supabase
          .from('company_settings')
          .update({
            default_email_template: defaultTemplate
          })
          .eq('id', latestSettings[0].id);

        if (updateError) {
          console.error("Error updating email template settings:", updateError);
          toast.error("Erro ao atualizar configurações de template");
          return;
        }
      }

      toast.success("Configurações de template salvas com sucesso");
    } catch (error) {
      console.error("Error saving template settings:", error);
      toast.error("Erro ao salvar configurações de template");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Templates de Email</CardTitle>
        <CardDescription>
          Configure os templates padrão para emails enviados pelo sistema
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-1.5">
          <Label htmlFor="default-template">Template Padrão</Label>
          <textarea
            id="default-template"
            className="w-full min-h-[200px] p-2 border rounded-md"
            value={defaultTemplate}
            onChange={(e) => setDefaultTemplate(e.target.value)}
            placeholder="Digite o template padrão HTML aqui..."
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