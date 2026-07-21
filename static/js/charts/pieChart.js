import { createSvgEl, clearSvg, showEmptyChart, palette } from "./utils.js";

function pieSlice(cx, cy, radius, startAngle, endAngle) {
  const x1 = cx + radius * Math.cos(startAngle);
  const y1 = cy + radius * Math.sin(startAngle);
  const x2 = cx + radius * Math.cos(endAngle);
  const y2 = cy + radius * Math.sin(endAngle);
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;

  return `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
}

function addLegend(svg, items, startY) {
  items.forEach((item, index) => {
    const y = startY + index * 22;

    svg.appendChild(
      createSvgEl("rect", {
        x: "40",
        y: String(y),
        width: "14",
        height: "14",
        rx: "2",
        fill: item.color,
      })
    );

    const label = createSvgEl("text", {
      x: "62",
      y: String(y + 12),
      fill: palette.ink,
      "font-size": "12",
      "font-family": "IBM Plex Mono, monospace",
    });
    label.textContent = `${item.label}: ${item.value} (${item.percent}%)`;
    svg.appendChild(label);
  });
}

/**
 * @param {SVGElement} svg
 * @param {object} user
 * @param {{ upCount?: number, downCount?: number, tooltip?: HTMLElement }} [extras]
 */
export function renderAuditPieChart(svg, user, extras = {}) {
  clearSvg(svg);
  if (svg._auditCleanup) {
    svg._auditCleanup();
    svg._auditCleanup = null;
  }

  const up =
    extras.upCount != null
      ? Number(extras.upCount) || 0
      : Number(user?.totalUp) || 0;
  const down =
    extras.downCount != null
      ? Number(extras.downCount) || 0
      : Number(user?.totalDown) || 0;
  const total = up + down;
  const tooltip = extras.tooltip || null;

  if (total === 0) {
    showEmptyChart(svg, "No audit data available", 420, 300);
    return;
  }

  const width = 420;
  const height = 300;
  const cx = 150;
  const cy = 120;
  const radius = 78;

  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");

  const upAngle = (up / total) * Math.PI * 2;
  const slices = [
    {
      value: up,
      color: palette.amber,
      label: "Audits done (up)",
      start: -Math.PI / 2,
      end: -Math.PI / 2 + upAngle,
    },
    {
      value: down,
      color: palette.cyan,
      label: "Audits received (down)",
      start: -Math.PI / 2 + upAngle,
      end: Math.PI * 1.5,
    },
  ];

  const handlers = [];

  slices.forEach((slice) => {
    if (slice.value <= 0) return;

    const path = createSvgEl("path", {
      d: pieSlice(cx, cy, radius, slice.start, slice.end),
      fill: slice.color,
      class: "audit-slice",
      style: "cursor:pointer; transition: opacity .15s",
    });

    const percent = Math.round((slice.value / total) * 100);

    const onEnter = (event) => {
      path.style.opacity = "0.85";
      if (!tooltip) return;
      tooltip.style.display = "block";
      tooltip.style.left = `${event.clientX + 14}px`;
      tooltip.style.top = `${event.clientY + 14}px`;
      tooltip.innerHTML = `<b>${slice.label}</b><br>${slice.value} audits<br>${percent}% of total`;
    };

    const onMove = (event) => {
      if (!tooltip) return;
      tooltip.style.left = `${event.clientX + 14}px`;
      tooltip.style.top = `${event.clientY + 14}px`;
    };

    const onLeave = () => {
      path.style.opacity = "1";
      if (tooltip) tooltip.style.display = "none";
    };

    path.addEventListener("mouseenter", onEnter);
    path.addEventListener("mousemove", onMove);
    path.addEventListener("mouseleave", onLeave);
    handlers.push({ path, onEnter, onMove, onLeave });

    svg.appendChild(path);
  });

  const ratio = createSvgEl("text", {
    x: String(cx),
    y: String(cy + 4),
    "text-anchor": "middle",
    fill: palette.ink,
    "font-size": "14",
    "font-weight": "600",
    "font-family": "Space Mono, monospace",
  });
  ratio.textContent = Number(user.auditRatio || 0).toFixed(2);
  svg.appendChild(ratio);

  addLegend(
    svg,
    slices
      .filter((slice) => slice.value > 0)
      .map((slice) => ({
        color: slice.color,
        label: slice.label,
        value: slice.value,
        percent: Math.round((slice.value / total) * 100),
      })),
    210
  );

  svg._auditCleanup = () => {
    handlers.forEach(({ path, onEnter, onMove, onLeave }) => {
      path.removeEventListener("mouseenter", onEnter);
      path.removeEventListener("mousemove", onMove);
      path.removeEventListener("mouseleave", onLeave);
    });
    if (tooltip) tooltip.style.display = "none";
  };
}
