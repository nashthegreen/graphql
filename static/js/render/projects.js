import { formatXp } from "../charts/utils.js";

export function projectNameFromPath(path) {
  if (!path) return "unknown";
  const parts = String(path).split("/").filter(Boolean);
  return parts[parts.length - 1] || path;
}

export function summarizeProjects(transactions) {
  const byPath = new Map();

  (transactions || []).forEach((tx) => {
    if (!tx?.path || !(tx.amount > 0)) return;

    const existing = byPath.get(tx.path) || {
      path: tx.path,
      name: projectNameFromPath(tx.path),
      xp: 0,
      lastAt: null,
    };

    existing.xp += tx.amount;
    const created = tx.createdAt ? new Date(tx.createdAt) : null;
    if (created && (!existing.lastAt || created > existing.lastAt)) {
      existing.lastAt = created;
    }

    byPath.set(tx.path, existing);
  });

  const projects = [...byPath.values()];

  const top = [...projects].sort((a, b) => b.xp - a.xp);
  const recent = [...projects]
    .filter((p) => p.lastAt)
    .sort((a, b) => b.lastAt - a.lastAt);

  return { top, recent, projects };
}

export function renderProjectLists(transactions, recentEl, topEl) {
  const { top, recent } = summarizeProjects(transactions);

  renderRankedList(topEl, top.slice(0, 3), (project, index) => {
    const rank = String(index + 1).padStart(2, "0");
    return `<span class="rank">${rank}</span><span class="name">${escapeHtml(project.name)}</span><span class="xp">${formatXp(project.xp)}</span>`;
  });

  renderRankedList(recentEl, recent.slice(0, 5), (project) => {
    const date = project.lastAt
      ? project.lastAt.toLocaleDateString(undefined, {
          month: "short",
          year: "numeric",
        })
      : "";
    return `<span class="name">${escapeHtml(project.name)}<span class="sub">${escapeHtml(date)}</span></span><span class="xp">${formatXp(project.xp)}</span>`;
  });
}

function renderRankedList(listEl, items, renderItem) {
  if (!listEl) return;
  listEl.innerHTML = "";

  if (!items.length) {
    const li = document.createElement("li");
    li.className = "empty";
    li.textContent = "No project XP yet";
    listEl.appendChild(li);
    return;
  }

  items.forEach((item, index) => {
    const li = document.createElement("li");
    li.innerHTML = renderItem(item, index);
    listEl.appendChild(li);
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
