import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LifeBuoy, MessageCircle, PlusCircle } from "lucide-react";
import { toast } from "sonner";
import CustomerLayout from "@/components/customer/CustomerLayout";

// Mock tickets data
const mockTickets = [
  { 
    id: 2001, 
    date: '2024-04-28', 
    subject: 'Problema com renovação de domínio', 
    status: 'open',
    replies: 2
  },
  { 
    id: 2002, 
    date: '2024-04-15', 
    subject: 'Dúvida sobre migração de email', 
    status: 'closed',
    replies: 3
  },
  { 
    id: 2003, 
    date: '2024-03-10', 
    subject: 'Erro ao acessar painel de controle', 
    status: 'closed',
    replies: 4
  },
];

// New ticket form schema
const ticketSchema = z.object({
  subject: z.string().min(5, { message: "Assunto deve ter pelo menos 5 caracteres" }),
  department: z.string({ required_error: "Selecione um departamento" }),
  priority: z.string({ required_error: "Selecione uma prioridade" }),
  message: z.string().min(20, { message: "Mensagem deve ter pelo menos 20 caracteres" }),
  attachments: z.any().optional(),
});

const CustomerSupport = () => {
  const [activeTab, setActiveTab] = useState("tickets");
  
  // New ticket form
  const ticketForm = useForm<z.infer<typeof ticketSchema>>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      subject: "",
      department: "technical",
      priority: "medium",
      message: "",
    },
  });

  // Function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-AO', { 
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };

  // Get status badge variant
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return 'default';
      case 'pending':
        return 'warning';
      case 'closed':
        return 'secondary';
      case 'urgent':
        return 'destructive';
      default:
        return 'default';
    }
  };

  // Get status label in Portuguese
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open':
        return 'Aberto';
      case 'pending':
        return 'Pendente';
      case 'closed':
        return 'Fechado';
      case 'urgent':
        return 'Urgente';
      default:
        return status;
    }
  };

  const onTicketSubmit = (data: z.infer<typeof ticketSchema>) => {
    toast.success("Seu ticket de suporte foi criado com sucesso. Responderemos em breve.");
    ticketForm.reset();
    setActiveTab("tickets");
  };

  return (
    <CustomerLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl font-bold">Suporte</h1>
          <Button onClick={() => setActiveTab("new")} className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4" /> Novo Ticket
          </Button>
        </div>

        <Tabs defaultValue="tickets" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="tickets">Meus Tickets</TabsTrigger>
            <TabsTrigger value="new">Novo Ticket</TabsTrigger>
          </TabsList>
          
          {/* Tickets List */}
          <TabsContent value="tickets">
            <Card>
              <CardHeader className="border-b bg-muted/50">
                <CardTitle className="flex items-center gap-2">
                  <LifeBuoy className="h-5 w-5" /> Tickets de Suporte
                </CardTitle>
                <CardDescription>
                  Visualize e gerencie seus tickets de suporte
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ticket</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Assunto</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Respostas</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockTickets.map((ticket) => (
                        <TableRow key={ticket.id}>
                          <TableCell className="font-medium">#{ticket.id}</TableCell>
                          <TableCell>{formatDate(ticket.date)}</TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {ticket.subject}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadge(ticket.status)}>
                              {getStatusLabel(ticket.status)}
                            </Badge>
                          </TableCell>
                          <TableCell>{ticket.replies}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="outline" size="sm">Ver</Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* New Ticket Form */}
          <TabsContent value="new">
            <Card>
              <CardHeader className="border-b bg-muted/50">
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" /> Novo Ticket de Suporte
                </CardTitle>
                <CardDescription>
                  Preencha o formulário para abrir um novo ticket de suporte
                </CardDescription>
              </CardHeader>
              <Form {...ticketForm}>
                <form onSubmit={ticketForm.handleSubmit(onTicketSubmit)}>
                  <CardContent className="space-y-4 pt-6">
                    <FormField
                      control={ticketForm.control}
                      name="subject"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Assunto</FormLabel>
                          <FormControl>
                            <Input placeholder="Resumo do seu problema ou questão" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={ticketForm.control}
                        name="department"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Departamento</FormLabel>
                            <FormControl>
                              <select
                                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                {...field}
                              >
                                <option value="technical">Suporte Técnico</option>
                                <option value="billing">Faturação</option>
                                <option value="sales">Vendas</option>
                                <option value="general">Geral</option>
                              </select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={ticketForm.control}
                        name="priority"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Prioridade</FormLabel>
                            <FormControl>
                              <select
                                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                {...field}
                              >
                                <option value="low">Baixa</option>
                                <option value="medium">Média</option>
                                <option value="high">Alta</option>
                                <option value="urgent">Urgente</option>
                              </select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={ticketForm.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mensagem</FormLabel>
                          <FormControl>
                            <Textarea 
                              rows={5}
                              placeholder="Descreva seu problema ou dúvida em detalhes" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={ticketForm.control}
                      name="attachments"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Anexos (opcional)</FormLabel>
                          <FormControl>
                            <Input 
                              type="file" 
                              multiple 
                              className="cursor-pointer"
                              onChange={(e) => {
                                field.onChange(e.target.files);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                  <CardFooter className="flex justify-end gap-2 border-t bg-muted/50">
                    <Button variant="outline" type="button" onClick={() => setActiveTab("tickets")}>
                      Cancelar
                    </Button>
                    <Button type="submit">Enviar Ticket</Button>
                  </CardFooter>
                </form>
              </Form>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </CustomerLayout>
  );
};

export default CustomerSupport;
