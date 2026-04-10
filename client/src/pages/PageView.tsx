import { trpc } from "@/lib/trpc";
import { useRoute, useLocation } from "wouter";
import { Loader2, Check, X, Edit2, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import Breadcrumb, { useBreadcrumb } from "@/components/Breadcrumb";

type Block = {
  id: string;
  type: string;
  content: string;
  url: string;
  checked: boolean;
  hasChildren: boolean;
};

export default function PageView() {
  const [, params] = useRoute("/page/:id");
  const pageId = params?.id || "";
  const [, setLocation] = useLocation();

  const { push } = useBreadcrumb();

  const { data, isLoading, error, refetch } = trpc.notion.getPageContent.useQuery(
    { pageId },
    { enabled: !!pageId }
  );

  const pageTitle = data?.title || "Página";
  useEffect(() => {
    if (pageTitle && pageId) {
      push({ label: pageTitle, path: `/page/${pageId}` });
    }
  }, [pageTitle, pageId, push]);

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
        <p className="text-red-500 mb-2">Erro ao carregar página</p>
        <p className="text-sm text-gray-400">{error.message}</p>
      </div>
    );
  }

  const blocks = data?.blocks || [];

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: "Dashboard", href: "/dashboard" },
        { label: pageTitle },
      ]} />

      <h1 className="text-2xl font-bold text-gray-900">{pageTitle}</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-1">
        {blocks.length === 0 ? (
          <p className="text-gray-400 text-center py-8">Nenhum conteúdo nesta página.</p>
        ) : (
          blocks.map((block: Block, idx: number) => (
            <motion.div
              key={block.id}
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.02 }}
            >
              <BlockRenderer block={block} onUpdate={refetch} onNavigate={setLocation} />
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

function BlockRenderer({ block, onUpdate, onNavigate }: { block: Block; onUpdate: () => void; onNavigate: (path: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(block.content);

  const updateMutation = trpc.notion.updateBlock.useMutation({
    onSuccess: () => {
      toast.success("Bloco atualizado!");
      setEditing(false);
      onUpdate();
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao atualizar bloco.");
    },
  });

  const toggleCheck = () => {
    updateMutation.mutate({
      blockId: block.id,
      type: "to_do",
      data: { checked: !block.checked },
    });
  };

  const saveEdit = () => {
    updateMutation.mutate({
      blockId: block.id,
      type: block.type,
      data: { content: editValue },
    });
  };

  const editableTypes = ["paragraph", "heading_1", "heading_2", "heading_3", "bulleted_list_item", "numbered_list_item", "quote", "callout", "toggle"];
  const canEdit = editableTypes.includes(block.type);

  // Child page / child database — navigate
  if (block.type === "child_page") {
    return (
      <button
        onClick={() => onNavigate(`/page/${block.id}`)}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors text-sm w-full text-left"
      >
        <ExternalLink className="h-3.5 w-3.5" />
        {block.content || "Sub-página"}
      </button>
    );
  }

  if (block.type === "child_database") {
    return (
      <button
        onClick={() => onNavigate(`/database/${block.id}`)}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors text-sm w-full text-left"
      >
        <ExternalLink className="h-3.5 w-3.5" />
        {block.content || "Sub-database"}
      </button>
    );
  }

  // To-do
  if (block.type === "to_do") {
    return (
      <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 group">
        <button
          onClick={toggleCheck}
          disabled={updateMutation.isPending}
          className={`h-5 w-5 rounded border-2 flex items-center justify-center transition-colors ${
            block.checked
              ? "bg-blue-600 border-blue-600 text-white"
              : "border-gray-300 hover:border-blue-400"
          }`}
        >
          {block.checked && <Check className="h-3 w-3" />}
        </button>
        <span className={`text-sm flex-1 ${block.checked ? "line-through text-gray-400" : "text-gray-700"}`}>
          {block.content}
        </span>
      </div>
    );
  }

  // Image / video / file
  if (["image", "video", "file", "pdf"].includes(block.type) && block.url) {
    if (block.type === "image") {
      return (
        <div className="px-3 py-2">
          <img src={block.url} alt="" className="max-w-full rounded-lg border" />
        </div>
      );
    }
    return (
      <a href={block.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-600 hover:underline px-3 py-2 text-sm">
        <ExternalLink className="h-3.5 w-3.5" />
        {block.content || block.type}
      </a>
    );
  }

  // Divider
  if (block.type === "divider") {
    return <hr className="my-4 border-gray-200" />;
  }

  // Headings
  if (block.type === "heading_1") {
    return (
      <EditableBlock editing={editing} setEditing={setEditing} editValue={editValue} setEditValue={setEditValue} saveEdit={saveEdit} canEdit={canEdit} isPending={updateMutation.isPending}>
        <h2 className="text-xl font-bold text-gray-900 px-3 py-2">{block.content}</h2>
      </EditableBlock>
    );
  }
  if (block.type === "heading_2") {
    return (
      <EditableBlock editing={editing} setEditing={setEditing} editValue={editValue} setEditValue={setEditValue} saveEdit={saveEdit} canEdit={canEdit} isPending={updateMutation.isPending}>
        <h3 className="text-lg font-semibold text-gray-800 px-3 py-2">{block.content}</h3>
      </EditableBlock>
    );
  }
  if (block.type === "heading_3") {
    return (
      <EditableBlock editing={editing} setEditing={setEditing} editValue={editValue} setEditValue={setEditValue} saveEdit={saveEdit} canEdit={canEdit} isPending={updateMutation.isPending}>
        <h4 className="text-base font-semibold text-gray-700 px-3 py-2">{block.content}</h4>
      </EditableBlock>
    );
  }

  // Quote
  if (block.type === "quote") {
    return (
      <EditableBlock editing={editing} setEditing={setEditing} editValue={editValue} setEditValue={setEditValue} saveEdit={saveEdit} canEdit={canEdit} isPending={updateMutation.isPending}>
        <blockquote className="border-l-4 border-blue-400 pl-4 py-2 mx-3 text-sm text-gray-600 italic">
          {block.content}
        </blockquote>
      </EditableBlock>
    );
  }

  // Callout
  if (block.type === "callout") {
    return (
      <EditableBlock editing={editing} setEditing={setEditing} editValue={editValue} setEditValue={setEditValue} saveEdit={saveEdit} canEdit={canEdit} isPending={updateMutation.isPending}>
        <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 mx-3 text-sm text-gray-700">
          {block.content}
        </div>
      </EditableBlock>
    );
  }

  // Bulleted list
  if (block.type === "bulleted_list_item") {
    return (
      <EditableBlock editing={editing} setEditing={setEditing} editValue={editValue} setEditValue={setEditValue} saveEdit={saveEdit} canEdit={canEdit} isPending={updateMutation.isPending}>
        <div className="flex items-start gap-2 px-3 py-1">
          <span className="text-gray-400 mt-1.5">•</span>
          <span className="text-sm text-gray-700">{block.content}</span>
        </div>
      </EditableBlock>
    );
  }

  // Numbered list
  if (block.type === "numbered_list_item") {
    return (
      <EditableBlock editing={editing} setEditing={setEditing} editValue={editValue} setEditValue={setEditValue} saveEdit={saveEdit} canEdit={canEdit} isPending={updateMutation.isPending}>
        <div className="flex items-start gap-2 px-3 py-1">
          <span className="text-sm text-gray-700">{block.content}</span>
        </div>
      </EditableBlock>
    );
  }

  // Default: paragraph
  return (
    <EditableBlock editing={editing} setEditing={setEditing} editValue={editValue} setEditValue={setEditValue} saveEdit={saveEdit} canEdit={canEdit} isPending={updateMutation.isPending}>
      <p className="text-sm text-gray-700 px-3 py-1.5 leading-relaxed">
        {block.content || "\u00A0"}
      </p>
    </EditableBlock>
  );
}

function EditableBlock({
  children,
  editing,
  setEditing,
  editValue,
  setEditValue,
  saveEdit,
  canEdit,
  isPending,
}: {
  children: React.ReactNode;
  editing: boolean;
  setEditing: (v: boolean) => void;
  editValue: string;
  setEditValue: (v: string) => void;
  saveEdit: () => void;
  canEdit: boolean;
  isPending: boolean;
}) {
  if (editing) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5">
        <input
          type="text"
          className="flex-1 border border-blue-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") saveEdit();
            if (e.key === "Escape") setEditing(false);
          }}
          autoFocus
        />
        <button
          onClick={saveEdit}
          disabled={isPending}
          className="p-1.5 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
        </button>
        <button
          onClick={() => setEditing(false)}
          className="p-1.5 rounded bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="group relative rounded-lg hover:bg-gray-50 transition-colors">
      {children}
      {canEdit && (
        <button
          onClick={() => setEditing(true)}
          className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 rounded bg-white border border-gray-200 shadow-sm text-gray-400 hover:text-blue-600 transition-all"
        >
          <Edit2 className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
