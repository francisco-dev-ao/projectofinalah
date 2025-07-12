
export const getStatusClass = (status: string) => {
  switch (status) {
    case 'paid':
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    case 'issued':
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
    case 'canceled':
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
  }
};

export const getStatusInPortuguese = (status: string) => {
  const statusMap: Record<string, string> = {
    draft: 'Pendente',
    issued: 'Emitida',
    paid: 'Paga',
    canceled: 'Cancelada'
  };
  
  return statusMap[status] || status;
};

export const getUniqueClients = (invoices: any[]) => {
  const clientsMap = new Map();
  invoices.forEach(invoice => {
    if (invoice.orders?.user_id && invoice.orders?.profiles) {
      const clientId = invoice.orders.user_id;
      const clientName = invoice.orders.profiles.name || invoice.orders.profiles.company_name || 'Cliente';
      if (!clientsMap.has(clientId)) {
        clientsMap.set(clientId, clientName);
      }
    }
  });
  return Array.from(clientsMap.entries()).map(([id, name]) => ({ id, name }));
};
