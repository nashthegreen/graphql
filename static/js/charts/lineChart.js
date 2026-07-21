import {
  createSvgEl,
  formatXp,
  showEmptyChart,
  clearSvg,
  palette,
} from "./utils.js";

/**
 * Build daily cumulative XP for one user from their transactions.
 */
export function toCumulativeSeries(transactions) {
  const dailyXp = {};

  (transactions || []).forEach((tx) => {
    if (!(tx.amount > 0) || !tx.createdAt) return;
    const day = new Date(tx.createdAt).toLocaleDateString();
    dailyXp[day] = (dailyXp[day] || 0) + tx.amount;
  });

  const dates = Object.keys(dailyXp).sort(
    (a, b) => new Date(a) - new Date(b)
  );

  let running = 0;
  const values = dates.map((date) => {
    running += dailyXp[date];
    return running;
  });

  return { dates, values };
}

/**
 * Average cumulative XP across users, aligned to a shared date timeline.
 */
export function averageCumulativeByDate(transactions, timelineDates) {
  const byUser = new Map();

  (transactions || []).forEach((tx) => {
    if (!(tx.amount > 0) || !tx.createdAt) return;
    const key = tx.userId ?? tx.user?.login;
    if (key == null || key === "") return;
    const list = byUser.get(key) || [];
    list.push(tx);
    byUser.set(key, list);
  });

  if (!byUser.size || !timelineDates?.length) {
    return timelineDates.map(() => null);
  }

  const userSeries = [...byUser.values()].map((txs) => {
    const { dates, values } = toCumulativeSeries(txs);
    return dates.map((date, index) => ({
      time: new Date(date).getTime(),
      value: values[index],
    }));
  });

  return timelineDates.map((date) => {
    const t = new Date(date).getTime();
    let sum = 0;
    let count = 0;

    userSeries.forEach((points) => {
      let last = null;
      for (const point of points) {
        if (point.time <= t) last = point.value;
        else break;
      }
      if (last != null) {
        sum += last;
        count += 1;
      }
    });

    return count ? sum / count : null;
  });
}

function drawSeries(svg, points, color, dashed = false) {
  if (points.length < 2) return;

  svg.appendChild(
    createSvgEl("polyline", {
      points: points.map((p) => `${p.x},${p.y}`).join(" "),
      fill: "none",
      stroke: color,
      "stroke-width": dashed ? "2" : "2.5",
      "stroke-linejoin": "round",
      "stroke-linecap": "round",
      "stroke-dasharray": dashed ? "5 4" : "none",
    })
  );
}

function addLegend(svg, items, width) {
  let x = width - 16;
  items
    .slice()
    .reverse()
    .forEach((item) => {
      const labelWidth = item.label.length * 6.2 + 18;
      x -= labelWidth;

      svg.appendChild(
        createSvgEl("line", {
          x1: String(x),
          y1: "12",
          x2: String(x + 14),
          y2: "12",
          stroke: item.color,
          "stroke-width": "2",
          "stroke-dasharray": item.dashed ? "4 3" : "none",
        })
      );

      const text = createSvgEl("text", {
        x: String(x + 18),
        y: "15",
        fill: palette.inkDim,
        "font-size": "10",
        "font-family": "IBM Plex Mono, monospace",
      });
      text.textContent = item.label;
      svg.appendChild(text);
    });
}

/**
 * @param {SVGElement} svg
 * @param {object} options
 * @param {Array} options.transactions - current user XP txs
 * @param {'cohort'|'all'|null} options.compareMode
 * @param {Array} [options.cohortTransactions]
 * @param {Array} [options.allTransactions]
 * @param {HTMLElement} [options.tooltip]
 */
export function renderXpLineChart(svg, options = {}) {
  const {
    transactions,
    compareMode = null,
    cohortTransactions = [],
    allTransactions = [],
    tooltip = null,
  } = typeof options === "object" && !Array.isArray(options)
    ? options
    : { transactions: options };

  clearSvg(svg);
  if (svg._xpCleanup) {
    svg._xpCleanup();
    svg._xpCleanup = null;
  }

  const own = toCumulativeSeries(transactions);

  if (!own.dates.length) {
    showEmptyChart(svg, "No XP data available");
    return;
  }

  const compareTx =
    compareMode === "cohort"
      ? cohortTransactions
      : compareMode === "all"
        ? allTransactions
        : [];
  const compareValues = compareMode
    ? averageCumulativeByDate(compareTx, own.dates)
    : [];

  const width = 640;
  const height = 300;
  const margin = { top: 28, right: 24, bottom: 48, left: 64 };
  const chartW = width - margin.left - margin.right;
  const chartH = height - margin.top - margin.bottom;

  const compareMax = Math.max(
    0,
    ...compareValues.filter((v) => v != null)
  );
  const maxY = Math.max(...own.values, compareMax, 1);

  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");

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
    date: own.dates[index],
    compare:
      compareValues[index] != null ? compareValues[index] : null,
  }));

  drawSeries(svg, ownPoints, palette.amber, false);

  if (compareMode) {
    const comparePoints = ownPoints
      .map((point, index) =>
        compareValues[index] != null
          ? { x: point.x, y: yAt(compareValues[index]) }
          : null
      )
      .filter(Boolean);
    drawSeries(svg, comparePoints, palette.cyan, true);
  }

  const legendItems = [{ label: "You", color: palette.amber, dashed: false }];
  if (compareMode === "cohort") {
    legendItems.push({
      label: "Cohort avg",
      color: palette.cyan,
      dashed: true,
    });
  } else if (compareMode === "all") {
    legendItems.push({
      label: "All students avg",
      color: palette.cyan,
      dashed: true,
    });
  }
  addLegend(svg, legendItems, width);

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

    if (point.compare != null) {
      svg.appendChild(
        createSvgEl("circle", {
          cx: String(point.x),
          cy: String(yAt(point.compare)),
          r: "3",
          fill: palette.cyan,
          class: "xp-point",
        })
      );
    }
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
  first.textContent = own.dates[0];
  svg.appendChild(first);

  const last = createSvgEl("text", {
    x: String(margin.left + chartW),
    y: String(height - 12),
    fill: palette.inkDim,
    "font-size": "10",
    "text-anchor": "end",
    "font-family": "IBM Plex Mono, monospace",
  });
  last.textContent = own.dates[own.dates.length - 1];
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

  const showTip = (event) => {
    const index = nearestIndex(event.clientX);
    const point = ownPoints[index];
    guide.setAttribute("x1", String(point.x));
    guide.setAttribute("x2", String(point.x));
    guide.setAttribute("opacity", "1");

    if (!tooltip) return;

    const compareLabel =
      compareMode === "cohort"
        ? "Cohort avg"
        : compareMode === "all"
          ? "All students avg"
          : null;

    let html = `<b>${point.date}</b><br>You: ${formatXp(point.value)}`;
    if (compareLabel && point.compare != null) {
      html += `<br>${compareLabel}: ${formatXp(point.compare)}`;
    }

    tooltip.style.display = "block";
    tooltip.style.left = `${event.clientX + 14}px`;
    tooltip.style.top = `${event.clientY + 14}px`;
    tooltip.innerHTML = html;
  };

  const hideTip = () => {
    guide.setAttribute("opacity", "0");
    if (tooltip) tooltip.style.display = "none";
  };

  hit.addEventListener("mousemove", showTip);
  hit.addEventListener("mouseleave", hideTip);

  svg._xpCleanup = () => {
    hit.removeEventListener("mousemove", showTip);
    hit.removeEventListener("mouseleave", hideTip);
    hideTip();
  };
}
