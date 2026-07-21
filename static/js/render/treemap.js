import { formatXp } from "../charts/utils.js";

const TM_COLORS = [
  "#E3993A",
  "#5FC9C0",
  "#7FA8C9",
  "#C98F5F",
  "#D96B6B",
  "#8FBFA0",
  "#B7A0D6",
  "#D9C15F",
];

function layoutTreemap(items, x, y, w, h) {
  if (!items.length) return [];
  if (items.length === 1) return [{ ...items[0], x, y, w, h }];

  const total = items.reduce((sum, item) => sum + item.value, 0);
  let acc = 0;
  let splitIdx = 1;
  let bestDiff = Infinity;

  for (let i = 1; i < items.length; i += 1) {
    acc += items[i - 1].value;
    const diff = Math.abs(acc - total / 2);
    if (diff < bestDiff) {
      bestDiff = diff;
      splitIdx = i;
    }
  }

  const left = items.slice(0, splitIdx);
  const right = items.slice(splitIdx);
  const leftSum = left.reduce((sum, item) => sum + item.value, 0);
  const ratio = leftSum / total;

  if (w >= h) {
    const w1 = w * ratio;
    return [
      ...layoutTreemap(left, x, y, w1, h),
      ...layoutTreemap(right, x + w1, y, w - w1, h),
    ];
  }

  const h1 = h * ratio;
  return [
    ...layoutTreemap(left, x, y, w, h1),
    ...layoutTreemap(right, x, y + h1, w, h - h1),
  ];
}

export function renderXpTreemap(wrap, tooltip, projects) {
  if (!wrap) return;

  const items = (projects || [])
    .filter((project) => project.xp > 0)
    .slice(0, 12)
    .map((project) => ({ name: project.name, value: project.xp }))
    .sort((a, b) => b.value - a.value);

  wrap.innerHTML = "";

  if (!items.length) {
    wrap.innerHTML =
      '<div class="data-list"><li class="empty" style="justify-content:center;padding:40px 0;border:none;color:var(--ink-faint);font-family:\'IBM Plex Mono\',monospace;font-size:12px;">No project XP yet</li></div>';
    return;
  }

  const width = wrap.clientWidth || 320;
  const height = wrap.clientHeight || 280;
  const total = items.reduce((sum, item) => sum + item.value, 0);
  const rects = layoutTreemap(items, 0, 0, width, height);

  rects.forEach((rect, index) => {
    const el = document.createElement("div");
    el.className = "tm-tile";
    el.style.left = `${rect.x}px`;
    el.style.top = `${rect.y}px`;
    el.style.width = `${Math.max(rect.w - 1, 0)}px`;
    el.style.height = `${Math.max(rect.h - 1, 0)}px`;
    el.style.background = TM_COLORS[index % TM_COLORS.length];

    if (rect.w > 55 && rect.h > 24) {
      el.innerHTML = `<span>${rect.name}</span>`;
    }

    el.addEventListener("mousemove", (event) => {
      if (!tooltip) return;
      tooltip.style.display = "block";
      tooltip.style.left = `${event.clientX + 14}px`;
      tooltip.style.top = `${event.clientY + 14}px`;
      const pct = ((rect.value / total) * 100).toFixed(1);
      tooltip.innerHTML = `<b>${rect.name}</b><br>${formatXp(rect.value)}<br>${pct}% of project XP`;
    });

    el.addEventListener("mouseleave", () => {
      if (tooltip) tooltip.style.display = "none";
    });

    wrap.appendChild(el);
  });
}
