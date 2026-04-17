import { Button } from "@/components/ui/button";
import { EvolviLogo } from "@/components/EvolviLogo";
import { Lock, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";

export default function Signup() {
  const [, setLocation] = useLocation();

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

              <div className="flex justify-center mb-6">
                <div className="h-12 w-12 rounded-full bg-amber-50 flex items-center justify-center">
                  <Lock className="h-6 w-6 text-amber-600" />
                </div>
              </div>

              <h1 className="text-xl font-semibold text-center mb-2 text-gray-800">
                Acesso restrito
              </h1>
              <p className="text-sm text-gray-500 text-center mb-6">
                O auto-registo não está disponível. Contacte o administrador para obter uma conta.
              </p>

              <Button
                onClick={() => setLocation("/")}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-all h-11"
              >
                Voltar ao Login
              </Button>

              <button
                onClick={() => setLocation("/")}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 mt-6 mx-auto transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Voltar
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
