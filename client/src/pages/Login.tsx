import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { EvolviLogo } from "@/components/EvolviLogo";
import { getLoginUrl } from "@/const";
import { Loader2, ArrowRight } from "lucide-react";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";

export default function Login() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (user) {
      setLocation("/dashboard");
    }
  }, [user, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      {/* Background decoration */}
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
            {/* Borda azul lateral — identidade visual Evolvi */}
            <div className="w-2 bg-blue-600" />

            {/* Conteúdo do Card */}
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

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.4 }}
                className="space-y-4"
              >
                <Button
                  onClick={() => {
                    window.location.href = getLoginUrl();
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-all shadow-md hover:shadow-lg h-11"
                >
                  <span>Entrar com Manus</span>
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-3 text-gray-400">ou</span>
                  </div>
                </div>

                <p className="text-center text-sm text-gray-500">
                  Ainda não tem conta?{" "}
                  <button
                    onClick={() => setLocation("/signup")}
                    className="text-blue-600 hover:text-blue-700 font-medium underline-offset-4 hover:underline"
                  >
                    Registar-se
                  </button>
                </p>
              </motion.div>
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
