import { Button } from "@/components/ui/button";
import { EvolviLogo } from "@/components/EvolviLogo";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Loader2, CheckCircle } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function Signup() {
  const [, setLocation] = useLocation();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [success, setSuccess] = useState(false);

  const signupMutation = trpc.notion.signup.useMutation({
    onSuccess: () => {
      setSuccess(true);
      toast.success("Conta criada com sucesso!");
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao criar conta.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    signupMutation.mutate({ nome, email });
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-white shadow-xl rounded-2xl p-8 text-center"
        >
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Conta criada!</h2>
          <p className="text-sm text-gray-500 mb-6">
            O seu registo foi enviado. Aguarde a aprovação do administrador.
          </p>
          <Button
            onClick={() => setLocation("/")}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Voltar ao Login
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-100 rounded-full opacity-40 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200 rounded-full opacity-30 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
          <div className="flex">
            <div className="w-2 bg-blue-600" />
            <div className="flex-1 p-8">
              <div className="flex justify-center mb-8">
                <EvolviLogo size="lg" />
              </div>

              <h1 className="text-xl font-semibold text-center mb-2 text-gray-800">
                Criar conta
              </h1>
              <p className="text-sm text-gray-500 text-center mb-6">
                Registe-se para aceder à plataforma Notion
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="text"
                  placeholder="Nome completo"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                />
                <input
                  type="email"
                  placeholder="E-mail"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Button
                  type="submit"
                  disabled={signupMutation.isPending}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-all h-11"
                >
                  {signupMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Registar"
                  )}
                </Button>
              </form>

              <button
                onClick={() => setLocation("/")}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 mt-6 mx-auto transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Voltar ao login
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
