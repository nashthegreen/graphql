import {
  createSvgEl,
  formatXp,
  showEmptyChart,
  clearSvg,
  setSvgA11y,
  palette,
} from "./utils.js";

/**
 * Stable local calendar day key (YYYY-MM-DD).
 * Locale date strings (e.g. 15/01/2024) are not reliably re-parsed by Date.
 */
function dayKey(value) {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDayLabel(isoDay) {
  const d = new Date(`${isoDay}T12:00:00`);
  if (Number.isNaN(d.getTime())) return isoDay;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Build daily cumulative XP for one user from their transactions.
 */
export function toCumulativeSeries(transactions) {
  const dailyXp = {};

  (transactions || []).forEach((tx) => {
    if (!(tx.amount > 0) || !tx.createdAt) return;
    const day = dayKey(tx.createdAt);
    if (!day) return;
    dailyXp[day] = (dailyXp[day] || 0) + tx.amount;
  });

  const dates = Object.keys(dailyXp).sort();

  let running = 0;
  const values = dates.map((date) => {
    running += dailyXp[date];
    return running;
  });

  return { dates, values };
}

function drawSeries(svg, points, color) {
  if (points.length < 2) return;

  svg.appendChild(
    createSvgEl("polyline", {
      points: points.map((p) => `${p.x},${p.y}`).join(" "),
      fill: "none",
      stroke: color,
      "stroke-width": "2.5",
      "stroke-linejoin": "round",
      "stroke-linecap": "round",
    })
  );
}

/**
 * @param {SVGElement} svg
 * @param {object} options
 * @param {Array} options.transactions - current user XP txs
 * @param {HTMLElement} [options.tooltip]
 */
export function renderXpLineChart(svg, options = {}) {
  const { transactions, tooltip = null } =
    typeof options === "object" && !Array.isArray(options)
      ? options
      : { transactions: options };

  clearSvg(svg);
  if (svg._xpCleanup) {
    svg._xpCleanup();
    svg._xpCleanup = null;
  }

  const own = toCumulativeSeries(transactions);

  if (!own.dates.length) {
    showEmptyChart(svg, "No XP data available", 640, 300, {
      title: "XP overtime",
      desc: "No XP transactions available to chart yet.",
    });
    return;
  }

  const width = 640;
  const height = 300;
  const margin = { top: 20, right: 24, bottom: 48, left: 64 };
  const chartW = width - margin.left - margin.right;
  const chartH = height - margin.top - margin.bottom;
  const maxY = Math.max(...own.values, 1);

  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
  setSvgA11y(svg, "Cumulative XP over time", "Your cumulative XP over time.");

  const xAt = (index) =>
    margin.left +
    (own.dates.length === 1
      ? chartW / 2
      : (index / (own.dates.length - 1)) * chartW);
  const yAt = (value) => margin.top + chartH - (value / maxY) * chartH;

  for (let i = 0; i <= 4; i += 1) {
    const y = margin.top + (chartH * i) / 4;
    svg.appendChild(
      createSvgEl("line", {
        x1: String(margin.left),
        y1: String(y),
        x2: String(margin.left + chartW),
        y2: String(y),
        stroke: palette.grid,
        "stroke-width": "1",
      })
    );
  }

  svg.appendChild(
    createSvgEl("line", {
      x1: String(margin.left),
      y1: String(margin.top + chartH),
      x2: String(margin.left + chartW),
      y2: String(margin.top + chartH),
      stroke: palette.grid,
    })
  );

  svg.appendChild(
    createSvgEl("line", {
      x1: String(margin.left),
      y1: String(margin.top),
      x2: String(margin.left),
      y2: String(margin.top + chartH),
      stroke: palette.grid,
    })
  );

  const ownPoints = own.values.map((value, index) => ({
    x: xAt(index),
    y: yAt(value),
    value,
    date: formatDayLabel(own.dates[index]),
  }));

  drawSeries(svg, ownPoints, palette.amber);

  ownPoints.forEach((point) => {
    svg.appendChild(
      createSvgEl("circle", {
        cx: String(point.x),
        cy: String(point.y),
        r: "3.5",
        fill: palette.amber,
        class: "xp-point",
      })
    );
  });

  const maxLabel = createSvgEl("text", {
    x: "8",
    y: String(margin.top + 4),
    fill: palette.inkDim,
    "font-size": "11",
    "font-family": "IBM Plex Mono, monospace",
  });
  maxLabel.textContent = formatXp(maxY);
  svg.appendChild(maxLabel);

  const minLabel = createSvgEl("text", {
    x: "8",
    y: String(margin.top + chartH),
    fill: palette.inkDim,
    "font-size": "11",
    "font-family": "IBM Plex Mono, monospace",
  });
  minLabel.textContent = "0 B";
  svg.appendChild(minLabel);

  const first = createSvgEl("text", {
    x: String(margin.left),
    y: String(height - 12),
    fill: palette.inkDim,
    "font-size": "10",
    "font-family": "IBM Plex Mono, monospace",
  });
  first.textContent = formatDayLabel(own.dates[0]);
  svg.appendChild(first);

  const last = createSvgEl("text", {
    x: String(margin.left + chartW),
    y: String(height - 12),
    fill: palette.inkDim,
    "font-size": "10",
    "text-anchor": "end",
    "font-family": "IBM Plex Mono, monospace",
  });
  last.textContent = formatDayLabel(own.dates[own.dates.length - 1]);
  svg.appendChild(last);

  const guide = createSvgEl("line", {
    x1: "0",
    y1: String(margin.top),
    x2: "0",
    y2: String(margin.top + chartH),
    stroke: palette.inkFaint,
    "stroke-width": "1",
    "stroke-dasharray": "3 3",
    opacity: "0",
    "pointer-events": "none",
  });
  svg.appendChild(guide);

  const hit = createSvgEl("rect", {
    x: String(margin.left),
    y: String(margin.top),
    width: String(chartW),
    height: String(chartH),
    fill: "transparent",
    style: "cursor:crosshair",
    tabindex: "0",
    role: "img",
    "aria-label": "XP overtime chart interaction area",
  });
  svg.appendChild(hit);

  const nearestIndex = (clientX) => {
    const rect = svg.getBoundingClientRect();
    const scaleX = width / rect.width;
    const localX = (clientX - rect.left) * scaleX;
    let best = 0;
    let bestDist = Infinity;
    ownPoints.forEach((point, index) => {
      const dist = Math.abs(point.x - localX);
      if (dist < bestDist) {
        bestDist = dist;
        best = index;
      }
    });
    return best;
  };

  const tipForPoint = (point) =>
    `<b>${point.date}</b><br>${formatXp(point.value)}`;

  const showTip = (event) => {
    const index = nearestIndex(event.clientX);
    const point = ownPoints[index];
    guide.setAttribute("x1", String(point.x));
    guide.setAttribute("x2", String(point.x));
    guide.setAttribute("opacity", "1");

    if (!tooltip) return;
    tooltip.style.display = "block";
    tooltip.style.left = `${event.clientX + 14}px`;
    tooltip.style.top = `${event.clientY + 14}px`;
    tooltip.innerHTML = tipForPoint(point);
  };

  const hideTip = () => {
    guide.setAttribute("opacity", "0");
    if (tooltip) tooltip.style.display = "none";
  };

  const onFocus = () => {
    const point = ownPoints[ownPoints.length - 1];
    guide.setAttribute("x1", String(point.x));
    guide.setAttribute("x2", String(point.x));
    guide.setAttribute("opacity", "1");
    if (!tooltip) return;
    const rect = svg.getBoundingClientRect();
    tooltip.style.display = "block";
    tooltip.style.left = `${rect.left + rect.width * 0.55}px`;
    tooltip.style.top = `${rect.top + 24}px`;
    tooltip.innerHTML = tipForPoint(point);
  };

  hit.addEventListener("mousemove", showTip);
  hit.addEventListener("mouseleave", hideTip);
  hit.addEventListener("focus", onFocus);
  hit.addEventListener("blur", hideTip);

  svg._xpCleanup = () => {
    hit.removeEventListener("mousemove", showTip);
    hit.removeEventListener("mouseleave", hideTip);
    hit.removeEventListener("focus", onFocus);
    hit.removeEventListener("blur", hideTip);
    hideTip();
  };
}
