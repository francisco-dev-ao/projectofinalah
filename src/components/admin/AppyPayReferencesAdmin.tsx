import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, Filter, RefreshCw } from 'lucide-react';
import { getAllAppyPayReferences, AppyPayReference } from '@/services/appyPayAdminService';
import { toast } from 'sonner';

export const AppyPayReferencesAdmin = () => {
  const [references, setReferences] = useState<AppyPayReference[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    amountFrom: '',
    amountTo: '',
    dateFrom: '',
    dateTo: '',
    limit: 50
  });

  const loadReferences = async () => {
    setLoading(true);
    try {
      const result = await getAllAppyPayReferences({
        ...filters,
        amountFrom: filters.amountFrom ? parseFloat(filters.amountFrom) : undefined,
        amountTo: filters.amountTo ? parseFloat(filters.amountTo) : undefined,
        dateFrom: filters.dateFrom || undefined,
        dateTo: filters.dateTo || undefined
      });
      setReferences(result.references || []);
    } catch (error) {
      toast.error('Erro ao carregar referências');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReferences();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Referências AppyPay
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            placeholder="Valor mínimo"
            value={filters.amountFrom}
            onChange={(e) => setFilters(prev => ({ ...prev, amountFrom: e.target.value }))}
          />
          <Input
            placeholder="Valor máximo"
            value={filters.amountTo}
            onChange={(e) => setFilters(prev => ({ ...prev, amountTo: e.target.value }))}
          />
          <Input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
          />
          <Button onClick={loadReferences} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {loading ? 'Carregando...' : 'Filtrar'}
          </Button>
        </div>

        {/* References Table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Referência</TableHead>
              <TableHead>Entidade</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Validade</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {references.map((ref) => (
              <TableRow key={ref.id}>
                <TableCell className="font-mono">{ref.referenceNumber}</TableCell>
                <TableCell>{ref.entity}</TableCell>
                <TableCell>{ref.amount} {ref.currency}</TableCell>
                <TableCell>{new Date(ref.expirationDate).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Badge variant={ref.isActive ? "default" : "secondary"}>
                    {ref.isActive ? 'Ativa' : 'Inativa'}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};