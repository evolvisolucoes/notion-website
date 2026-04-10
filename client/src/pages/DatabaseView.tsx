import { trpc } from "@/lib/trpc";
import { useRoute, useLocation } from "wouter";
import { Loader2, Plus, ArrowRight, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import Breadcrumb, { useBreadcrumb } from "@/components/Breadcrumb";

export default function DatabaseView() {
  const [, params] = useRoute("/database/:id");
  const databaseId = params?.id || "";
  const [, setLocation] = useLocation();

  const { push } = useBreadcrumb();

  const { data, isLoading, error, refetch } = trpc.notion.getDatabaseContent.useQuery(
    { databaseId },
    { enabled: !!databaseId }
  );

  // Register in breadcrumb trail
  const dbTitle = data?.title || "Database";
  useEffect(() => {
    if (dbTitle && databaseId) {
      push({ label: dbTitle, path: `/database/${databaseId}` });
    }
  }, [dbTitle, databaseId, push]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500 mb-2">Erro ao carregar database</p>
        <p className="text-sm text-gray-400">{error.message}</p>
      </div>
    );
  }

  const rows = data?.rows || [];
  const columns = data?.columns || [];

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: "Dashboard", href: "/dashboard" },
        { label: dbTitle },
      ]} />

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{dbTitle}</h1>
        <AddRowDialog databaseId={databaseId} columns={columns} onSuccess={refetch} />
      </div>

      {rows.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-400">Nenhum registo encontrado nesta database.</p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-xl border border-gray-200 overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  {columns.map((col: any) => (
                    <th key={col.name} className="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap">
                      {col.name}
                    </th>
                  ))}
                  <th className="px-4 py-3 w-10" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row: any, idx: number) => (
                  <motion.tr
                    key={row._pageId || idx}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.02 }}
                    className="border-b last:border-0 hover:bg-blue-50/50 transition-colors cursor-pointer"
                    onClick={() => row._pageId && setLocation(`/page/${row._pageId}`)}
                  >
                    {columns.map((col: any) => (
                      <td key={col.name} className="px-4 py-3 text-gray-700 max-w-[200px] truncate">
                        {row[col.name] || "—"}
                      </td>
                    ))}
                    <td className="px-4 py-3">
                      <ChevronRight className="h-4 w-4 text-gray-300" />
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function AddRowDialog({ databaseId, columns, onSuccess }: { databaseId: string; columns: any[]; onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});

  const addRowMutation = trpc.notion.addRow.useMutation({
    onSuccess: () => {
      toast.success("Registo adicionado com sucesso!");
      setOpen(false);
      setFormData({});
      onSuccess();
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao adicionar registo.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addRowMutation.mutate({ databaseId, properties: formData });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5">
          <Plus className="h-4 w-4" />
          Novo Registo
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Adicionar Registo</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {columns.map((col: any) => (
            <div key={col.name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {col.name}
                <span className="text-xs text-gray-400 ml-1">({col.type})</span>
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData[col.name] || ""}
                onChange={(e) => setFormData({ ...formData, [col.name]: e.target.value })}
                placeholder={`Inserir ${col.name}...`}
              />
            </div>
          ))}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={addRowMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {addRowMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Adicionar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
