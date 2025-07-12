import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#f8fafc] text-[#273d74] border-t border-gray-200 text-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Topo: Logo e colunas */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-8 mb-8">
          {/* Coluna 1: Logo e selo */}
          <div className="md:col-span-1 flex flex-col gap-2 items-start">
            <img src="/ANGOHOST-01.png" alt="AngoHost" className="h-12 w-auto mb-2" />
            <p className="text-xs text-gray-500 max-w-[170px]">
              Junte-se a milhares de clientes satisfeitos.<br />
              Soluções de hospedagem e domínios para Angola.
            </p>
            <div className="flex flex-col gap-1 mt-2">
              <img
                src="dns.png"
                alt="Selo ReclameAqui"
                className="h-7 w-auto filter invert"
              />
            </div>
          </div>
          {/* Coluna 2 */}
          <div>
            <h3 className="font-semibold mb-2">Hospedagem</h3>
            <ul className="space-y-1">
              <li><Link to="/hospedagem" className="hover:underline">Hospedagem de Sites</Link></li>
              <li><Link to="/wordpress" className="hover:underline">Hospedagem WordPress</Link></li>
              <li><Link to="/hospedagem-loja" className="hover:underline">Hospedagem para Loja Virtual</Link></li>
              <li><Link to="/criador" className="hover:underline">Criador de Sites</Link></li>
            </ul>
          </div>
          {/* Coluna 3 */}
          <div>
            <h3 className="font-semibold mb-2">Recursos</h3>
            <ul className="space-y-1">
              <li><Link to="/blog" className="hover:underline">Blog da AngoHost</Link></li>
              <li><Link to="/migracao" className="hover:underline">Migração de Hospedagem</Link></li>
              <li><Link to="/faq" className="hover:underline">Perguntas Frequentes</Link></li>
              <li><Link to="/kb" className="hover:underline">Base de Conhecimento</Link></li>
            </ul>
          </div>
          {/* Coluna 4 */}
          <div>
            <h3 className="font-semibold mb-2">Empresa</h3>
            <ul className="space-y-1">
              <li><Link to="/sobre" className="hover:underline">Sobre Nós</Link></li>
              <li><Link to="/termos" className="hover:underline">Termos de Serviço</Link></li>
              <li><Link to="/privacidade" className="hover:underline">Privacidade</Link></li>
              <li><Link to="/parceiros" className="hover:underline">Parceiros</Link></li>
            </ul>
          </div>
          {/* Coluna 5 */}
          <div>
            <h3 className="font-semibold mb-2">Ferramentas</h3>
            <ul className="space-y-1">
              <li><Link to="/status" className="hover:underline">Status dos Servidores</Link></li>
              <li><Link to="/calculadora" className="hover:underline">Calculadora de Preços</Link></li>
              <li><Link to="/ssl" className="hover:underline">Certificado SSL</Link></li>
              <li><Link to="/email" className="hover:underline">Email Profissional</Link></li>
            </ul>
          </div>
          {/* Coluna 6 */}
          <div>
            <h3 className="font-semibold mb-2">Contato</h3>
            <ul className="space-y-1">
              <li><Link to="/contacto" className="hover:underline">Fale Conosco</Link></li>
              <li><Link to="/suporte" className="hover:underline">Suporte Técnico</Link></li>
              <li><Link to="/trabalhe-conosco" className="hover:underline">Trabalhe Conosco</Link></li>
              <li><Link to="/blog" className="hover:underline">Blog</Link></li>
            </ul>
          </div>
        </div>

        {/* Links institucionais */}
        <div className="flex flex-wrap justify-center gap-6 text-xs text-gray-500 mb-6">
          <Link to="/mapa-site" className="hover:underline">Mapa do site</Link>
          <Link to="/termos" className="hover:underline">Termos de Serviço</Link>
          <Link to="/privacidade" className="hover:underline">Política de Privacidade</Link>
          <Link to="/cookies" className="hover:underline">Configuração de cookies</Link>
        </div>

        {/* Segurança e pagamentos */}
        <div className="flex flex-col md:flex-row md:justify-start items-center gap-4 mb-2">
          <div className="flex items-center gap-2">
            <img src="https://logodownload.org/wp-content/uploads/2016/10/visa-logo-1.png" alt="Visa" className="h-6" />
            <img src="https://logodownload.org/wp-content/uploads/2014/07/mastercard-logo-4.png" alt="Mastercard" className="h-6" />
            <img src="atlantico.png" alt="Elo" className="h-6" />
            <img src="multicaixa.png" alt="PagSeguro" className="h-6" />
            <span className="ml-2 text-xs text-gray-500">Formas de pagamento</span>
          </div>
        </div>

        {/* Rodapé final */}
        <div className="text-center text-xs text-gray-500 mt-2">
          © {currentYear} AngoHost Serviços Web. Todos os direitos reservados.<br />
          Luanda, Angola
        </div>
      </div>
    </footer>
  );
};

export default Footer;
