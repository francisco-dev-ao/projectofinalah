const testimonials = [
  {
    quote: "A AngoHost tornou o processo de criar meu site de comércio online simples e acessível. O suporte técnico é excelente e rápido.",
    author: "Maria Fernanda",
    company: "Boutique Luanda",
    avatar: "https://cdn.lovable.dev/demo/testimonial-1.jpg"
  },
  {
    quote: "Estou muito satisfeito com a velocidade do servidor e o tempo de resposta da equipa quando tenho alguma questão técnica.",
    author: "João Silva",
    company: "Tech Solutions Angola",
    avatar: "https://cdn.lovable.dev/demo/testimonial-2.jpg"
  },
  {
    quote: "Como empresa que depende de email confiável, o serviço da AngoHost tem sido crucial para mantermos nossa comunicação profissional.",
    author: "António Gaspar",
    company: "Gaspar Consultoria",
    avatar: "https://cdn.lovable.dev/demo/testimonial-3.jpg"
  }
];

const TestimonialsSection = () => {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="section-title">O Que Dizem Nossos Clientes</h2>
        <p className="section-subtitle">
          Empresas e profissionais em toda Angola confiam na AngoHost para suas soluções web
        </p>
        
        <div className="mt-16 text-center">
          <div className="flex flex-wrap justify-center gap-8 max-w-4xl mx-auto">
            {/* Trust badges and certifications */}
            <div className="grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all">
              <img src="https://cdn.lovable.dev/demo/badge-1.png" alt="Certificação" className="h-16" />
            </div>
            <div className="grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all">
              <img src="https://cdn.lovable.dev/demo/badge-2.png" alt="Parceiro" className="h-16" />
            </div>
            <div className="grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all">
              <img src="https://cdn.lovable.dev/demo/badge-3.png" alt="Segurança" className="h-16" />
            </div>
            <div className="grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all">
              <img src="https://cdn.lovable.dev/demo/badge-4.png" alt="Uptime" className="h-16" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
