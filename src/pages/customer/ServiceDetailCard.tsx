
import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarIcon, ArrowRight, AlertTriangle, CheckCircle } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { Link } from "react-router-dom";
import { Service } from "@/types/service";

interface ServiceDetailCardProps {
  service: Service;
}

const ServiceDetailCard = ({ service }: ServiceDetailCardProps) => {
  // Determine if service is close to expiration (30 days)
  const isCloseToExpiration = () => {
    if (!service.end_date) return false;
    const endDate = new Date(service.end_date);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays > 0;
  };

  // Get badge variant based on status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'pending':
        return 'default';
      case 'suspended':
        return 'warning';
      case 'expired':
      case 'canceled':
        return 'destructive';
      default:
        return 'default';
    }
  };

  const formatServiceStatus = (status: string) => {
    switch (status) {
      case 'active':
        return 'Ativo';
      case 'pending':
        return 'Pendente';
      case 'suspended':
        return 'Suspenso';
      case 'expired':
        return 'Expirado';
      case 'canceled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  return (
    <Card className={`overflow-hidden transition-all duration-300 hover:shadow-md ${
      service.status === 'active' ? 'border-green-200' : 
      service.status === 'suspended' ? 'border-amber-200' : 
      service.status === 'expired' || service.status === 'canceled' ? 'border-red-200' : 'border-gray-200'
    }`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{service.name}</CardTitle>
          <Badge variant={getStatusBadge(service.status)}>
            {formatServiceStatus(service.status)}
          </Badge>
        </div>
        <CardDescription>
          {service.config && service.config.plan ? `Plano: ${service.config.plan}` : 'Serviço'}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-4">
        {service.activation_date && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <CalendarIcon className="h-4 w-4" />
            <span>Ativado em: {formatDateTime(service.activation_date)}</span>
          </div>
        )}
        
        {service.end_date && (
          <div className="flex items-center gap-2 text-sm mt-2">
            <CalendarIcon className="h-4 w-4" />
            <span className={isCloseToExpiration() ? "text-amber-600 font-medium" : ""}>
              {isCloseToExpiration() ? (
                <div className="flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-1 text-amber-500" />
                  Expira em: {formatDateTime(service.end_date)}
                </div>
              ) : (
                <>Expira em: {formatDateTime(service.end_date)}</>
              )}
            </span>
          </div>
        )}
        
        {service.auto_renew && (
          <div className="mt-2 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-sm text-green-700">Renovação automática ativa</span>
          </div>
        )}
      </CardContent>
      <CardFooter className="bg-muted/40 pt-2">
        <Button asChild variant="ghost" size="sm" className="ml-auto">
          <Link to={`/customer/services/${service.id}`}>
            Gerenciar
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ServiceDetailCard;
