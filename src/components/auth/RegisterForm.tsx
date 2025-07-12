
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner"; // Import directly from sonner
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Info } from "lucide-react";
import { validateNIF } from "@/services/nifService";
import { useNavigate, useLocation } from "react-router-dom";

// Form schema with validation
const formSchema = z.object({
  nif: z.string()
    .min(1, { message: "NIF é obrigatório" })
    .regex(/^[a-zA-Z0-9]+$/, { message: "NIF deve conter apenas letras e números" })
    .refine((value) => {
      const cleanNIF = value.replace(/[^a-zA-Z0-9]/g, '');
      // Aceitar NIFs empresariais (9-10 dígitos) ou pessoais (formato 005732018NE040)
      return /^\d{9,10}$/.test(cleanNIF) || /^\d{9}[A-Z]{2}\d{3}$/.test(cleanNIF);
    }, { message: "Formato inválido. Empresa: 9-10 dígitos (ex: 5000088927). Pessoa: 9 díg + 2 letras + 3 díg (ex: 005732018NE040)" }),
  company_name: z.string().optional(),
  email: z.string().email({
    message: "Por favor insira um email válido.",
  }),
  password: z.string().min(6, {
    message: "A senha deve ter pelo menos 6 caracteres.",
  }),
  phone: z.string().min(9, {
    message: "O telefone deve ter pelo menos 9 dígitos.",
  }),
  name: z.string().optional(),
  address: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface RegisterFormProps {
  onAuthSuccess?: () => void;
}

const RegisterForm = ({ onAuthSuccess }: RegisterFormProps) => {
  const { signUp } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nifChecking, setNifChecking] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [redirectPath, setRedirectPath] = useState<string | null>(null);
  const [isCompanyNameLocked, setIsCompanyNameLocked] = useState(false);

  // Processar parâmetros da URL para preencher campos automaticamente
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const nif = params.get('nif');
    const company_name = params.get('company_name');
    const address = params.get('address');
    
    console.log('RegisterForm: Parâmetros da URL detectados:', {
      nif,
      company_name,
      address,
      fullSearch: location.search
    });
    
    if (nif || company_name || address) {
      // Decodificar valores da URL
      const decodedNif = nif ? decodeURIComponent(nif) : "";
      const decodedCompanyName = company_name ? decodeURIComponent(company_name) : "";
      const decodedAddress = address ? decodeURIComponent(address) : "";
      
      console.log('RegisterForm: Valores decodificados:', {
        decodedNif,
        decodedCompanyName,
        decodedAddress
      });
      
      // Preencher campos do formulário
      if (decodedNif) {
        console.log('RegisterForm: Preenchendo NIF:', decodedNif);
        form.setValue("nif", decodedNif);
      }
      if (decodedCompanyName) {
        console.log('RegisterForm: Preenchendo company_name:', decodedCompanyName);
        form.setValue("company_name", decodedCompanyName);
      }
      if (decodedAddress) {
        console.log('RegisterForm: Preenchendo address:', decodedAddress);
        form.setValue("address", decodedAddress);
      }
      
      // Se temos NIF, validar automaticamente
      if (decodedNif) {
        console.log('RegisterForm: Iniciando validação automática do NIF:', decodedNif);
        handleNIFValidation(decodedNif);
      }
    }
  }, [location.search]);

  useEffect(() => {
    const storedRedirectPath = sessionStorage.getItem('authRedirectPath');
    if (storedRedirectPath) {
      setRedirectPath(storedRedirectPath);
    } else {
      // Se não houver um caminho de redirecionamento salvo, verifique se há um na query string
      const params = new URLSearchParams(location.search);
      const paramRedirectPath = params.get('redirect');
      if (paramRedirectPath) {
        setRedirectPath(paramRedirectPath);
      }
    }
  }, [location]);

  // Redirecionar após autenticação
  useEffect(() => {
    if (redirectPath) {
      navigate(redirectPath, { replace: true });
    }
  }, [redirectPath, navigate]);

  const handleAuthSuccess = () => {
    sessionStorage.removeItem('authRedirectPath');
    // Redireciona se houver path salvo
    if (redirectPath) {
      navigate(redirectPath, { replace: true });
    } else {
      onAuthSuccess && onAuthSuccess();
    }
  };

  // Form definition
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nif: "",
      company_name: "",
      email: "",
      password: "",
      phone: "",
      name: "",
      address: "",
    },
    shouldUnregister: false,
    shouldFocusError: false,
  });

  // Handle NIF validation and autofill
  const handleNIFBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const nif = e.target.value.trim();
    if (nif) {
      await handleNIFValidation(nif);
    }
  };

  // Handle NIF validation and autofill
  const handleNIFValidation = async (nif: string) => {
    console.log('RegisterForm: handleNIFValidation chamado com NIF:', nif);
    if (nif) {
      setNifChecking(true);
      try {
        console.log('RegisterForm: Chamando validateNIF...');
        const result = await validateNIF(nif);
        console.log('RegisterForm: Resultado da validação:', result);
        
        if (result.isValid && result.companyInfo) {
          console.log('RegisterForm: NIF válido, preenchendo dados da empresa:', result.companyInfo);
          form.setValue("name", result.companyInfo.name || "");
          form.setValue("company_name", result.companyInfo.name || "");
          form.setValue("address", result.companyInfo.address || "");
          setIsCompanyNameLocked(!!result.companyInfo.name);
          toast.success("Os dados da empresa foram preenchidos automaticamente.");
        } else {
          console.log('RegisterForm: NIF inválido ou sem dados da empresa');
          setIsCompanyNameLocked(false);
        }
      } catch (error) {
        console.error("RegisterForm: Erro ao validar NIF:", error);
        setIsCompanyNameLocked(false);
      } finally {
        setNifChecking(false);
      }
    } else {
      setIsCompanyNameLocked(false);
    }
  };

  // Form submission handler
  const onSubmit = async (data: FormValues) => {
    console.log('RegisterForm: onSubmit chamado com dados:', data);
    setIsSubmitting(true);
    
    try {
      console.log('RegisterForm: Chamando signUp...');
      const { error } = await signUp(
        data.email, 
        data.password, 
        data.name || data.company_name || "", 
        data.phone, 
        data.nif,
        data.company_name,
        data.address
      );
      
      console.log('RegisterForm: Resultado do signUp:', { error });
      
      if (error) {
        console.error('RegisterForm: Erro no signUp:', error);
        toast.error(error.message || "Não foi possível criar a conta.");
      } else {
        console.log('RegisterForm: Conta criada com sucesso!');
        toast.success("Sua conta foi criada. Verifique seu email para confirmar.");
        
        if (onAuthSuccess) {
          console.log('RegisterForm: Chamando onAuthSuccess...');
          setTimeout(() => {
            onAuthSuccess();
          }, 300);
        }
      }
    } catch (error: any) {
      console.error('RegisterForm: Erro durante o registro:', error);
      toast.error(error.message || "Ocorreu um erro durante o registro. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const validatePhone = (value: string) => {
    // Clean the input to numbers only
    const cleaned = value.replace(/\D/g, '');
    
    // Check if starts with 9 and has 9 digits
    if (!/^9\d{8}$/.test(cleaned)) {
      return "O número deve ter 9 dígitos e começar com 9";
    }
    
    return true;
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="nif"
          render={({ field }) => (
            <FormItem>
              <FormLabel>NIF <span className="text-red-500">*</span></FormLabel>
              <FormControl>
                <div className="relative group">
                  <Input
                    placeholder="NIF empresarial (9-10 dígitos) ou pessoal (ex: 005732018NE040)"
                    {...field}
                    onBlur={handleNIFBlur}
                    onChange={e => {
                      field.onChange(e);
                      if (!e.target.value) {
                        setIsCompanyNameLocked(false);
                        form.setValue('company_name', '');
                      }
                    }}
                    disabled={nifChecking || isSubmitting}
                    className="transition-all duration-200 border-gray-300 group-hover:border-primary group-focus-within:border-primary group-hover:shadow-lg group-focus-within:shadow-primary/20 group-hover:ring-2 group-hover:ring-primary/30 group-focus-within:ring-2 group-focus-within:ring-primary/40"
                  />
                  {nifChecking && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  )}
                </div>
              </FormControl>
              <p className="text-xs text-muted-foreground">Para NIFs empresariais use 9-10 dígitos. Para NIFs pessoais use o formato completo. Ao informar o NIF, preencheremos alguns campos automaticamente.</p>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="company_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome Fiscal <span className="text-red-500">*</span></FormLabel>
              <FormControl>
                <Input
                  placeholder="Nome da empresa ou pessoa física"
                  {...field}
                  disabled={isCompanyNameLocked}
                  className="transition-all duration-200 border-gray-300 hover:border-primary focus:border-primary hover:shadow-lg focus:shadow-primary/20 hover:ring-2 hover:ring-primary/30 focus:ring-2 focus:ring-primary/40"
                />
              </FormControl>
              {isCompanyNameLocked && (
                <p className="text-xs text-muted-foreground">Preenchido automaticamente pela API. Edite o NIF para alterar.</p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Telefone <span className="text-red-500">*</span></FormLabel>
              <FormControl>
                <Input 
                  placeholder="9XXXXXXXX" 
                  maxLength={9}
                  {...field} 
                  onChange={(e) => {
                    // Only allow digits
                    const value = e.target.value.replace(/\D/g, '');
                    field.onChange(value);
                  }}
                  className="transition-all duration-200 border-gray-300 hover:border-primary focus:border-primary hover:shadow-lg focus:shadow-primary/20 hover:ring-2 hover:ring-primary/30 focus:ring-2 focus:ring-primary/40"
                />
              </FormControl>
              <p className="text-xs text-muted-foreground">Deve ter 9 dígitos e começar com 9.</p>
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
                <Input placeholder="Endereço completo" {...field} className="transition-all duration-200 border-gray-300 hover:border-primary focus:border-primary hover:shadow-lg focus:shadow-primary/20 hover:ring-2 hover:ring-primary/30 focus:ring-2 focus:ring-primary/40" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email <span className="text-red-500">*</span></FormLabel>
              <FormControl>
                <Input type="email" placeholder="seu@email.com" {...field} className="transition-all duration-200 border-gray-300 hover:border-primary focus:border-primary hover:shadow-lg focus:shadow-primary/20 hover:ring-2 hover:ring-primary/30 focus:ring-2 focus:ring-primary/40" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Senha <span className="text-red-500">*</span></FormLabel>
              <FormControl>
                <Input 
                  type="password" 
                  placeholder="Mínimo 6 caracteres" 
                  {...field} 
                  className="transition-all duration-200 border-gray-300 hover:border-primary focus:border-primary hover:shadow-lg focus:shadow-primary/20 hover:ring-2 hover:ring-primary/30 focus:ring-2 focus:ring-primary/40"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button 
          type="submit" 
          className="w-full bg-blue-800 hover:bg-blue-900 text-white font-semibold rounded-full py-3 text-base mt-2 transition-colors"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Criando conta...
            </>
          ) : (
            "Criar nova conta"
          )}
        </Button>
        
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Já tem uma conta?{" "}
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-blue-800 hover:text-blue-900 font-semibold"
            >
              Entrar na minha conta
            </button>
          </p>
        </div>
      </form>
    </Form>
  );
};

export default RegisterForm;
