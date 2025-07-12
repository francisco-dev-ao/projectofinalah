import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Building, FileText, MapPin } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { validateNIF } from "@/services/nifService";

// Enhanced fiscal data schema with city and postal code
const fiscalDataSchema = z.object({
  companyName: z.string().min(2, { message: "Nome da empresa deve ter pelo menos 2 caracteres" }),
  companyNif: z.string()
    .min(5, { message: "NIF deve ter pelo menos 5 caracteres" })
    .regex(/^[a-zA-Z0-9]+$/, { message: "NIF deve conter apenas letras e números" })
    .refine((value) => {
      const cleanNIF = value.replace(/[^a-zA-Z0-9]/g, '');
      // Aceitar NIFs empresariais (9-10 dígitos) ou pessoais (formato 005732018NE040)
      return /^\d{9,10}$/.test(cleanNIF) || /^\d{9}[A-Z]{2}\d{3}$/.test(cleanNIF);
    }, { message: "Formato inválido. Empresa: 9-10 dígitos (ex: 5000088927). Pessoa: 9 díg + 2 letras + 3 díg (ex: 005732018NE040)" }),
  companyAddress: z.string().min(5, { message: "Endereço da empresa deve ter pelo menos 5 caracteres" }),
  city: z.string().min(2, { message: "Cidade deve ter pelo menos 2 caracteres" }).optional(),
  postalCode: z.string().min(4, { message: "Código postal deve ter pelo menos 4 caracteres" }).optional(),
  phoneInvoice: z.string().min(9, { message: "Telefone de faturação deve ter pelo menos 9 dígitos" }).optional(),
});

const CustomerFiscalData = () => {
  const { user, profile, updateProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isNifValidating, setIsNifValidating] = useState(false);
  
  // Fiscal data form
  const fiscalForm = useForm<z.infer<typeof fiscalDataSchema>>({
    resolver: zodResolver(fiscalDataSchema),
    defaultValues: {
      companyName: profile?.company_name || "",
      companyNif: profile?.nif || "",
      companyAddress: profile?.address || "",
      city: profile?.city || "",
      postalCode: profile?.postal_code || "",
      phoneInvoice: profile?.phone_invoice || "",
    },
    shouldUnregister: false,
    shouldFocusError: false,
  });

  // Update form values when profile is loaded
  useEffect(() => {
    if (profile) {
      fiscalForm.setValue('companyName', profile.company_name || '');
      fiscalForm.setValue('companyNif', profile.nif || '');
      fiscalForm.setValue('companyAddress', profile.address || '');
      fiscalForm.setValue('city', profile.city || '');
      fiscalForm.setValue('postalCode', profile.postal_code || '');
      fiscalForm.setValue('phoneInvoice', profile.phone_invoice || '');
    }
  }, [profile]);

  // NIF validation handler
  const handleNIFValidation = async (nif: string) => {
    if (nif.length < 5) return;
    
    setIsNifValidating(true);
    
    try {
      const result = await validateNIF(nif);
      
      if (result.isValid && result.companyInfo?.name) {
        fiscalForm.setValue('companyName', result.companyInfo.name);
        
        if (result.companyInfo.address) {
          fiscalForm.setValue('companyAddress', result.companyInfo.address);
        }
        
        toast.success("NIF válido");
      }
    } catch (error) {
      console.error('Error validating NIF:', error);
    } finally {
      setIsNifValidating(false);
    }
  };

  // Validação automática do NIF quando o usuário terminar de digitar
  const handleNIFBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const nif = e.target.value.trim();
    if (nif && nif.length >= 5) {
      await handleNIFValidation(nif);
    }
  };

  const onFiscalSubmit = async (data: z.infer<typeof fiscalDataSchema>) => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      await updateProfile({
        company_name: data.companyName,
        nif: data.companyNif, 
        address: data.companyAddress,
        city: data.city,
        postal_code: data.postalCode,
        phone_invoice: data.phoneInvoice,
      });
      
      toast.success("Dados fiscais atualizados");
    } catch (error: any) {
      toast.error("Erro ao atualizar dados fiscais");
    } finally {
      setIsLoading(false);
    }
  };
  return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Dados Fiscais</h1>
        </div>
        
        <Card>
          <CardHeader className="bg-muted/50">
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" /> Dados Fiscais para Faturação
            </CardTitle>
            <CardDescription>
              Atualize os dados fiscais da sua empresa para faturação
            </CardDescription>
          </CardHeader>
          <Form {...fiscalForm}>
            <form onSubmit={fiscalForm.handleSubmit(onFiscalSubmit)}>
              <CardContent className="space-y-4 pt-6">
                <FormField
                  control={fiscalForm.control}
                  name="companyNif"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>NIF da Empresa</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="NIF empresarial (9-10 dígitos) ou pessoal (ex: 005732018NE040)"
                          {...field} 
                          onChange={(e) => {
                            field.onChange(e);
                            handleNIFValidation(e.target.value);
                          }} 
                          onBlur={handleNIFBlur}
                        />
                      </FormControl>
                      <FormDescription>
                        Para NIFs empresariais use 9-10 dígitos. Para NIFs pessoais use o formato completo.
                        {isNifValidating && " Validando NIF..."}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={fiscalForm.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Empresa</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={fiscalForm.control}
                  name="companyAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Endereço da Empresa</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={fiscalForm.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cidade</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Cidade" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={fiscalForm.control}
                    name="postalCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Código Postal</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Ex: 0000-000" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={fiscalForm.control}
                  name="phoneInvoice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone de Faturação</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Telefone para contato de faturação" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter className="flex justify-end bg-muted/50">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Salvando..." : "Salvar Dados Fiscais"}
                </Button>              </CardFooter>
            </form>
          </Form>
        </Card>
      </div>
  );
};

export default CustomerFiscalData;
