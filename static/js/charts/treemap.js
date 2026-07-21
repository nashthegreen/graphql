import {
  createSvgEl,
  clearSvg,
  showEmptyChart,
  setSvgA11y,
  formatXp,
  placeTooltip,
  hideTooltip,
} from "./utils.js";

/**
 * Amber intensity scale: higher XP → darker / more saturated.
 * @param {number} value
 * @param {number} max
 */
function amberFor(value, max) {
  const t = max > 0 ? Math.min(Math.max(value / max, 0), 1) : 0;
  const lightness = 62 - t * 40;
  const saturation = 55 + t * 25;
  return `hsl(36 ${saturation.toFixed(0)}% ${lightness.toFixed(0)}%)`;
}

/**
 * Squarified treemap (Bruls / Huizing / van Wijk).
 * @param {Array<{ name: string, value: number }>} items
 * @param {number} x
 * @param {number} y
 * @param {number} w
 * @param {number} h
 */
function squarify(items, x, y, w, h) {
  if (!items.length) return [];

  const total = items.reduce((sum, item) => sum + item.value, 0);
  if (total <= 0 || w <= 0 || h <= 0) return [];

  const scale = (w * h) / total;
  const sorted = [...items]
    .sort((a, b) => b.value - a.value)
    .map((item) => ({ ...item, area: item.value * scale }));

  const results = [];
  let rect = { x, y, w, h };

  function worstRatio(row, length) {
    const sum = row.reduce((s, r) => s + r.area, 0);
    const rowMax = Math.max(...row.map((r) => r.area));
    const rowMin = Math.min(...row.map((r) => r.area));
    return Math.max(
      (length * length * rowMax) / (sum * sum),
      (sum * sum) / (length * length * rowMin)
    );
  }

  function layoutRow(row, box, horizontal) {
    const sum = row.reduce((s, r) => s + r.area, 0);
    const length = horizontal ? box.h : box.w;
    const thickness = sum / length;
    let offset = 0;
    row.forEach((r) => {
      const size = r.area / thickness;
      if (horizontal) {
        results.push({
          ...r,
          x: box.x,
          y: box.y + offset,
          w: thickness,
          h: size,
        });
      } else {
        results.push({
          ...r,
          x: box.x + offset,
          y: box.y,
          w: size,
          h: thickness,
        });
      }
      offset += size;
    });
    if (horizontal) {
      return {
        x: box.x + thickness,
        y: box.y,
        w: box.w - thickness,
        h: box.h,
      };
    }
    return {
      x: box.x,
      y: box.y + thickness,
      w: box.w,
      h: box.h - thickness,
    };
  }

  let remaining = sorted;
  while (remaining.length) {
    const horizontal = rect.w >= rect.h;
    const length = horizontal ? rect.h : rect.w;
    let row = [remaining[0]];
    let i = 1;
    while (i < remaining.length) {
      const testRow = [...row, remaining[i]];
      if (worstRatio(testRow, length) <= worstRatio(row, length)) {
        row = testRow;
        i += 1;
      } else {
        break;
      }
    }
    rect = layoutRow(row, rect, horizontal);
    remaining = remaining.slice(row.length);
  }

  return results;
}

/**
 * Read the SVG's laid-out CSS box so squarify matches the responsive panel
 * (not a demo-fixed 640×280). Falls back when the node is still hidden.
 * @param {SVGElement} svg
 */
function measureTreemapSize(svg) {
  const box = svg.getBoundingClientRect();
  const width = Math.round(box.width || svg.clientWidth || 0);
  const height = Math.round(box.height || svg.clientHeight || 0);
  return {
    width: width > 1 ? width : 640,
    height: height > 1 ? height : 220,
  };
}

/**
 * @param {SVGElement} svg
 * @param {HTMLElement} tooltip
 * @param {Array<{ name: string, xp: number }>} projects
 */
export function renderXpTreemap(svg, tooltip, projects) {
  if (!svg) return;

  clearSvg(svg);
  if (svg._treemapCleanup) {
    svg._treemapCleanup();
    svg._treemapCleanup = null;
  }

  const items = (projects || [])
    .filter((project) => project.xp > 0)
    .slice(0, 12)
    .map((project) => ({ name: project.name, value: project.xp }))
    .sort((a, b) => b.value - a.value);

  const { width, height } = measureTreemapSize(svg);

  if (!items.length) {
    showEmptyChart(svg, "No project XP yet", width, height, {
      title: "Project XP treemap",
      desc: "No project XP available to chart yet.",
    });
    return;
  }

  const gap = 1;
  const total = items.reduce((sum, item) => sum + item.value, 0);
  const maxXp = items[0]?.value || 1;
  const rects = squarify(items, 0, 0, width, height);

  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.setAttribute("preserveAspectRatio", "none");
  setSvgA11y(
    svg,
    "Project XP treemap",
    `Top ${items.length} projects by XP.`
  );

  const handlers = [];

  rects.forEach((rect, index) => {
    const tileW = Math.max(rect.w - gap, 0);
    const tileH = Math.max(rect.h - gap, 0);
    const pct = ((rect.value / total) * 100).toFixed(1);
    const group = createSvgEl("g", { class: "tm-tile" });

    const tile = createSvgEl("rect", {
      x: String(rect.x),
      y: String(rect.y),
      width: String(tileW),
      height: String(tileH),
      fill: amberFor(rect.value, maxXp),
      tabindex: "0",
      role: "img",
      "aria-label": `${rect.name}: ${formatXp(rect.value)}, ${pct}% of project XP`,
      style: "outline: none; cursor: default",
    });

    group.appendChild(tile);

    if (tileW > 55 && tileH > 24) {
      const clipId = `tm-clip-${index}-${rect.name.replace(/[^a-z0-9]/gi, "")}`;
      const clip = createSvgEl("clipPath", { id: clipId });
      clip.appendChild(
        createSvgEl("rect", {
          x: String(rect.x),
          y: String(rect.y),
          width: String(Math.max(tileW - 8, 0)),
          height: String(tileH),
        })
      );
      group.appendChild(clip);

      const label = createSvgEl("text", {
        x: String(rect.x + 8),
        y: String(rect.y + tileH - 8),
        fill: "#0B1E33",
        "font-size": "11",
        "font-family": "IBM Plex Mono, monospace",
        "pointer-events": "none",
        "clip-path": `url(#${clipId})`,
      });
      label.textContent = rect.name;
      group.appendChild(label);
    }

    const tipHtml = `<b>${rect.name}</b><br>${formatXp(rect.value)}<br>${pct}% of project XP`;

    const show = (eventOrEl) => {
      group.classList.add("is-active");
      placeTooltip(tooltip, eventOrEl, tipHtml);
    };
    const hide = () => {
      group.classList.remove("is-active");
      hideTooltip(tooltip);
    };
    const onMove = (event) => placeTooltip(tooltip, event, tipHtml);
    const onFocus = () => show(tile);
    const onKey = (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        show(tile);
      }
    };

    tile.addEventListener("mouseenter", show);
    tile.addEventListener("mousemove", onMove);
    tile.addEventListener("mouseleave", hide);
    tile.addEventListener("focus", onFocus);
    tile.addEventListener("blur", hide);
    tile.addEventListener("keydown", onKey);
    handlers.push({ tile, show, onMove, hide, onFocus, onKey });

    svg.appendChild(group);
  });

  svg._treemapCleanup = () => {
    handlers.forEach(({ tile, show, onMove, hide, onFocus, onKey }) => {
      tile.removeEventListener("mouseenter", show);
      tile.removeEventListener("mousemove", onMove);
      tile.removeEventListener("mouseleave", hide);
      tile.removeEventListener("focus", onFocus);
      tile.removeEventListener("blur", hide);
      tile.removeEventListener("keydown", onKey);
    });
    hideTooltip(tooltip);
  };
}
