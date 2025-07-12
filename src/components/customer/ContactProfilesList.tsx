
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Plus, Edit, Trash2 } from "lucide-react";
import { ContactProfile } from "@/services/contactProfileService";
import { ContactProfileForm } from "@/hooks/useContactProfiles";
import ContactProfileFormComponent from "./ContactProfileForm";
import AlertDialogCustom from "@/components/ui/alert-dialog-custom";

interface ContactProfilesListProps {
  profiles: ContactProfile[];
  onCreateProfile: () => void;
  onUpdateProfile: (profileId: string, data: ContactProfileForm) => Promise<boolean>;
  onDeleteProfile: (profileId: string) => Promise<boolean>;
}

const ContactProfilesList = ({ profiles, onCreateProfile, onUpdateProfile, onDeleteProfile }: ContactProfilesListProps) => {
  const [editingProfile, setEditingProfile] = useState<ContactProfile | null>(null);
  const [deletingProfileId, setDeletingProfileId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleEdit = (profile: ContactProfile) => {
    setEditingProfile(profile);
  };

  const handleEditSubmit = async (data: ContactProfileForm) => {
    if (!editingProfile) return false;
    
    const success = await onUpdateProfile(editingProfile.id!, data);
    if (success) {
      setEditingProfile(null);
    }
    return success;
  };

  const handleEditCancel = () => {
    setEditingProfile(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingProfileId) return;
    
    setIsDeleting(true);
    const success = await onDeleteProfile(deletingProfileId);
    setIsDeleting(false);
    setDeletingProfileId(null);
  };

  const handleDeleteCancel = () => {
    setDeletingProfileId(null);
  };

  // Converter ContactProfile para ContactProfileForm
  const convertToFormData = (profile: ContactProfile): ContactProfileForm => ({
    name: profile.name,
    isForeigner: profile.is_foreigner,
    nif: profile.nif,
    isIndividualCompany: profile.is_individual_company,
    domainOwnerName: profile.domain_owner_name,
    email: profile.email,
    phone: profile.phone,
    address: profile.address,
    country: profile.country,
    state: profile.state,
    city: profile.city,
    postalCode: profile.postal_code
  });

  if (profiles.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Users className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhum perfil de contacto encontrado</h3>
          <p className="text-muted-foreground text-center mb-4">
            Crie seu primeiro perfil de contacto para usar em registros de domínios
          </p>
          <Button onClick={onCreateProfile} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Criar Primeiro Perfil
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {editingProfile && (
        <ContactProfileFormComponent
          onSubmit={handleEditSubmit}
          onCancel={handleEditCancel}
          initialData={convertToFormData(editingProfile)}
          isEdit={true}
        />
      )}

      <div className="grid gap-4">
        {profiles.map((profile) => (
          <Card key={profile.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    {profile.name}
                  </CardTitle>
                  <CardDescription>
                    {profile.domain_owner_name} • {profile.email}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(profile)}
                    className="flex items-center gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeletingProfileId(profile.id!)}
                    className="flex items-center gap-2 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                    Excluir
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p><strong>NIF:</strong> {profile.nif}</p>
                  <p><strong>Telefone:</strong> {profile.phone}</p>
                  <p><strong>País:</strong> {profile.country}</p>
                </div>
                <div>
                  <p><strong>Cidade:</strong> {profile.city}</p>
                  <p><strong>Código Postal:</strong> {profile.postal_code}</p>
                  <p><strong>Cidadão Estrangeiro:</strong> {profile.is_foreigner ? 'Sim' : 'Não'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AlertDialogCustom
        open={!!deletingProfileId}
        title="Excluir Perfil de Contacto"
        description="Tem certeza que deseja excluir este perfil de contacto? Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        confirmVariant="destructive"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        loading={isDeleting}
      />
    </>
  );
};

export default ContactProfilesList;
