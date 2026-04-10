import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Database, FileText, Loader2, Plus, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: resources, isLoading } = trpc.resources.myResources.useQuery();

  const [, setLocation] = useLocation();

  const databases = resources?.filter((r: any) => r.type === "database") || [];
  const pages = resources?.filter((r: any) => r.type === "page") || [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Olá, {user?.name || "Utilizador"}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Aceda aos seus recursos Notion disponíveis
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : resources && resources.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20"
        >
          <Database className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">
            Nenhum recurso disponível
          </h3>
          <p className="text-sm text-gray-400">
            Contacte o administrador para obter acesso a databases e páginas do Notion.
          </p>
        </motion.div>
      ) : (
        <>
          {/* Databases section */}
          {databases.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Database className="h-4 w-4" />
                Databases
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {databases.map((resource: any, index: number) => (
                  <motion.div
                    key={resource.notionId || resource.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => setLocation(`/database/${resource.notionId}`)}
                    className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-100 transition-colors">
                          {resource.icon || <Database className="h-5 w-5" />}
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900 group-hover:text-blue-700 transition-colors">
                            {resource.title}
                          </h3>
                          {resource.description && (
                            <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                              {resource.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-blue-500 transition-colors mt-1" />
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {/* Pages section */}
          {pages.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Páginas
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pages.map((resource: any, index: number) => (
                  <motion.div
                    key={resource.notionId || resource.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => setLocation(`/page/${resource.notionId}`)}
                    className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-100 transition-colors">
                          {resource.icon || <FileText className="h-5 w-5" />}
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900 group-hover:text-blue-700 transition-colors">
                            {resource.title}
                          </h3>
                          {resource.description && (
                            <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                              {resource.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-blue-500 transition-colors mt-1" />
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
