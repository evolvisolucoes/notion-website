import { Button } from "@/components/ui/button";
import { EvolviLogo } from "@/components/EvolviLogo";
import { trpc } from "@/lib/trpc";
import { Loader2, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [, setLocation] = useLocation();

  // Check if user is already logged in
  const { data: user, isLoading: authLoading } = trpc.auth.me.useQuery();

  useEffect(() => {
    if (user) {
      setLocation("/dashboard");
    }
  }, [user, setLocation]);

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: () => {
      toast.success("Login realizado com sucesso!");
      setLocation("/dashboard");
    },
    onError: (err: any) => {
      const errorMessage = err.message || "Erro ao fazer login";
      setError(errorMessage);
      toast.error(errorMessage);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Email e senha são obrigatórios");
      return;
    }

    loginMutation.mutate({ email, password });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
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
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
          <div className="flex">
            <div className="w-2 bg-blue-600" />

            <div className="flex-1 p-8">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                className="flex justify-center mb-8"
              >
                <EvolviLogo size="lg" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.4 }}
              >
                <h1 className="text-xl font-semibold text-center mb-2 text-gray-800">
                  Acesse sua conta
                </h1>
                <p className="text-sm text-gray-500 text-center mb-8">
                  Plataforma de gestão de conteúdo Notion
                </p>
              </motion.div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3"
                >
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600">{error}</p>
                </motion.div>
              )}

              <motion.form
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.4 }}
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="seu@email.com"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loginMutation.isPending}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Senha
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loginMutation.isPending}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loginMutation.isPending}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-all shadow-md hover:shadow-lg h-11"
                >
                  {loginMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    "Entrar"
                  )}
                </Button>
              </motion.form>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.4 }}
                className="text-center text-xs text-gray-500 mt-6"
              >
                Contacte o administrador para obter uma conta
              </motion.p>
            </div>
          </div>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          className="text-center text-xs text-gray-400 mt-6"
        >
          &copy; {new Date().getFullYear()} Evolvi. Todos os direitos reservados.
        </motion.p>
      </motion.div>
    </div>
  );
}
