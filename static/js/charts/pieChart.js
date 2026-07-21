import {
  createSvgEl,
  clearSvg,
  showEmptyChart,
  setSvgA11y,
  formatXp,
  palette,
  placeTooltip,
  hideTooltip,
} from "./utils.js";

function donutSlice(cx, cy, outerR, innerR, startAngle, endAngle) {
  const x1 = cx + outerR * Math.cos(startAngle);
  const y1 = cy + outerR * Math.sin(startAngle);
  const x2 = cx + outerR * Math.cos(endAngle);
  const y2 = cy + outerR * Math.sin(endAngle);
  const x3 = cx + innerR * Math.cos(endAngle);
  const y3 = cy + innerR * Math.sin(endAngle);
  const x4 = cx + innerR * Math.cos(startAngle);
  const y4 = cy + innerR * Math.sin(startAngle);
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;

  return [
    `M ${x1} ${y1}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2} ${y2}`,
    `L ${x3} ${y3}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${x4} ${y4}`,
    "Z",
  ].join(" ");
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
  const ratioValue = Number(user?.auditRatio || 0).toFixed(1);

  if (total === 0) {
    showEmptyChart(svg, "No audit data available", 320, 260, {
      title: "Audit ratio",
      desc: "No audit up or down votes available yet.",
    });
    return;
  }

  const width = 320;
  const height = 260;
  const cx = width / 2;
  const cy = height / 2 - 4;
  const outerR = 78;
  const innerR = 46;

  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
  setSvgA11y(
    svg,
    "Audit ratio donut chart",
    `Audit ratio ${ratioValue}. Up ${formatXp(up)}, down ${formatXp(down)}.`
  );

  const upAngle = (up / total) * Math.PI * 2;
  const slices = [
    {
      value: up,
      color: palette.amber,
      label: "Audits up",
      start: -Math.PI / 2,
      end: -Math.PI / 2 + upAngle,
    },
    {
      value: down,
      color: palette.rose,
      label: "Audits down",
      start: -Math.PI / 2 + upAngle,
      end: Math.PI * 1.5,
    },
  ];

  const handlers = [];

  slices.forEach((slice) => {
    if (slice.value <= 0) return;

    const path = createSvgEl("path", {
      d: donutSlice(cx, cy, outerR, innerR, slice.start, slice.end),
      fill: slice.color,
      class: "audit-slice",
      tabindex: "0",
      role: "img",
      "aria-label": `${slice.label}: ${formatXp(slice.value)}`,
      style: "cursor:pointer; transition: opacity .15s; outline: none",
    });

    const percent = Math.round((slice.value / total) * 100);
    const tipHtml = `<b>${slice.label}</b><br>${formatXp(slice.value)}<br>${percent}% of total`;

    const show = (eventOrTarget) => {
      path.style.opacity = "0.85";
      placeTooltip(tooltip, eventOrTarget, tipHtml);
    };

    const onEnter = (event) => show(event);
    const onMove = (event) => placeTooltip(tooltip, event, tipHtml);
    const onLeave = () => {
      path.style.opacity = "1";
      hideTooltip(tooltip);
    };
    const onFocus = () => show(path);
    const onBlur = onLeave;
    const onKey = (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        show(path);
      }
    };

    path.addEventListener("mouseenter", onEnter);
    path.addEventListener("mousemove", onMove);
    path.addEventListener("mouseleave", onLeave);
    path.addEventListener("focus", onFocus);
    path.addEventListener("blur", onBlur);
    path.addEventListener("keydown", onKey);
    handlers.push({ path, onEnter, onMove, onLeave, onFocus, onBlur, onKey });

    svg.appendChild(path);
  });

  const ratio = createSvgEl("text", {
    x: String(cx),
    y: String(cy - 2),
    "text-anchor": "middle",
    "dominant-baseline": "middle",
    fill: palette.ink,
    "font-size": "22",
    "font-weight": "700",
    "font-family": "Space Mono, monospace",
  });
  ratio.textContent = ratioValue;
  svg.appendChild(ratio);

  const ratioCap = createSvgEl("text", {
    x: String(cx),
    y: String(cy + 18),
    "text-anchor": "middle",
    fill: palette.inkFaint,
    "font-size": "9",
    "letter-spacing": "0.12em",
    "font-family": "IBM Plex Mono, monospace",
  });
  ratioCap.textContent = "RATIO";
  svg.appendChild(ratioCap);

  svg._auditCleanup = () => {
    handlers.forEach(
      ({ path, onEnter, onMove, onLeave, onFocus, onBlur, onKey }) => {
        path.removeEventListener("mouseenter", onEnter);
        path.removeEventListener("mousemove", onMove);
        path.removeEventListener("mouseleave", onLeave);
        path.removeEventListener("focus", onFocus);
        path.removeEventListener("blur", onBlur);
        path.removeEventListener("keydown", onKey);
      }
    );
    hideTooltip(tooltip);
  };
}
