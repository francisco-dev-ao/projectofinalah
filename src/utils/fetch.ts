// Sobrecarregar a função fetch para interceptar chamadas a get_invoice_items
const originalFetch = window.fetch;

window.fetch = async function(input: RequestInfo | URL, init?: RequestInit) {
  const url = input.toString();
  
  // Interceptar chamadas para get_invoice_items
  if (url.includes('get_invoice_items')) {
    console.log('⚠️ Interceptando chamada à API get_invoice_items que não existe mais');
    
    // Extrair o ID da fatura da URL ou do corpo
    let invoiceId = '';
    
    if (init?.body) {
      try {
        const body = JSON.parse(init.body.toString());
        invoiceId = body.invoice_id;
      } catch (e) {
        console.error('Erro ao extrair invoice_id do corpo da requisição');
      }
    } else if (url.includes('invoice_id=')) {
      invoiceId = url.split('invoice_id=')[1].split('&')[0];
    }
    
    if (!invoiceId) {
      return new Response(JSON.stringify({ 
        error: { message: 'ID da fatura não encontrado' } 
      }), { status: 400 });
    }
    
    // Usar nossa função local para buscar os itens
    const { data: invoiceItems, error } = await import('./invoiceUtils')
      .then(module => module.getInvoiceItems(invoiceId));
      
    if (error) {
      return new Response(JSON.stringify({ error }), { status: 500 });
    }
    
    return new Response(JSON.stringify({ data: invoiceItems }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // Caso contrário, usar o fetch original
  return originalFetch(input, init);
};

export {};