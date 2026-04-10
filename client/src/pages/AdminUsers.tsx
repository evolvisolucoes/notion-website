import { trpc } from "@/lib/trpc";
import { Loader2, Shield, ShieldOff, Users, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Breadcrumb from "@/components/Breadcrumb";

export default function AdminUsers() {
  const { data: users, isLoading, refetch } = trpc.admin.listUsers.useQuery();
  const { data: resources } = trpc.admin.listResources.useQuery();
  const [selectedUser, setSelectedUser] = useState<any>(null);

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
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Users className="h-4 w-4" />
          {users?.length || 0} utilizadores
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
    </div>
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
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Acessos de {user.name || user.email}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-4">
          {resources.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">
              Nenhum recurso registado. Adicione recursos na secção de Recursos.
            </p>
          ) : (
            resources.map((resource: any) => {
              const hasAccess = accessIds.has(resource.id);
              return (
                <div key={resource.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{resource.title}</p>
                    <p className="text-xs text-gray-400">{resource.type} · {resource.notionId.slice(0, 8)}...</p>
                  </div>
                  {hasAccess ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => revokeMutation.mutate({ userId: user.id, resourceId: resource.id })}
                      disabled={revokeMutation.isPending}
                      className="text-xs text-red-600 border-red-200 hover:bg-red-50"
                    >
                      Revogar
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => grantMutation.mutate({ userId: user.id, resourceId: resource.id })}
                      disabled={grantMutation.isPending}
                      className="text-xs text-green-600 border-green-200 hover:bg-green-50"
                    >
                      Conceder
                    </Button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
