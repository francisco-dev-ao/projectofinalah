import { useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const ContactoPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    setTimeout(() => {
      setIsSubmitting(false);
      toast.success("Mensagem enviada com sucesso. Entraremos em contato em breve.");
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
    }, 1000);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow pt-8 bg-[#f7f7f7]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-[#fff9f6] rounded-2xl shadow flex flex-col md:flex-row items-stretch gap-8 p-8">
            {/* Formulário */}
            <div className="flex-1 flex flex-col justify-center">
              <h2 className="text-2xl font-bold mb-6">Contacte-nos</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <Input 
                    id="name" 
                    type="text" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    placeholder="Seu Nome" 
                    required 
                  />
                  <Input 
                    id="email" 
                    type="email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    placeholder="Seu Email" 
                    required 
                  />
                </div>
                <Input 
                  id="subject" 
                  type="text" 
                  value={subject} 
                  onChange={e => setSubject(e.target.value)} 
                  placeholder="Assunto" 
                  required 
                />
                <Textarea 
                  id="message" 
                  value={message} 
                  onChange={e => setMessage(e.target.value)} 
                  placeholder="Mensagem" 
                  rows={4} 
                  required 
                />
                <div className="flex items-center gap-3 mt-4">
                  <Button 
                    type="submit" 
                    className="flex items-center gap-2 px-8 py-2 rounded-full bg-[#0d4c8f] hover:bg-[#273d74] text-white font-semibold text-lg shadow"
                    disabled={isSubmitting}
                  >
                    <span className="inline-block bg-white/20 rounded-full p-1"><svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
                    Contactar
                  </Button>
                </div>
              </form>
            </div>
            {/* Espaço para foto e destaque */}
            <div className="flex flex-col items-center justify-center relative min-w-[320px] w-full md:w-[420px] lg:w-[500px]">
              <div className="relative w-full h-80 md:h-96 rounded-2xl overflow-hidden bg-white flex items-center justify-center shadow-md">
                <img src="/suporte.png" alt="Atendimento 24h" className="object-contain w-full h-full" style={{objectPosition: 'center'}} />
                <span className="absolute left-4 top-4 bg-white/90 rounded-full px-4 py-2 text-[#273d74] font-bold text-2xl flex items-center gap-2 shadow">
                  <svg width="32" height="32" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="#273d74" strokeWidth="2"/><path d="M12 6v6l4 2" stroke="#273d74" strokeWidth="2" strokeLinecap="round"/></svg>
                  24h
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ContactoPage;
