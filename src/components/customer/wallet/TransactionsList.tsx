import { useEffect, useState } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowUp, 
  ArrowDown, 
  Filter,
  CreditCard,
  Wallet,
  History 
} from "lucide-react";
import { WalletTransaction, TransactionFilters } from "@/types/wallet";
import { formatCurrency } from "@/utils/format";
import { addDays, format, subDays } from "date-fns";
import { DateRange } from "react-day-picker";

interface TransactionsListProps {
  transactions: WalletTransaction[];
  isLoading: boolean;
  totalCount: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  onFilterChange: (filters: TransactionFilters) => void;
}

const TransactionsList = ({
  transactions,
  isLoading,
  totalCount,
  currentPage,
  onPageChange,
  onFilterChange
}: TransactionsListProps) => {
  const [date, setDate] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [type, setType] = useState<string | undefined>(undefined);
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [isFilterApplied, setIsFilterApplied] = useState(false);
  const pageSize = 10;
  const totalPages = Math.ceil(totalCount / pageSize);

  // Fix the date formatting to use only one argument
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy HH:mm');
  };

  useEffect(() => {
    if (isFilterApplied) {
      const filters: TransactionFilters = {};
      
      if (date?.from) {
        filters.startDate = date.from;
      }
      
      if (date?.to) {
        // Add one day to include the end date
        filters.endDate = addDays(date.to, 1);
      }
      
      if (type) {
        filters.type = type as any;
      }
      
      if (category) {
        filters.category = category as any;
      }
      
      onFilterChange(filters);
    }
  }, [isFilterApplied, date, type, category, onFilterChange]);

  const applyFilters = () => {
    setIsFilterApplied(true);
  };

  const resetFilters = () => {
    setDate({
      from: subDays(new Date(), 30),
      to: new Date(),
    });
    setType(undefined);
    setCategory(undefined);
    setIsFilterApplied(false);
    onFilterChange({});
  };

  const renderTransactionItem = (transaction: WalletTransaction) => {
    const isCredit = transaction.type === 'credit';
    const icon = isCredit ? 
      <ArrowDown className="h-4 w-4 text-green-500" /> : 
      <ArrowUp className="h-4 w-4 text-red-500" />;
    
    const amountColor = isCredit ? 'text-green-600' : 'text-red-600';

    return (
      <TableRow key={transaction.id}>
        <TableCell className="font-medium">
          <div className="flex items-center gap-2">
            {icon}
            <span>{transaction.description}</span>
          </div>
        </TableCell>
        <TableCell>{getCategoryText(transaction.category)}</TableCell>
        <TableCell>
          <span className={`font-medium ${amountColor}`}>
            {isCredit ? '+' : '-'} {formatCurrency(transaction.amount)}
          </span>
        </TableCell>
        <TableCell>{getStatusBadge(transaction.status)}</TableCell>
        <TableCell className="text-right">
          {formatDate(transaction.created_at)}
        </TableCell>
      </TableRow>
    );
  };

  const getCategoryText = (category: string) => {
    switch (category) {
      case 'deposit': return 'Depósito';
      case 'withdrawal': return 'Saque';
      case 'transfer_in': return 'Transferência recebida';
      case 'transfer_out': return 'Transferência enviada';
      case 'payment': return 'Pagamento';
      case 'refund': return 'Reembolso';
      case 'admin_adjustment': return 'Ajuste administrativo';
      default: return category;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Concluído</span>;
      case 'pending':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Pendente</span>;
      case 'failed':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Falhou</span>;
      case 'cancelled':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Cancelado</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  return (
    <Card className="bg-white shadow-md hover:shadow-lg transition-shadow duration-300 border-none">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl font-bold text-gray-800 flex items-center">
            <History className="mr-2 h-5 w-5 text-primary" />
            Histórico de Transações
          </CardTitle>
          <CardDescription>
            Visualize todas as suas movimentações financeiras
          </CardDescription>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setFiltersVisible(!filtersVisible)}
          className={filtersVisible ? "bg-primary/10" : ""}
        >
          <Filter className="mr-2 h-4 w-4" />
          Filtrar
        </Button>
      </CardHeader>
      <CardContent>
        {filtersVisible && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Período</label>
                <DatePickerWithRange 
                  date={date} 
                  setDate={setDate} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos</SelectItem>
                    <SelectItem value="credit">Entrada</SelectItem>
                    <SelectItem value="debit">Saída</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas</SelectItem>
                    <SelectItem value="deposit">Depósito</SelectItem>
                    <SelectItem value="withdrawal">Saque</SelectItem>
                    <SelectItem value="transfer_in">Transferência recebida</SelectItem>
                    <SelectItem value="transfer_out">Transferência enviada</SelectItem>
                    <SelectItem value="payment">Pagamento</SelectItem>
                    <SelectItem value="refund">Reembolso</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end gap-2">
                <Button onClick={applyFilters} className="flex-1">
                  Aplicar Filtros
                </Button>
                <Button variant="outline" onClick={resetFilters}>
                  Limpar
                </Button>
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-8 text-center">
            <Wallet className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma transação encontrada</h3>
            <p className="mt-1 text-sm text-gray-500">
              {isFilterApplied 
                ? "Não há transações que correspondam aos filtros selecionados."
                : "Comece a usar sua carteira fazendo um depósito."}
            </p>
          </div>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map(renderTransactionItem)}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-500">
                  Mostrando {Math.min(pageSize * (currentPage - 1) + 1, totalCount)} 
                  -{" "}
                  {Math.min(pageSize * currentPage, totalCount)} de {totalCount} resultados
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                  >
                    Próximo
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default TransactionsList;
