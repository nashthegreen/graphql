import { formatXp, placeTooltip, hideTooltip } from "../charts/utils.js";

/**
 * Amber intensity scale: higher XP → darker / more saturated.
 * @param {number} value
 * @param {number} max
 */
function xpShade(value, max) {
  const t = max > 0 ? Math.min(Math.max(value / max, 0), 1) : 0;
  const lightness = 58 - t * 30;
  const saturation = 48 + t * 32;
  return `hsl(36 ${saturation}% ${lightness}%)`;
}

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
      '<div class="chart-empty" role="status">No project XP yet</div>';
    return;
  }

  const width = wrap.clientWidth || 320;
  const height = wrap.clientHeight || 280;
  const total = items.reduce((sum, item) => sum + item.value, 0);
  const maxXp = items[0]?.value || 1;
  const rects = layoutTreemap(items, 0, 0, width, height);

  rects.forEach((rect) => {
    const el = document.createElement("div");
    el.className = "tm-tile";
    el.tabIndex = 0;
    el.setAttribute("role", "img");
    el.setAttribute(
      "aria-label",
      `${rect.name}: ${formatXp(rect.value)}`
    );
    el.style.left = `${rect.x}px`;
    el.style.top = `${rect.y}px`;
    el.style.width = `${Math.max(rect.w - 1, 0)}px`;
    el.style.height = `${Math.max(rect.h - 1, 0)}px`;
    el.style.background = xpShade(rect.value, maxXp);

    if (rect.w > 55 && rect.h > 24) {
      el.innerHTML = `<span>${rect.name}</span>`;
    }

    const pct = ((rect.value / total) * 100).toFixed(1);
    const tipHtml = `<b>${rect.name}</b><br>${formatXp(rect.value)}<br>${pct}% of project XP`;

    const show = (eventOrEl) => placeTooltip(tooltip, eventOrEl, tipHtml);
    const hide = () => hideTooltip(tooltip);

    el.addEventListener("mousemove", show);
    el.addEventListener("mouseleave", hide);
    el.addEventListener("focus", () => show(el));
    el.addEventListener("blur", hide);
    el.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        show(el);
      }
    });

    wrap.appendChild(el);
  });
}
