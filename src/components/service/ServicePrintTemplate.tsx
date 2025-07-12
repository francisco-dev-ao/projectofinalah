import React, { forwardRef } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import styles from './PrintTemplates.module.css';

interface ServicePrintTemplateProps {
  service: any;
}

// Componente de impressão de serviço usando React
const ServicePrintTemplate = forwardRef<HTMLDivElement, ServicePrintTemplateProps>((props, ref) => {
  const { service } = props;
  
  // Função para formatar status
  const formatStatus = (status: string) => {
    if (!status) return '';
    
    const statusMap: Record<string, string> = {
      'active': 'Ativo',
      'pending': 'Pendente',
      'suspended': 'Suspenso',
      'canceled': 'Cancelado'
    };
    
    return statusMap[status.toLowerCase()] || status;
  };
  
  return (
    <div ref={ref} className={styles.printContainer}>
      {/* Cabeçalho */}
      <div className={styles.header}>
        <div className={styles.logo}>
          <img src="/ANGOHOST-01.png" alt="AngoHost Logo" />
        </div>
        <div className={styles.documentNumber}>
          <h2>SERVIÇO</h2>
          <p>Nome: {service.service_name || service.id}</p>
          <p>Emitido: {format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
        </div>
      </div>
      
      <hr className={styles.divider} />
      
      {/* Informações da Empresa */}
      <div className={styles.companyInfo}>
        <h3>AngoHost</h3>
        <p>Luanda, Angola</p>
        <p>NIF: 5000088927</p>
        <p>support@angohost.ao</p>
        <p>+244 942 090108</p>
      </div>
      
      {/* Detalhes do Serviço */}
      <div className={styles.serviceDetails}>
        <h3>Detalhes do Serviço:</h3>
        
        <div className={styles.detailsGrid}>
          <div className={styles.detailItem}>
            <p><strong>Nome:</strong> {service.service_name || 'N/A'}</p>
          </div>
          <div className={styles.detailItem}>
            <p><strong>Status:</strong> {formatStatus(service.status)}</p>
          </div>
          <div className={styles.detailItem}>
            <p><strong>Data de Criação:</strong> {format(new Date(service.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
          </div>
          {service.activation_date && (
            <div className={styles.detailItem}>
              <p><strong>Data de Ativação:</strong> {format(new Date(service.activation_date), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
            </div>
          )}
          {service.expiration_date && (
            <div className={styles.detailItem}>
              <p><strong>Data de Expiração:</strong> {format(new Date(service.expiration_date), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
            </div>
          )}
        </div>
        
        {service.description && (
          <div className={styles.serviceDescription}>
            <h4>Descrição:</h4>
            <p>{service.description}</p>
          </div>
        )}
      </div>
      
      {/* Carimbo e Assinatura */}
      <div className={styles.stampSignature}>
        <img src="/lovable-uploads/e588f3a2-9ad0-463d-8c9f-2d2eebebc765.png" alt="Carimbo" />
      </div>
      
      {/* Rodapé */}
      <div className={styles.footer}>
        <hr className={styles.divider} />
        <p>AngoHost - {new Date().getFullYear()}</p>
        <p>Este documento foi gerado eletronicamente e é válido sem assinatura.</p>
      </div>
    </div>
  );
});

ServicePrintTemplate.displayName = 'ServicePrintTemplate';

export default ServicePrintTemplate;
