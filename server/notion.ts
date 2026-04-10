/**
 * Notion API integration module.
 * Mirrors the routes from the original 'notions' repository but adapted for tRPC.
 */
import { ENV } from "./_core/env";

const NOTION_VERSION = "2022-06-28";

function notionHeaders() {
  return {
    Authorization: `Bearer ${ENV.notionToken}`,
    "Notion-Version": NOTION_VERSION,
    "Content-Type": "application/json",
  };
}

// ─── get-database-content ───

export async function getDatabaseContent(databaseId: string) {
  const response = await fetch(
    `https://api.notion.com/v1/databases/${databaseId}/query`,
    {
      method: "POST",
      headers: notionHeaders(),
    }
  );
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Erro ao buscar a database");
  }

  // Also fetch database schema for column info
  const schemaRes = await fetch(
    `https://api.notion.com/v1/databases/${databaseId}`,
    { headers: notionHeaders() }
  );
  const schemaData = await schemaRes.json();

  const properties = schemaData.properties || {};
  const columns = Object.entries(properties).map(([name, prop]: [string, any]) => ({
    name,
    type: prop.type,
  }));

  const rows = data.results.map((page: any) => {
    const props = page.properties || {};
    const rowData: Record<string, string> = { _pageId: page.id };
    for (const [propName, propData] of Object.entries<any>(props)) {
      const propType = propData.type;
      let val = "";
      if (propType === "title" && propData.title) {
        val = propData.title.map((t: any) => t.plain_text).join("");
      } else if (propType === "rich_text" && propData.rich_text) {
        val = propData.rich_text.map((t: any) => t.plain_text).join("");
      } else if (propType === "select" && propData.select) {
        val = propData.select.name || "";
      } else if (propType === "multi_select" && propData.multi_select) {
        val = propData.multi_select.map((s: any) => s.name).join(", ");
      } else if (propType === "status" && propData.status) {
        val = propData.status.name || "";
      } else if (propType === "date" && propData.date) {
        val = propData.date.start || "";
      } else if (propType === "number") {
        val = propData.number !== null ? String(propData.number) : "";
      } else if (propType === "checkbox") {
        val = propData.checkbox ? "true" : "false";
      } else if (propType === "url") {
        val = propData.url || "";
      } else if (propType === "email") {
        val = propData.email || "";
      } else if (propType === "phone_number") {
        val = propData.phone_number || "";
      }
      rowData[propName] = val;
    }
    return rowData;
  });

  return { rows, columns, title: schemaData.title?.[0]?.plain_text || "Database" };
}

// ─── get-page-content ───

export async function getPageContent(pageId: string) {
  // Get page info
  const pageRes = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
    headers: notionHeaders(),
  });
  const pageData = await pageRes.json();

  // Get blocks
  const response = await fetch(
    `https://api.notion.com/v1/blocks/${pageId}/children?page_size=100`,
    { headers: notionHeaders() }
  );
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Erro ao buscar blocos");
  }

  const blocks = data.results.map((block: any) => {
    const bType = block.type;
    const blockData = block[bType] || {};
    let contentText = "";
    let url = "";
    let checked = false;

    if (blockData.rich_text) {
      contentText = blockData.rich_text.map((t: any) => t.plain_text).join("");
    }
    if (bType === "to_do") {
      checked = blockData.checked || false;
    }
    if (["image", "video", "file", "pdf"].includes(bType)) {
      if (blockData.external) {
        url = blockData.external.url || "";
      } else if (blockData.file) {
        url = blockData.file.url || "";
      }
    }
    if (["child_page", "child_database"].includes(bType)) {
      contentText = blockData.title || `Link para ${bType}`;
    }

    return {
      id: block.id,
      type: bType,
      content: contentText,
      url,
      checked,
      hasChildren: block.has_children || false,
    };
  });

  // Extract page title
  let title = "Página";
  const props = pageData.properties || {};
  for (const [, prop] of Object.entries<any>(props)) {
    if (prop.type === "title" && prop.title?.length > 0) {
      title = prop.title.map((t: any) => t.plain_text).join("");
      break;
    }
  }

  return { blocks, title };
}

// ─── get-status ───

export async function getStatus(email: string) {
  const databaseId = ENV.databaseGestaoId;
  const response = await fetch(
    `https://api.notion.com/v1/databases/${databaseId}/query`,
    {
      method: "POST",
      headers: notionHeaders(),
      body: JSON.stringify({
        filter: {
          property: "Email",
          email: { equals: email },
        },
      }),
    }
  );
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Erro interno do Notion");
  }
  if (!data.results || data.results.length === 0) {
    return null;
  }
  const cliente = data.results[0];
  const nome = cliente.properties.Nome?.title[0]?.text?.content || "Sem Nome";
  const statusAtual = cliente.properties.Status?.status?.name || "Sem Status";
  return { nome, status_notion: statusAtual, page_id: cliente.id };
}

// ─── add-row ───

export async function addRow(databaseId: string, properties: Record<string, string>) {
  // First fetch the database schema to know each property type
  const schemaRes = await fetch(
    `https://api.notion.com/v1/databases/${databaseId}`,
    { headers: notionHeaders() }
  );
  const schemaData = await schemaRes.json();
  const schemaProps = schemaData.properties || {};

  const formattedProperties: any = {};
  for (const [coluna, value] of Object.entries(properties)) {
    if (!value) continue;
    const propSchema = schemaProps[coluna];
    const propType = propSchema?.type || "rich_text";

    switch (propType) {
      case "title":
        formattedProperties[coluna] = { title: [{ text: { content: value } }] };
        break;
      case "rich_text":
        formattedProperties[coluna] = { rich_text: [{ text: { content: value } }] };
        break;
      case "number":
        formattedProperties[coluna] = { number: parseFloat(value) || 0 };
        break;
      case "select":
        formattedProperties[coluna] = { select: { name: value } };
        break;
      case "multi_select":
        formattedProperties[coluna] = { multi_select: value.split(",").map((v: string) => ({ name: v.trim() })) };
        break;
      case "date":
        formattedProperties[coluna] = { date: { start: value } };
        break;
      case "checkbox":
        formattedProperties[coluna] = { checkbox: value.toLowerCase() === "true" || value === "1" };
        break;
      case "email":
        formattedProperties[coluna] = { email: value };
        break;
      case "phone_number":
        formattedProperties[coluna] = { phone_number: value };
        break;
      case "url":
        formattedProperties[coluna] = { url: value };
        break;
      case "status":
        formattedProperties[coluna] = { status: { name: value } };
        break;
      default:
        formattedProperties[coluna] = { rich_text: [{ text: { content: value } }] };
        break;
    }
  }

  const response = await fetch("https://api.notion.com/v1/pages", {
    method: "POST",
    headers: notionHeaders(),
    body: JSON.stringify({
      parent: { database_id: databaseId },
      properties: formattedProperties,
    }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Erro ao adicionar linha");
  }
  return { success: true, pageId: data.id };
}

// ─── update-block ───

export async function updateBlock(blockId: string, type: string, blockData: any) {
  const updatePayload: any = {};

  if (type === "to_do") {
    updatePayload.to_do = { checked: blockData.checked };
  } else if (type === "paragraph" || type === "heading_1" || type === "heading_2" || type === "heading_3" || type === "bulleted_list_item" || type === "numbered_list_item" || type === "quote" || type === "callout" || type === "toggle") {
    updatePayload[type] = {
      rich_text: [{ text: { content: blockData.content || "" } }],
    };
  } else {
    throw new Error("Tipo de bloco não suportado para edição.");
  }

  const response = await fetch(`https://api.notion.com/v1/blocks/${blockId}`, {
    method: "PATCH",
    headers: notionHeaders(),
    body: JSON.stringify(updatePayload),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Erro ao atualizar bloco");
  }
  return { success: true };
}

// ─── signup ───

export async function signup(nome: string, email: string, templateKey?: string, templateNome?: string) {
  const databaseId = ENV.databaseGestaoId;
  const payload: any = {
    parent: { database_id: databaseId },
    properties: {
      Nome: { title: [{ text: { content: nome } }] },
      Email: { email: email },
      Status: { status: { name: "Pendente" } },
    },
  };

  if (templateKey) {
    const templateId = process.env[templateKey];
    if (templateId) {
      payload.template = { type: "template_id", template_id: templateId };
    }
  }

  const response = await fetch("https://api.notion.com/v1/pages", {
    method: "POST",
    headers: notionHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Erro ao criar utilizador no Notion");
  }
  return { message: `Cliente criado com sucesso!`, notion_id: data.id };
}

// ─── health check ───

export async function checkNotionHealth() {
  try {
    const response = await fetch("https://api.notion.com/v1/users/me", {
      headers: notionHeaders(),
    });
    const data = await response.json();
    if (response.ok) {
      return {
        connected: true,
        botName: data.name || "Notion Bot",
        type: data.type || "bot",
      };
    }
    return { connected: false, error: data.message || "Falha na autenticação" };
  } catch (error: any) {
    return { connected: false, error: error.message };
  }
}
