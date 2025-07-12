import { 
  FormField, 
  FormItem, 
  FormLabel, 
  FormControl, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { SmtpFormValues } from "@/schemas/smtpFormSchema";
import { UseFormReturn } from "react-hook-form";
import { useEffect } from "react";

interface SmtpFormFieldsProps {
  form: UseFormReturn<SmtpFormValues>;
}

export const SmtpFormFields = ({ form }: SmtpFormFieldsProps) => {
  useEffect(() => {
    console.log("Valor atual de secure:", form.getValues().secure);
    
    const subscription = form.watch((value, { name }) => {
      if (name === 'secure' || !name) {
        console.log("Secure mudou para:", value.secure);
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField
        control={form.control}
        name="smtp_host"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Servidor SMTP</FormLabel>
            <FormControl>
              <Input placeholder="smtp.seuservidor.com" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="smtp_port"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Porta</FormLabel>
            <FormControl>
              <Input placeholder="587" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="auth.user"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Usuário</FormLabel>
            <FormControl>
              <Input placeholder="seu@email.com" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="auth.pass"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Senha</FormLabel>
            <FormControl>
              <Input type="password" placeholder="••••••••" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="from_email"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Email de Envio</FormLabel>
            <FormControl>
              <Input placeholder="noreply@seudominio.com" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="from_name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nome de Exibição</FormLabel>
            <FormControl>
              <Input placeholder="AngoHost" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="secure"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Segurança</FormLabel>
            <Select 
              value={field.value} 
              onValueChange={(value) => {
                field.onChange(value);
                console.log("Select alterado para:", value);
                form.setValue('secure', value, { shouldValidate: true, shouldDirty: true });
              }}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de segurança" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="tls">TLS</SelectItem>
                <SelectItem value="ssl">SSL</SelectItem>
                <SelectItem value="none">Nenhuma</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};
