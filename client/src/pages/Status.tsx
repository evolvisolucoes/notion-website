import { trpc } from "@/lib/trpc";
import { Loader2, CheckCircle, XCircle, Activity, Server, Database, Wifi } from "lucide-react";
import { motion } from "framer-motion";
import Breadcrumb from "@/components/Breadcrumb";

export default function Status() {
  const { data: health, isLoading, error } = trpc.notion.health.useQuery();

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Status do Sistema" },
      ]} />

      <h1 className="text-2xl font-bold text-gray-900">Status do Sistema</h1>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl border border-gray-200 p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                health?.connected ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
              }`}>
                <Wifi className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">API do Notion</h3>
                <p className="text-xs text-gray-400">Conectividade com a API</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {health?.connected ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-600 font-medium">Conectado</span>
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-red-600 font-medium">Desconectado</span>
                </>
              )}
            </div>
            {health?.connected && health.botName && (
              <p className="text-xs text-gray-400 mt-2">Bot: {health.botName}</p>
            )}
            {!health?.connected && health?.error && (
              <p className="text-xs text-red-400 mt-2">{health.error}</p>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl border border-gray-200 p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                !error ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
              }`}>
                <Server className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Servidor</h3>
                <p className="text-xs text-gray-400">Estado do servidor da plataforma</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!error ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-600 font-medium">Operacional</span>
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-red-600 font-medium">Erro de comunicação</span>
                </>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl border border-gray-200 p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                health?.dbConnected ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
              }`}>
                <Database className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Base de Dados</h3>
                <p className="text-xs text-gray-400">Estado da base de dados local</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {health?.dbConnected ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-600 font-medium">Operacional</span>
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-red-600 font-medium">Indisponível</span>
                </>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl border border-gray-200 p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                !error ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-600"
              }`}>
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Autenticação</h3>
                <p className="text-xs text-gray-400">Estado do serviço OAuth</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!error ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-600 font-medium">Operacional</span>
                  <span className="text-xs text-gray-400 ml-2">(sessão ativa)</span>
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 text-amber-500" />
                  <span className="text-sm text-amber-600 font-medium">Indeterminado</span>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
