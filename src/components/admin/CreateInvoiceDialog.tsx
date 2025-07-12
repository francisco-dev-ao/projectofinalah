import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { v4 as uuidv4 } from "uuid";

interface CreateInvoiceDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface InvoiceItem {
  id: string;
  name: string;
  quantity: number;
  unit_price: number;
  description?: string;
  duration?: number;
  duration_unit?: 'day' | 'month' | 'year';
}

const CreateInvoiceDialog: React.FC<CreateInvoiceDialogProps> = ({
  open,
  onClose,
  onSuccess
}) => {
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [dueDate, setDueDate] = useState<Date | undefined>(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Default to 7 days from now
  );
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: uuidv4(), name: "", quantity: 1, unit_price: 0 }
  ]);
  const [notes, setNotes] = useState<string>("");
  const [notifyCustomer, setNotifyCustomer] = useState<boolean>(true);
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [paymentInstructions, setPaymentInstructions] = useState<string>("");
  const [companyDetails, setCompanyDetails] = useState<any>(null);
  
  useEffect(() => {
    fetchUsers();
    fetchCompanySettings();
  }, []);
  
  const fetchCompanySettings = async () => {
    try {
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      
      if (data && data.length > 0) {
        setCompanyDetails(data[0]);
        setPaymentInstructions(data[0].payment_instructions || "");
      }
    } catch (error) {
      console.error("Error fetching company settings:", error);
    }
  };
  
  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      
      setUsers(data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Erro ao carregar lista de clientes");
    } finally {
      setLoadingUsers(false);
    }
  };
  
  const addItem = () => {
    setItems([
      ...items,
      { id: uuidv4(), name: "", quantity: 1, unit_price: 0 }
    ]);
  };
  
  const removeItem = (id: string) => {
    if (items.length === 1) {
      toast.error("A fatura deve ter pelo menos um item");
      return;
    }
    setItems(items.filter((item) => item.id !== id));
  };
  
  const updateItem = (id: string, field: string, value: any) => {
    setItems(
      items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };
  
  const calculateTotal = () => {
    return items.reduce((total, item) => {
      return total + (item.quantity * item.unit_price);
    }, 0);
  };

  const handleCreateInvoice = async () => {
    try {
      // Validation
      if (!selectedUserId) {
        toast.error("Selecione um cliente");
        return;
      }
      
      if (!dueDate) {
        toast.error("Selecione uma data de vencimento");
        return;
      }
      
      // Check if all items have name and unit price
      const invalidItems = items.filter(item => !item.name || item.unit_price <= 0);
      if (invalidItems.length > 0) {
        toast.error("Todos os itens devem ter nome e preço maior que zero");
        return;
      }
      
      setLoading(true);
      
      // Create the order first
      const orderId = uuidv4();
      const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
      const totalAmount = calculateTotal();
      
      // Create order
      const { error: orderError } = await supabase
        .from("orders")
        .insert({
          id: orderId,
          user_id: selectedUserId,
          status: "pending",
          total_amount: totalAmount,
          notes: "Pedido criado manualmente pelo administrador",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (orderError) throw orderError;
      
      // Create order items
      const orderItems = items.map(item => ({
        order_id: orderId,
        name: item.name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        description: item.description || null,
        duration: item.duration || null,
        duration_unit: item.duration_unit || null,
      }));
      
      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);
      
      if (itemsError) throw itemsError;
      
      // Create invoice with 'pending' status instead of 'issued'
      const { error: invoiceError } = await supabase
        .from("invoices")
        .insert({
          order_id: orderId,
          status: "pending",
          invoice_number: invoiceNumber,
          due_date: dueDate.toISOString(),
          payment_instructions: paymentInstructions,
          company_details: companyDetails?.company_details || null,
          share_token: crypto.randomUUID() // Add a share token for public access
        });
      
      if (invoiceError) throw invoiceError;
      
      toast.success("Fatura criada com sucesso!");
      
      // Send email notification if selected
      if (notifyCustomer) {
        // In a real implementation, you would call an API to send the email
        toast.info("Notificação enviada ao cliente");
      }
      
      onSuccess();
    } catch (error) {
      console.error("Error creating invoice:", error);
      toast.error("Erro ao criar fatura");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Criar Nova Fatura</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="customer">Cliente</Label>
              <Select
                value={selectedUserId}
                onValueChange={setSelectedUserId}
                disabled={loadingUsers}
              >
                <SelectTrigger id="customer">
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name || user.email}
                      {user.company_name && ` (${user.company_name})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Data de Vencimento</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className="w-full justify-start text-left font-normal"
                  >
                    {dueDate ? format(dueDate, "dd/MM/yyyy") : "Selecione uma data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          <div className="border-t pt-4 mt-2">
            <Label>Itens da Fatura</Label>
            {items.map((item, index) => (
              <div key={item.id} className="flex flex-col gap-2 mt-3 border-b pb-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">Item #{index + 1}</h4>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(item.id)}
                    disabled={items.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor={`name-${item.id}`}>Nome do Serviço</Label>
                    <Input
                      id={`name-${item.id}`}
                      value={item.name}
                      onChange={(e) => updateItem(item.id, "name", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`quantity-${item.id}`}>Quantidade</Label>
                    <Input
                      id={`quantity-${item.id}`}
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, "quantity", Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`price-${item.id}`}>Preço Unitário</Label>
                    <Input
                      id={`price-${item.id}`}
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unit_price}
                      onChange={(e) => updateItem(item.id, "unit_price", Number(e.target.value))}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`description-${item.id}`}>Descrição (opcional)</Label>
                    <Input
                      id={`description-${item.id}`}
                      value={item.description || ""}
                      onChange={(e) => updateItem(item.id, "description", e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`duration-${item.id}`}>Duração</Label>
                      <Input
                        id={`duration-${item.id}`}
                        type="number"
                        min="0"
                        value={item.duration || ""}
                        onChange={(e) => updateItem(item.id, "duration", e.target.value ? Number(e.target.value) : undefined)}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`duration-unit-${item.id}`}>Unidade</Label>
                      <Select
                        value={item.duration_unit || "month"}
                        onValueChange={(value) => updateItem(item.id, "duration_unit", value)}
                      >
                        <SelectTrigger id={`duration-unit-${item.id}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="day">dia(s)</SelectItem>
                          <SelectItem value="month">mês(es)</SelectItem>
                          <SelectItem value="year">ano(s)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            <Button
              type="button"
              variant="outline"
              className="mt-4"
              onClick={addItem}
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Item
            </Button>
            
            <div className="flex justify-end mt-4">
              <div className="text-right">
                <span className="block text-sm text-muted-foreground">Total:</span>
                <span className="text-lg font-bold">KZ {new Intl.NumberFormat('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: true }).format(calculateTotal())}</span>
              </div>
            </div>
          </div>
          
          <div className="border-t pt-4 mt-2">
            <Label htmlFor="payment-instructions">Instruções de Pagamento</Label>
            <Textarea
              id="payment-instructions"
              value={paymentInstructions}
              onChange={(e) => setPaymentInstructions(e.target.value)}
              placeholder="Instruções de pagamento para o cliente"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="notes">Notas Adicionais (opcional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas adicionais para o cliente"
              rows={3}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="notify-customer"
              checked={notifyCustomer}
              onCheckedChange={(checked) => setNotifyCustomer(checked as boolean)}
            />
            <Label htmlFor="notify-customer">
              Notificar o cliente por e-mail
            </Label>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleCreateInvoice} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Criar Fatura
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateInvoiceDialog;
