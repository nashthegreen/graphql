import {
  createSvgEl,
  formatXp,
  showEmptyChart,
  clearSvg,
} from "./utils.js";

export function renderXpLineChart(svg, transactions) {
  clearSvg(svg);

  if (!transactions?.length) {
    showEmptyChart(svg, "No XP data available");
    return;
  }

  const dailyXp = {};
  transactions.forEach((tx) => {
    const day = new Date(tx.createdAt).toLocaleDateString();
    dailyXp[day] = (dailyXp[day] || 0) + tx.amount;
  });

  const dates = Object.keys(dailyXp).sort(
    (a, b) => new Date(a) - new Date(b)
  );

  let running = 0;
  const cumulative = dates.map((date) => {
    running += dailyXp[date];
    return running;
  });

  const width = 640;
  const height = 300;
  const margin = { top: 24, right: 24, bottom: 48, left: 64 };
  const chartW = width - margin.left - margin.right;
  const chartH = height - margin.top - margin.bottom;
  const maxY = Math.max(...cumulative, 1);

  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");

  const xAt = (index) =>
    margin.left +
    (dates.length === 1 ? chartW / 2 : (index / (dates.length - 1)) * chartW);
  const yAt = (value) =>
    margin.top + chartH - (value / maxY) * chartH;

  svg.appendChild(
    createSvgEl("line", {
      x1: String(margin.left),
      y1: String(margin.top + chartH),
      x2: String(margin.left + chartW),
      y2: String(margin.top + chartH),
      stroke: "rgba(255,255,255,0.2)",
    })
  );

  svg.appendChild(
    createSvgEl("line", {
      x1: String(margin.left),
      y1: String(margin.top),
      x2: String(margin.left),
      y2: String(margin.top + chartH),
      stroke: "rgba(255,255,255,0.2)",
    })
  );

  const points = cumulative
    .map((value, index) => `${xAt(index)},${yAt(value)}`)
    .join(" ");

  svg.appendChild(
    createSvgEl("polyline", {
      points,
      fill: "none",
      stroke: "#688fe8",
      "stroke-width": "2.5",
      "stroke-linejoin": "round",
      "stroke-linecap": "round",
    })
  );

  cumulative.forEach((value, index) => {
    const circle = createSvgEl("circle", {
      cx: String(xAt(index)),
      cy: String(yAt(value)),
      r: "4",
      fill: "#9271db",
    });

    const title = createSvgEl("title");
    title.textContent = `${dates[index]}: ${formatXp(value)} total`;
    circle.appendChild(title);
    svg.appendChild(circle);
  });

  const maxLabel = createSvgEl("text", {
    x: "8",
    y: String(margin.top + 4),
    fill: "#949ba4",
    "font-size": "11",
  });
  maxLabel.textContent = formatXp(maxY);
  svg.appendChild(maxLabel);

  const minLabel = createSvgEl("text", {
    x: "8",
    y: String(margin.top + chartH),
    fill: "#949ba4",
    "font-size": "11",
  });
  minLabel.textContent = "0 B";
  svg.appendChild(minLabel);

  if (dates.length > 0) {
    const first = createSvgEl("text", {
      x: String(margin.left),
      y: String(height - 12),
      fill: "#949ba4",
      "font-size": "10",
    });
    first.textContent = dates[0];
    svg.appendChild(first);

    const last = createSvgEl("text", {
      x: String(margin.left + chartW),
      y: String(height - 12),
      fill: "#949ba4",
      "font-size": "10",
      "text-anchor": "end",
    });
    last.textContent = dates[dates.length - 1];
    svg.appendChild(last);
  }
}
