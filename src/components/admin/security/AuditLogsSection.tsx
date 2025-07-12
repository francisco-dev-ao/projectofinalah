
import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  details?: string;
  created_at: string;
  ip_address?: string;
  user_name?: string;
  user_email?: string;
  profiles?: {
    name?: string;
    email?: string;
    role?: string;
  } | null | any; // Adding any to handle the Supabase error case
}

interface AuditLogsSectionProps {
  logs: AuditLog[];
  loading: boolean;
  onRefresh?: () => void;
}

const AuditLogsSection = ({ logs, loading, onRefresh }: AuditLogsSectionProps) => {
  if (loading) {
    return <div className="p-4 text-center">Carregando logs...</div>;
  }
  
  if (!logs || logs.length === 0) {
    return <div className="p-4 text-center">Nenhum log de auditoria encontrado</div>;
  }
  
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data/Hora</TableHead>
            <TableHead>Usuário</TableHead>
            <TableHead>Ação</TableHead>
            <TableHead>Detalhes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <TableRow key={log.id}>
              <TableCell>
                {new Date(log.created_at).toLocaleString('pt-BR')}
              </TableCell>
              <TableCell>
                {log.profiles?.name || log.user_name || log.user_id}
              </TableCell>
              <TableCell>{log.action}</TableCell>
              <TableCell>{log.details || '-'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default AuditLogsSection;
