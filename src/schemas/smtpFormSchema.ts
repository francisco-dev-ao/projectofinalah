import * as z from "zod";

// Define validation schema for SMTP configuration
export const smtpFormSchema = z.object({
  smtp_host: z.string().min(1, { message: "Servidor SMTP é obrigatório" }),
  smtp_port: z.string().min(1, { message: "Porta é obrigatória" }),
  auth: z.object({
    user: z.string().min(1, { message: "Usuário é obrigatório" }),
    pass: z.string().min(1, { message: "Senha é obrigatória" })
  }),
  secure: z.string(),
  from_email: z.string().email({ message: "Email de envio inválido" }),
  from_name: z.string().min(1, { message: "Nome de exibição é obrigatório" })
});

export type SmtpFormValues = z.infer<typeof smtpFormSchema>;

// Transform form values to expected email_config format for Supabase
export const transformToEmailConfig = (values: SmtpFormValues) => {
  // Adiciona logs para ajudar na depuração
  console.log("Transformando valores do formulário:", JSON.stringify(values, null, 2));
  
  // Preserva o valor original de secure
  const secureValue = values.secure;
  console.log("Valor de secure a ser salvo:", secureValue);
  
  // Verifica a porta para SSL/TLS comum
  const port = parseInt(values.smtp_port);
  console.log(`Porta ${port} detectada`);
  
  if (port === 465 && secureValue !== "ssl") {
    console.log("AVISO: Porta 465 geralmente usa SSL. Verifique a configuração.");
  } else if (port === 587 && secureValue !== "tls") {
    console.log("AVISO: Porta 587 geralmente usa TLS. Verifique a configuração.");
  }
  
  // Garantir que o valor não seja alterado acidentalmente
  const emailConfig = {
    smtp_host: values.smtp_host,
    smtp_port: port,
    secure: secureValue, // Mantém o valor original (tls, ssl, none)
    auth: {
      user: values.auth.user,
      pass: values.auth.pass
    },
    from_email: values.from_email,
    from_name: values.from_name,
    // Adiciona flag para forçar atualização
    last_updated: new Date().toISOString()
  };
  
  console.log("Configuração transformada:", JSON.stringify(emailConfig, null, 2));
  return emailConfig;
};
