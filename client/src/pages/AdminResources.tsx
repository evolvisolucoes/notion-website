import { trpc } from "@/lib/trpc";
import { Loader2, Plus, Trash2, Database, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { useState } from "react";
import { toast } from "sonner";
import Breadcrumb from "@/components/Breadcrumb";

export default function AdminResources() {
  const { data: resources, isLoading, refetch } = trpc.admin.listResources.useQuery();
  const [addOpen, setAddOpen] = useState(false);

  const removeMutation = trpc.admin.removeResource.useMutation({
    onSuccess: () => {
      toast.success("Recurso removido!");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Recursos Notion" },
      ]} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Recursos Notion</h1>
          <p className="text-sm text-gray-500 mt-1">
            Gerir databases e páginas do Notion como serviços
          </p>
        </div>
        <AddResourceDialog open={addOpen} setOpen={setAddOpen} onSuccess={refetch} />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : resources && resources.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <Database className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">Nenhum recurso registado</h3>
          <p className="text-sm text-gray-400 mb-4">
            Adicione databases e páginas do Notion para disponibilizar como serviços.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {resources?.map((resource: any, idx: number) => (
            <motion.div
              key={resource.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white border border-gray-200 rounded-xl p-5"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                    resource.type === "database"
                      ? "bg-blue-50 text-blue-600"
                      : "bg-indigo-50 text-indigo-600"
                  }`}>
                    {resource.type === "database" ? (
                      <Database className="h-5 w-5" />
                    ) : (
                      <FileText className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{resource.title}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {resource.type} · ID: {resource.notionId.slice(0, 12)}...
                    </p>
                    {resource.description && (
                      <p className="text-xs text-gray-500 mt-1">{resource.description}</p>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (confirm("Tem a certeza que deseja remover este recurso?")) {
                      removeMutation.mutate({ id: resource.id });
                    }
                  }}
                  className="text-gray-400 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function AddResourceDialog({ open, setOpen, onSuccess }: { open: boolean; setOpen: (v: boolean) => void; onSuccess: () => void }) {
  const [notionId, setNotionId] = useState("");
  const [type, setType] = useState<"database" | "page">("database");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const addMutation = trpc.admin.addResource.useMutation({
    onSuccess: () => {
      toast.success("Recurso adicionado!");
      setOpen(false);
      setNotionId("");
      setTitle("");
      setDescription("");
      onSuccess();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addMutation.mutate({ notionId, type, title, description: description || undefined });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5">
          <Plus className="h-4 w-4" />
          Novo Recurso
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Adicionar Recurso Notion</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setType("database")}
                className={`flex-1 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  type === "database"
                    ? "bg-blue-50 border-blue-300 text-blue-700"
                    : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Database className="h-4 w-4 inline mr-1.5" />
                Database
              </button>
              <button
                type="button"
                onClick={() => setType("page")}
                className={`flex-1 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  type === "page"
                    ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                    : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                <FileText className="h-4 w-4 inline mr-1.5" />
                Página
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ID do Notion</label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={notionId}
              onChange={(e) => setNotionId(e.target.value)}
              placeholder="Ex: abc123def456..."
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nome do recurso"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição (opcional)</label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Breve descrição do recurso"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={addMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {addMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Adicionar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
