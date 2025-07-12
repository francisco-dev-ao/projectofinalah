import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Search,
  Filter,
  Edit,
  Save,
  Banknote
} from "lucide-react";
import { toast } from "sonner";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { formatPrice } from "@/lib/utils";

// Product category types
type ProductCategory = "hosting" | "domain" | "email" | "exchange" | "other";

// Product type with prices
interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  currentPrice: number;
  renewalPrice: number | null;
  duration: string;
  description?: string;
}

// Mock data for products
const mockProducts: Product[] = [
  {
    id: "prod_1",
    name: "Hospedagem Básica",
    category: "hosting",
    currentPrice: 9500,
    renewalPrice: 10000,
    duration: "monthly",
    description: "Plano básico de hospedagem web"
  },
  {
    id: "prod_2",
    name: "Hospedagem Empresarial",
    category: "hosting",
    currentPrice: 15000,
    renewalPrice: 15000,
    duration: "monthly",
    description: "Plano intermediário de hospedagem web"
  },
  {
    id: "prod_3",
    name: "Hospedagem VPS",
    category: "hosting",
    currentPrice: 25000,
    renewalPrice: 25000,
    duration: "monthly",
    description: "Servidor virtual privado"
  },
  {
    id: "prod_4",
    name: "Domínio .ao",
    category: "domain",
    currentPrice: 30000,
    renewalPrice: 30000,
    duration: "yearly",
    description: "Registro de domínio .ao"
  },
  {
    id: "prod_5",
    name: "Domínio .co.ao",
    category: "domain",
    currentPrice: 25000,
    renewalPrice: 25000,
    duration: "yearly",
    description: "Registro de domínio .co.ao"
  },
  {
    id: "prod_6",
    name: "Email Básico",
    category: "email",
    currentPrice: 8000,
    renewalPrice: 8000,
    duration: "yearly",
    description: "Email corporativo básico"
  },
  {
    id: "prod_7",
    name: "Email Premium",
    category: "email",
    currentPrice: 12000,
    renewalPrice: 14000,
    duration: "yearly",
    description: "Email corporativo com recursos avançados"
  },
  {
    id: "prod_8",
    name: "Exchange Online",
    category: "exchange",
    currentPrice: 18000,
    renewalPrice: 18000,
    duration: "yearly",
    description: "Microsoft Exchange Online"
  },
  {
    id: "prod_9",
    name: "Certificado SSL",
    category: "other",
    currentPrice: 15000,
    renewalPrice: 15000,
    duration: "yearly",
    description: "Certificado SSL para segurança do site"
  },
  {
    id: "prod_10",
    name: "Backup Avançado",
    category: "other",
    currentPrice: 7500,
    renewalPrice: 7500,
    duration: "monthly",
    description: "Serviço de backup avançado para hospedagem"
  },
];

// Category display configuration
const categoryConfig = {
  hosting: { label: "Hospedagem", color: "bg-blue-500" },
  domain: { label: "Domínios", color: "bg-red-500" },
  email: { label: "Email", color: "bg-orange-500" },
  exchange: { label: "Exchange", color: "bg-yellow-500" },
  other: { label: "Outros", color: "bg-purple-500" }
};

// Duration display configuration
const durationLabels = {
  monthly: "Mensal",
  quarterly: "Trimestral", 
  yearly: "Anual",
  "2years": "2 Anos",
  "3years": "3 Anos"
};

const PriceManagement = () => {
  const { addAuditLogEntry } = useAdminAuth();
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<ProductCategory | "all">("all");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editValues, setEditValues] = useState({
    currentPrice: 0,
    renewalPrice: 0,
  });
  
  // Filter products based on search term and category filter
  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()));
      
    const matchesCategory = categoryFilter === "all" || product.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  // Format duration
  const formatDuration = (duration: string): string => {
    return durationLabels[duration as keyof typeof durationLabels] || duration;
  };

  // Render category badge
  const renderCategoryBadge = (category: ProductCategory) => {
    const config = categoryConfig[category];
    return (
      <Badge className={`${config.color} text-white`}>
        {config.label}
      </Badge>
    );
  };

  // Handle price edit click
  const handleEditPrice = (product: Product) => {
    setSelectedProduct(product);
    setEditValues({
      currentPrice: product.currentPrice,
      renewalPrice: product.renewalPrice || 0,
    });
    setIsEditDialogOpen(true);
  };

  // Handle save price changes
  const handleSavePriceChanges = () => {
    if (!selectedProduct) return;
    
    // Validate prices
    if (editValues.currentPrice <= 0) {
      toast.error("O preço atual deve ser maior que zero.");
      return;
    }
    
    if (selectedProduct.renewalPrice !== null && editValues.renewalPrice <= 0) {
      toast.error("O preço de renovação deve ser maior que zero.");
      return;
    }

    // Update the product price
    const updatedProducts = products.map(product => 
      product.id === selectedProduct.id 
        ? {
            ...product,
            currentPrice: editValues.currentPrice,
            renewalPrice: selectedProduct.renewalPrice !== null ? editValues.renewalPrice : null
          }
        : product
    );
    
    // Log the price change in audit log
    const priceChangeDetails = `Alterou preço de '${selectedProduct.name}' de ${formatPrice(selectedProduct.currentPrice)} para ${formatPrice(editValues.currentPrice)}`;
    
    addAuditLogEntry("PRICE_CHANGE", priceChangeDetails);
    
    // Update state and close dialog
    setProducts(updatedProducts);
    setIsEditDialogOpen(false);
    
    // Show success toast
    toast.success(`O preço de ${selectedProduct.name} foi atualizado com sucesso.`);
  };

  return (
    <AdminLayout>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <div className="relative w-full md:w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar produtos..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select
            value={categoryFilter}
            onValueChange={(value) => setCategoryFilter(value as typeof categoryFilter)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Categorias</SelectItem>
              <SelectItem value="hosting">Hospedagem</SelectItem>
              <SelectItem value="domain">Domínios</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="exchange">Exchange</SelectItem>
              <SelectItem value="other">Outros</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border mb-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Preço Atual</TableHead>
              <TableHead>Preço de Renovação</TableHead>
              <TableHead>Duração</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                  Nenhum produto encontrado
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{product.name}</p>
                      {product.description && (
                        <p className="text-sm text-muted-foreground">{product.description}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{renderCategoryBadge(product.category)}</TableCell>
                  <TableCell>{formatPrice(product.currentPrice)}</TableCell>
                  <TableCell>
                    {product.renewalPrice !== null ? formatPrice(product.renewalPrice) : "N/A"}
                  </TableCell>
                  <TableCell>{formatDuration(product.duration)}</TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex items-center gap-1"
                      onClick={() => handleEditPrice(product)}
                    >
                      <Edit className="h-4 w-4" /> Editar preço
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Pagination component */}
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious href="#" />
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="#" isActive>1</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="#">2</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
          <PaginationItem>
            <PaginationNext href="#" />
          </PaginationItem>
        </PaginationContent>
      </Pagination>

      {/* Price Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Banknote className="h-5 w-5" /> Editar Preço
            </DialogTitle>
            <DialogDescription>
              {selectedProduct && (
                <>Atualizar os preços para <strong>{selectedProduct.name}</strong></>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="current-price" className="text-right">
                Preço Atual
              </Label>
              <div className="col-span-3 relative">
                <Input
                  id="current-price"
                  type="number"
                  className="pl-2" 
                  value={editValues.currentPrice}
                  onChange={(e) => setEditValues({
                    ...editValues,
                    currentPrice: parseFloat(e.target.value) || 0
                  })}
                />
                <span className="absolute right-2 top-2.5 text-sm text-muted-foreground">Kz</span>
              </div>
            </div>
            
            {selectedProduct?.renewalPrice !== null && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="renewal-price" className="text-right">
                  Preço de Renovação
                </Label>
                <div className="col-span-3 relative">
                  <Input
                    id="renewal-price"
                    type="number"
                    className="pl-2"
                    value={editValues.renewalPrice}
                    onChange={(e) => setEditValues({
                      ...editValues,
                      renewalPrice: parseFloat(e.target.value) || 0
                    })}
                  />
                  <span className="absolute right-2 top-2.5 text-sm text-muted-foreground">Kz</span>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSavePriceChanges}
              className="flex items-center gap-1"
            >
              <Save className="h-4 w-4" /> Salvar alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default PriceManagement;
