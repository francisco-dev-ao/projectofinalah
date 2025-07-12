import React, { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import RegisterForm from "@/components/auth/RegisterForm";
import { CheckCircle, Mail, Eye, EyeOff, User, MapPin, Phone, IdCard } from "lucide-react";
import { useState as useReactState } from "react";
import { validateNIF } from "@/services/nifService";

const RegisterPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [showPassword, setShowPassword] = useReactState(false);
  const [nifChecking, setNifChecking] = useReactState(false);
  const [formData, setFormData] = useReactState({
    nif: "",
    company_name: "",
    email: "",
    password: "",
    phone: "",
    name: "",
    address: "",
  });

  // Processar parâmetros da URL ao carregar a página
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const nif = params.get('nif');
    const company_name = params.get('company_name');
    const address = params.get('address');
    
    if (nif || company_name || address) {
      setFormData(prev => ({
        ...prev,
        nif: nif || prev.nif,
        company_name: company_name || prev.company_name,
        address: address || prev.address,
      }));
      
      // Se temos NIF, validar automaticamente
      if (nif) {
        handleNIFValidation(nif);
      }
    }
  }, [location.search]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleAuthSuccess = () => {
    toast.success("Registro bem-sucedido! Verifique seu email para confirmar.");
    navigate('/login');
  };

  // Validação do NIF e preenchimento automático
  const handleNIFValidation = async (nif: string) => {
    if (nif) {
      setNifChecking(true);
      try {
        const result = await validateNIF(nif);
        if (result.isValid && result.companyInfo) {
          setFormData((prev) => ({
            ...prev,
            name: result.companyInfo.name || "",
            company_name: result.companyInfo.name || "",
            address: result.companyInfo.address || "",
          }));
          toast.success("Os dados da empresa foram preenchidos automaticamente.");
        } else {
          toast.error("O NIF informado não é válido ou não foi encontrado.");
        }
      } catch (error) {
        toast.error("Tente novamente ou preencha os dados manualmente.");
      } finally {
        setNifChecking(false);
      }
    }
  };

  return (
    <div className="flex min-h-screen font-sans bg-gray-100">
      {/* Coluna Esquerda - Promocional */}
      <div className="hidden md:flex flex-col justify-between w-1/2 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 shadow-lg relative">
        <img
          src="/public/login.png"
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

      {/* Coluna Direita - Formulário */}
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
          <p className="text-center text-gray-700 mb-1">Bem-vindo de volta! Por favor, insira seus detalhes</p>
          <p className="text-center text-blue-700 text-sm mb-4">Após o login, você será redirecionado para finalizar sua compra.</p>
          {/* Abas de navegação */}
          <div className="flex w-full mb-6 rounded-lg overflow-hidden border border-gray-200 bg-[#f2f2f2]">
            <Link to="/login" className="flex-1 py-2 text-center text-gray-500 hover:text-blue-800">Entrar</Link>
            <button className="flex-1 py-2 font-semibold text-blue-800 bg-white border-l border-gray-200">Criar Conta</button>
          </div>
          {/* Formulário de Registro */}
          <Card className="shadow-none border-0 p-0">
            <CardContent className="p-0">
              <RegisterForm onAuthSuccess={handleAuthSuccess} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
