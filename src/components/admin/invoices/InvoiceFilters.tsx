
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Search, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface InvoiceFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  dateFilter: Date | undefined;
  setDateFilter: (date: Date | undefined) => void;
  clearFilters: () => void;
}

export default function InvoiceFilters({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  dateFilter,
  setDateFilter,
  clearFilters
}: InvoiceFiltersProps) {
  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
          {/* Search */}
          <div className="relative flex-1 w-full lg:max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="search"
              placeholder="Buscar por cliente ou número da fatura..."
              className="pl-10 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="issued">Emitida</SelectItem>
              <SelectItem value="paid">Paga</SelectItem>
              <SelectItem value="canceled">Cancelada</SelectItem>
              <SelectItem value="draft">Pendente</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Date Filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2 w-full sm:w-auto">
                <Calendar className="h-4 w-4" />
                {dateFilter ? format(dateFilter, "dd/MM/yyyy") : "Data"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <CalendarComponent
                mode="single"
                selected={dateFilter}
                onSelect={setDateFilter}
                initialFocus
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
          
          {/* Clear Filters */}
          {(searchQuery || statusFilter !== "all" || dateFilter) && (
            <Button variant="ghost" onClick={clearFilters} className="w-full sm:w-auto">
              Limpar filtros
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
