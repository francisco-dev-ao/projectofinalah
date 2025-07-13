
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useContactProfiles } from "@/hooks/useContactProfiles";
import ContactProfileForm from "@/components/customer/ContactProfileForm";
import ContactProfilesList from "@/components/customer/ContactProfilesList";
import { clearDemoContactProfiles, analyzeContactProfiles } from "@/services/contactProfileService";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const ContactProfiles = () => {
  const { contactProfiles, isLoading, createProfile, updateProfile, deleteProfile, loadContactProfiles } = useContactProfiles();
  const [showForm, setShowForm] = useState(false);

  // Função para limpar dados de exemplo (apenas para administradores)
  const handleClearDemoData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;
      
      // Verificar se o usuário é admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (profile?.role !== 'admin') {
        console.log('ContactProfiles: Usuário não é admin, não pode limpar dados de exemplo');
        return;
      }
      
      console.log('ContactProfiles: Limpando dados de exemplo...');
      
      const result = await clearDemoContactProfiles();
      
      if (result.success) {
        console.log('ContactProfiles: Dados de exemplo limpos com sucesso');
        toast.success('Dados de exemplo limpos com sucesso');
        // Recarregar perfis
        loadContactProfiles();
      } else {
        console.error('ContactProfiles: Erro ao limpar dados de exemplo:', result.error);
        toast.error('Erro ao limpar dados de exemplo');
      }
    } catch (error) {
      console.error('ContactProfiles: Erro ao limpar dados de exemplo:', error);
      toast.error('Erro ao limpar dados de exemplo');
    }
  };

  // Função para analisar dados de exemplo (apenas para administradores)
  const handleAnalyzeData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;
      
      // Verificar se o usuário é admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (profile?.role !== 'admin') {
        console.log('ContactProfiles: Usuário não é admin, não pode analisar dados');
        return;
      }
      
      console.log('ContactProfiles: Analisando dados...');
      
      const result = await analyzeContactProfiles();
      
      if (result.success && result.data) {
        console.log('ContactProfiles: Análise concluída:', result.data);
        toast.success(`Análise concluída: ${result.data.total} total, ${result.data.totalDemo} de exemplo`);
      } else {
        console.error('ContactProfiles: Erro ao analisar dados:', result.error);
        toast.error('Erro ao analisar dados');
      }
    } catch (error) {
      console.error('ContactProfiles: Erro ao analisar dados:', error);
      toast.error('Erro ao analisar dados');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Perfil de contactos</h1>
            <p className="text-muted-foreground">
              Gerencie os perfis de contactos para registro de domínios
            </p>
          </div>
        </div>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Perfil de contactos</h1>
          <p className="text-muted-foreground">
            Gerencie os perfis de contactos para registro de domínios
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleAnalyzeData} variant="outline" size="sm">
            Analisar Dados
          </Button>
          <Button onClick={handleClearDemoData} variant="destructive" size="sm">
            Limpar Dados de Exemplo
          </Button>
          <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Novo Perfil
          </Button>
        </div>
      </div>

      {showForm && (
        <ContactProfileForm
          onSubmit={createProfile}
          onCancel={() => setShowForm(false)}
        />
      )}

      <ContactProfilesList
        profiles={contactProfiles}
        onCreateProfile={() => setShowForm(true)}
        onUpdateProfile={updateProfile}
        onDeleteProfile={deleteProfile}
      />
    </div>
  );
};

export default ContactProfiles;
