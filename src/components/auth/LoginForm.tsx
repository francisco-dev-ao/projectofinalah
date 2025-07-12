
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
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
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

// Form schema with validation
const formSchema = z.object({
  email: z.string().email({
    message: "Por favor insira um email válido.",
  }),
  password: z.string().min(1, {
    message: "Por favor insira sua senha.",
  }),
});

type FormValues = z.infer<typeof formSchema>;

interface LoginFormProps {
  onAuthSuccess?: () => void;
}

const LoginForm = ({ onAuthSuccess }: LoginFormProps) => {
  const navigate = useNavigate();
  const { signIn, isAuthenticated } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form definition
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Form submission handler
  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    console.log("Attempting login with:", data.email);
    
    try {
      const { error } = await signIn(data.email, data.password);
      
      if (error) {
        console.error("Login error:", error);
        toast.error(error.message || "Email ou senha incorretos.");
      } else {
        console.log("Login successful");
        
        // Adicionar um delay pequeno para garantir que o estado de autenticação seja atualizado
        setTimeout(() => {
          if (onAuthSuccess) {
            onAuthSuccess();
          } else {
            navigate('/customer');
          }
        }, 300);
      }
    } catch (error: any) {
      console.error("Login exception:", error);
      toast.error(error.message || "Ocorreu um erro durante o login. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="seu@email.com" {...field} />
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
              <FormLabel>Senha</FormLabel>
              <FormControl>
                <Input type="password" placeholder="********" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end">
          <Link to="/auth?modo=recuperar" className="text-sm text-primary hover:underline">
            Esqueceu sua senha?
          </Link>
        </div>
        
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Entrando...
            </>
          ) : (
            "Entrar"
          )}
        </Button>
      </form>
    </Form>
  );
};

export default LoginForm;
