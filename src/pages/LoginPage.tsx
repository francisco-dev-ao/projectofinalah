import React, { useState, useEffect } from "react";
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
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner"; // Import directly from sonner
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Mail, Lock, Eye, EyeOff, CheckCircle } from "lucide-react";

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

const LoginPage = () => {
  const navigate = useNavigate();
  const { signIn, isAuthenticated } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

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

    try {
      const { error } = await signIn(data.email, data.password);

      if (error) {
        toast.error(error.message || "Email ou senha incorretos.");
      } else {
        toast.success("Login bem-sucedido");
        navigate('/');
      }
    } catch (error: any) {
      toast.error(error.message || "Ocorreu um erro durante o login. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <div className="flex flex-1 min-h-screen">
        {/* Coluna Esquerda */}
        <div className="hidden md:flex flex-col justify-between w-1/2 bg-gradient-to-br from-blue-800 via-blue-700 to-blue-600 shadow-lg relative">
          <img
            src="/login.png"
            alt="Mulher sorrindo"
            className="object-cover w-full h-full absolute top-0 left-0 z-0"
            style={{ objectPosition: 'center' }}
          />
          <div className="absolute bottom-0 left-0 p-8 z-10 w-full">
            <h2 className="text-white font-bold text-2xl md:text-3xl mb-2 drop-shadow-lg">Sua Parceria de Confiança</h2>
            <p className="text-white mb-4 text-base md:text-lg drop-shadow-lg">Hospedagem de qualidade e suporte técnico 24/7 para o seu negócio online.</p>
            <ul className="space-y-2">
              <li className="flex items-center text-white text-base">
                <CheckCircle className="text-[#00d084] w-5 h-5 mr-2" />
                Complete seu cadastro para continuar sua compra
              </li>
              <li className="flex items-center text-white text-base">
                <CheckCircle className="text-[#00d084] w-5 h-5 mr-2" />
                Acesse seus serviços e faturas no painel do cliente
              </li>
            </ul>
          </div>
        </div>

        {/* Coluna Direita */}
        <div className="flex flex-col justify-center items-center w-full md:w-1/2 bg-white px-6 py-12 min-h-screen">
          <div className="w-full max-w-md mx-auto">
            {/* Logo */}
            <div className="flex flex-col items-center mb-8">
              <Link to="/">
                <img src="/ANGOHOST-01.png" alt="ANGOHOST" className="w-40 h-20 object-contain mb-2" />
              </Link>
            </div>
            {/* Título e subtítulo */}
            <h1 className="text-2xl md:text-3xl font-bold text-center text-black mb-2">Acesse a sua conta</h1>
            <p className="text-center text-gray-600 mb-1">Bem-vindo de volta! Por favor, insira seus detalhes</p>
            <p className="text-center text-blue-800 text-sm mb-4">Após o login, você será redirecionado para finalizar sua compra.</p>
            {/* Botões de navegação */}
            <div className="flex w-full mb-6 rounded-lg overflow-hidden border border-gray-200 bg-[#f2f2f2]">
              <button className="flex-1 py-2 font-semibold text-blue-800 bg-white border-r border-gray-200">Entrar</button>
              <Link to="/register" className="flex-1 py-2 text-center text-gray-500 hover:text-blue-800">Criar Conta</Link>
            </div>
            {/* Formulário */}
            <Card className="shadow-none border-0 p-0">
              <CardContent className="p-0">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-semibold">Email</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                <Mail className="w-5 h-5" />
                              </span>
                              <Input
                                type="email"
                                placeholder="seu.email@exemplo.com"
                                className="pl-10 pr-3 py-2 rounded-full border border-gray-300 focus:border-blue-800 focus:ring-1 focus:ring-blue-800"
                                {...field}
                              />
                            </div>
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
                          <FormLabel className="font-semibold">Senha</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                <Lock className="w-5 h-5" />
                              </span>
                              <Input
                                type={showPassword ? "text" : "password"}
                                placeholder="********"
                                className="pl-10 pr-10 py-2 rounded-full border border-gray-300 focus:border-blue-800 focus:ring-1 focus:ring-blue-800"
                                {...field}
                              />
                              <button
                                type="button"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                                tabIndex={-1}
                                onClick={() => setShowPassword((v) => !v)}
                              >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end">
                      <Link to="/auth?modo=recuperar" className="text-sm text-blue-800 hover:underline">
                        Esqueceu sua senha?
                      </Link>
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-blue-800 hover:bg-blue-900 text-white font-semibold rounded-full py-3 text-base mt-2"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Entrando...
                        </>
                      ) : (
                        "Entrar na minha conta"
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
