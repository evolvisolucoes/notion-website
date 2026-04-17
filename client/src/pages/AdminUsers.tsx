import { Loader2, Shield, ShieldOff, Users, ChevronRight, Plus, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Breadcrumb from "@/components/Breadcrumb";
import { trpc } from "@/lib/trpc";

export default function AdminUsers() {
  const { data: users, isLoading, refetch } = trpc.admin.listUsers.useQuery();
  const { data: resources } = trpc.admin.listResources.useQuery();
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const promoteMutation = trpc.admin.promoteUser.useMutation({
    onSuccess: () => {
      toast.success("Role atualizado!");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Utilizadores" },
      ]} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Utilizadores</h1>
          <p className="text-sm text-gray-500 mt-1">Gerir utilizadores e permissões de acesso</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Users className="h-4 w-4" />
            {users?.length || 0} utilizadores
          </div>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Utilizador
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Nome</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Role</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Último Login</th>
                  <th className="px-4 py-3 font-medium text-gray-600 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {users?.map((user: any, idx: number) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.03 }}
                    className="border-b last:border-0 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">{user.name || "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{user.email || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        user.role === "admin"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-600"
                      }`}>
                        {user.role === "admin" ? <Shield className="h-3 w-3" /> : null}
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {user.lastSignedIn ? new Date(user.lastSignedIn).toLocaleString("pt-BR") : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedUser(user)}
                          className="text-xs"
                        >
                          Acessos
                          <ChevronRight className="h-3 w-3 ml-1" />
                        </Button>
                        {user.role === "user" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => promoteMutation.mutate({ userId: user.id, role: "admin" })}
                            disabled={promoteMutation.isPending}
                            className="text-xs text-blue-600 border-blue-200 hover:bg-blue-50"
                          >
                            <Shield className="h-3 w-3 mr-1" />
                            Promover
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => promoteMutation.mutate({ userId: user.id, role: "user" })}
                            disabled={promoteMutation.isPending}
                            className="text-xs text-gray-500"
                          >
                            <ShieldOff className="h-3 w-3 mr-1" />
                            Remover Admin
                          </Button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedUser && (
        <UserAccessDialog
          user={selectedUser}
          resources={resources || []}
          onClose={() => setSelectedUser(null)}
        />
      )}

      {showCreateDialog && (
        <CreateUserDialog
          onClose={() => setShowCreateDialog(false)}
          onSuccess={() => {
            setShowCreateDialog(false);
            refetch();
          }}
        />
      )}
    </div>
  );
}

function CreateUserDialog({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const createMutation = trpc.admin.createUser.useMutation({
    onSuccess: () => {
      toast.success("Utilizador criado com sucesso!");
      onSuccess();
    },
    onError: (err: any) => {
      setError(err.message || "Erro ao criar utilizador");
      toast.error(err.message || "Erro ao criar utilizador");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Email e senha são obrigatórios");
      return;
    }

    if (password.length < 8) {
      setError("Senha deve ter no mínimo 8 caracteres");
      return;
    }

    createMutation.mutate({ email, password, name: name || undefined });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Criar Novo Utilizador</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              placeholder="utilizador@example.com"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={createMutation.isPending}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome (opcional)</label>
            <input
              type="text"
              placeholder="Nome do utilizador"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={createMutation.isPending}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={createMutation.isPending}
              required
              minLength={8}
            />
            <p className="text-xs text-gray-500 mt-1">Mínimo 8 caracteres</p>
          </div>
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={createMutation.isPending}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                "Criar"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function UserAccessDialog({ user, resources, onClose }: { user: any; resources: any[]; onClose: () => void }) {
  const { data: userAccess, refetch } = trpc.admin.getUserAccess.useQuery({ userId: user.id });
  const grantMutation = trpc.admin.grantAccess.useMutation({
    onSuccess: () => { toast.success("Acesso concedido!"); refetch(); },
    onError: (err) => toast.error(err.message),
  });
  const revokeMutation = trpc.admin.revokeAccess.useMutation({
    onSuccess: () => { toast.success("Acesso revogado!"); refetch(); },
    onError: (err) => toast.error(err.message),
  });

  const accessIds = new Set((userAccess || []).map((a: any) => a.resourceId));

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Acessos de {user.name || user.email}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {resources.map((resource: any) => {
            const hasAccess = accessIds.has(resource.id);
            return (
              <div key={resource.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div>
                  <p className="font-medium text-sm text-gray-900">{resource.title}</p>
                  <p className="text-xs text-gray-500">{resource.type}</p>
                </div>
                <Button
                  size="sm"
                  variant={hasAccess ? "default" : "outline"}
                  onClick={() => {
                    if (hasAccess) {
                      revokeMutation.mutate({ userId: user.id, resourceId: resource.id });
                    } else {
                      grantMutation.mutate({ userId: user.id, resourceId: resource.id });
                    }
                  }}
                  disabled={grantMutation.isPending || revokeMutation.isPending}
                >
                  {hasAccess ? "Remover" : "Conceder"}
                </Button>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
