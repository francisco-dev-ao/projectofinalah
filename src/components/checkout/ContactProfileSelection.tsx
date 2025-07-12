
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Plus, Users, CheckCircle } from "lucide-react";
import { useContactProfiles } from "@/hooks/useContactProfiles";
import { ContactProfile } from "@/services/contactProfileService";
import ContactProfileForm from "@/components/customer/ContactProfileForm";
import { toast } from "sonner";

interface ContactProfileSelectionProps {
  onProfileSelected: (profileId: string) => void;
  onContinue: () => void;
  selectedProfileId?: string;
}

const ContactProfileSelection = ({ onProfileSelected, onContinue, selectedProfileId }: ContactProfileSelectionProps) => {
  const { contactProfiles, isLoading, createProfile } = useContactProfiles();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [localSelectedId, setLocalSelectedId] = useState(selectedProfileId || '');

  // Sincronizar com o selectedProfileId quando ele mudar
  useEffect(() => {
    setLocalSelectedId(selectedProfileId || '');
  }, [selectedProfileId]);

  const handleProfileSelect = (profileId: string) => {
    console.log('Profile selected:', profileId);
    setLocalSelectedId(profileId);
    onProfileSelected(profileId);
    toast.success("Perfil de contactos selecionado com sucesso!");
  };

  const handleCreateSuccess = async (data: any) => {
    const success = await createProfile(data);
    if (success) {
      setShowCreateForm(false);
      toast.success("Perfil de contactos criado com sucesso!");
    }
    return success;
  };

  const handleManualContinue = () => {
    console.log('Manual continue clicked, localSelectedId:', localSelectedId);
    if (localSelectedId) {
      toast.success("Perfil confirmado! Pode prosseguir para o checkout.");
      onContinue();
    } else {
      toast.error("Por favor, selecione um perfil de contactos primeiro.");
    }
  };

  const handleCreateNewProfile = () => {
    setLocalSelectedId('');
    onProfileSelected('');
    setShowCreateForm(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Perfil de Contactos para Domínio
          </CardTitle>
          <p className="text-muted-foreground">
            Selecione um perfil de contactos existente ou crie um novo para o registro do domínio.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {contactProfiles.length > 0 && (
            <div>
              <h3 className="font-medium mb-3">Perfis Existentes:</h3>
              <RadioGroup value={localSelectedId} onValueChange={handleProfileSelect}>
                {contactProfiles.map((profile) => (
                  <div key={profile.id} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                    <RadioGroupItem value={profile.id!} id={profile.id!} className="mt-1" />
                    <Label htmlFor={profile.id!} className="flex-1 cursor-pointer">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium">{profile.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {profile.domain_owner_name} • {profile.email}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            NIF: {profile.nif} • {profile.country}
                          </div>
                        </div>
                        {localSelectedId === profile.id && (
                          <CheckCircle className="h-5 w-5 text-green-600 ml-2" />
                        )}
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}

          <div className="border-t pt-4">
            <Button 
              variant="outline" 
              onClick={handleCreateNewProfile}
              className="w-full flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Criar Novo Perfil de Contactos
            </Button>
          </div>

          {localSelectedId && (
            <div className="border-t pt-4">
              <Button 
                onClick={handleManualContinue} 
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                size="lg"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Continuar com Perfil Selecionado
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {showCreateForm && (
        <ContactProfileForm
          onSubmit={handleCreateSuccess}
          onCancel={() => setShowCreateForm(false)}
        />
      )}
    </div>
  );
};

export default ContactProfileSelection;
