
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CheckCircle, XCircle } from "lucide-react";
import { useNifValidation } from "@/hooks/useNifValidation";
import { ContactProfileForm as ContactProfileFormType } from "@/hooks/useContactProfiles";

// Schema de validação para o formulário de perfil de contato
const contactProfileSchema = z.object({
  name: z.string().min(2, { message: "Nome do perfil deve ter pelo menos 2 caracteres" }),
  isForeigner: z.boolean(),
  nif: z.string()
    .min(5, { message: "NIF deve ter pelo menos 5 caracteres" })
    .max(20, { message: "NIF muito longo" })
    .regex(/^[a-zA-Z0-9]+$/, { message: "NIF deve conter apenas letras e números" })
    .refine((value) => {
      const cleanNIF = value.replace(/[^a-zA-Z0-9]/g, '');
      // Aceitar NIFs empresariais (9-10 dígitos) ou pessoais (formato 005732018NE040)
      return /^\d{9,10}$/.test(cleanNIF) || /^\d{9}[A-Z]{2}\d{3}$/.test(cleanNIF);
    }, { message: "Formato inválido. Empresa: 9-10 dígitos (ex: 5000088927). Pessoa: 9 díg + 2 letras + 3 díg (ex: 005732018NE040)" }),
  isIndividualCompany: z.boolean(),
  domainOwnerName: z.string().min(2, { message: "Nome do titular deve ter pelo menos 2 caracteres" }),
  email: z.string().email({ message: "Email inválido" }),
  phone: z.string().min(9, { message: "Telefone deve ter pelo menos 9 dígitos" }),
  address: z.string().min(5, { message: "Endereço deve ter pelo menos 5 caracteres" }),
  country: z.string().min(2, { message: "País é obrigatório" }),
  state: z.string().optional(),
  city: z.string().min(2, { message: "Cidade deve ter pelo menos 2 caracteres" }),
  postalCode: z.string().optional(),
});

interface ContactProfileFormProps {
  onSubmit: (data: ContactProfileFormType) => Promise<boolean>;
  onCancel: () => void;
  initialData?: ContactProfileFormType;
  isEdit?: boolean;
}

const ContactProfileForm = ({ onSubmit, onCancel, initialData, isEdit = false }: ContactProfileFormProps) => {
  const [isSaving, setIsSaving] = useState(false);
  const { isValidatingNIF, nifValidationResult, validateNIFField, handleNIFBlur, resetValidation } = useNifValidation();

  const form = useForm<ContactProfileFormType>({
    resolver: zodResolver(contactProfileSchema),
    defaultValues: initialData || {
      name: '',
      isForeigner: false,
      nif: '',
      isIndividualCompany: false,
      domainOwnerName: '',
      email: '',
      phone: '',
      address: '',
      country: 'Angola',
      state: '',
      city: '',
      postalCode: ''
    },
    shouldUnregister: false,
    shouldFocusError: false,
  });

  // Reset form when initialData changes
  useEffect(() => {
    if (initialData) {
      form.reset(initialData);
    }
  }, [initialData, form]);

  const handleValidateNIF = async () => {
    const nif = form.getValues('nif');
    const companyName = await validateNIFField(nif);
    if (companyName) {
      form.setValue('name', companyName);
      form.setValue('domainOwnerName', companyName);
    }
  };

  // Validação automática do NIF quando o usuário terminar de digitar
  const handleNIFBlurEvent = async (e: React.FocusEvent<HTMLInputElement>) => {
    const nif = e.target.value.trim();
    if (nif) {
      const companyInfo = await handleNIFBlur(nif);
      if (companyInfo) {
        if (companyInfo.name) {
          form.setValue('name', companyInfo.name);
          form.setValue('domainOwnerName', companyInfo.name);
        }
        if (companyInfo.address) {
          form.setValue('address', companyInfo.address);
        }
        if (companyInfo.phone) {
          // Limpar o telefone para manter apenas números
          const cleanPhone = companyInfo.phone.replace(/\D/g, '');
          form.setValue('phone', cleanPhone);
        }
      }
    }
  };

  const handleSubmit = async (data: ContactProfileFormType) => {
    // Para edição, não é obrigatório validar NIF novamente se não foi alterado
    if (!isEdit && !nifValidationResult?.isValid) {
      return;
    }

    setIsSaving(true);
    const success = await onSubmit(data);
    
    if (success) {
      form.reset();
      resetValidation();
      onCancel();
    }
    
    setIsSaving(false);
  };

  const handleCancel = () => {
    form.reset();
    resetValidation();
    onCancel();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEdit ? 'Editar Perfil de Contacto' : 'Criar Novo Perfil de Contacto'}</CardTitle>
        <CardDescription>
          {isEdit ? 'Atualize as informações do perfil de contacto' : 'Preencha as informações do perfil de contacto para uso em registros de domínio'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Perfil</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Perfil Pessoal, Perfil Empresa" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isForeigner"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Este perfil pertence a um cidadão estrangeiro
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <div className="flex gap-2">
              <FormField
                control={form.control}
                name="nif"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>NIF</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="NIF empresarial (9-10 dígitos) ou pessoal (ex: 005732018NE040)" 
                        {...field} 
                        onChange={(e) => {
                          // Validação mais rigorosa: NIFs devem sempre começar com números
                          let value = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
                          
                          // Se começar com letra, não permitir
                          if (value.length > 0 && !/^\d/.test(value)) {
                            value = value.replace(/^[A-Z]+/, '');
                          }
                          
                          // Para NIFs pessoais, permitir letras apenas após 9 dígitos
                          if (value.length > 9) {
                            // Extrair os primeiros 9 caracteres (devem ser números)
                            const firstNine = value.substring(0, 9);
                            const rest = value.substring(9);
                            
                            // Se os primeiros 9 não são todos números, corrigir
                            if (!/^\d{9}$/.test(firstNine)) {
                              value = firstNine.replace(/[^0-9]/g, '') + rest;
                            }
                            
                            // Depois dos primeiros 9 dígitos, permitir até 2 letras seguidas de números
                            if (rest.length > 0) {
                              // Permitir no máximo 2 letras após os 9 dígitos
                              const letters = rest.match(/^[A-Z]{0,2}/);
                              const afterLetters = rest.substring(letters ? letters[0].length : 0);
                              const numbers = afterLetters.replace(/[^0-9]/g, '');
                              
                              value = firstNine + (letters ? letters[0] : '') + numbers;
                            }
                          } else {
                            // Para os primeiros 9 caracteres, apenas números
                            value = value.replace(/[^0-9]/g, '');
                          }
                          
                          // Limitar o tamanho total
                          if (value.length > 14) {
                            value = value.substring(0, 14);
                          }
                          
                          field.onChange(value);
                        }}
                        onBlur={handleNIFBlurEvent}
                      />
                    </FormControl>
                    <FormDescription>
                      NIFs devem começar com números. Empresarial: apenas números. Pessoal: 9 números + 2 letras + 3 números (ex: 006887386BE049)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex flex-col justify-end">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleValidateNIF}
                  disabled={isValidatingNIF}
                  className="flex items-center gap-2"
                >
                  {isValidatingNIF ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  ) : nifValidationResult?.isValid ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  Validar
                </Button>
              </div>
            </div>

            {nifValidationResult && (
              <p className={`text-sm ${nifValidationResult.isValid ? 'text-green-600' : 'text-red-600'}`}>
                {nifValidationResult.message}
              </p>
            )}

            <FormField
              control={form.control}
              name="isIndividualCompany"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Empresa Individual
                    </FormLabel>
                    <FormDescription>
                      Marque esta opção se o titular for uma empresa individual (pessoa singular que exerce atividade comercial)
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="domainOwnerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do titular do domínio</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Nome será preenchido automaticamente após validação do NIF" 
                      {...field} 
                      disabled={true} // Sempre ineditável
                      readOnly={true} // Garantir que é apenas leitura
                      className="bg-gray-50"
                    />
                  </FormControl>
                  <FormDescription>
                    Este campo é preenchido automaticamente após a validação do NIF.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="email@exemplo.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número de Telefone (com prefixo país)</FormLabel>
                  <FormControl>
                    <Input placeholder="+244 XXX XXX XXX" {...field} />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">Pode ser preenchido automaticamente pela validação do NIF.</p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endereço</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Endereço completo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>País</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o país" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Angola">Angola</SelectItem>
                        <SelectItem value="Brasil">Brasil</SelectItem>
                        <SelectItem value="Portugal">Portugal</SelectItem>
                        <SelectItem value="Cabo Verde">Cabo Verde</SelectItem>
                        <SelectItem value="Moçambique">Moçambique</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado/Província</FormLabel>
                    <FormControl>
                      <Input placeholder="Estado ou Província" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cidade</FormLabel>
                    <FormControl>
                      <Input placeholder="Cidade" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="postalCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código Postal</FormLabel>
                    <FormControl>
                      <Input placeholder="Código Postal" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={isSaving || (!isEdit && !nifValidationResult?.isValid)}>
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {isEdit ? 'Salvando...' : 'Salvando...'}
                  </>
                ) : (
                  isEdit ? 'Atualizar' : 'Salvar'
                )}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleCancel}
                disabled={isSaving}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default ContactProfileForm;
