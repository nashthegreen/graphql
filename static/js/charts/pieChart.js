import { createSvgEl, clearSvg, showEmptyChart } from "./utils.js";

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
        rx: "3",
        fill: item.color,
      })
    );

    const label = createSvgEl("text", {
      x: "62",
      y: String(y + 12),
      fill: "#f2f3f5",
      "font-size": "12",
    });
    label.textContent = `${item.label}: ${item.value} (${item.percent}%)`;
    svg.appendChild(label);
  });
}

export function renderAuditPieChart(svg, user) {
  clearSvg(svg);

  const up = Number(user?.totalUp) || 0;
  const down = Number(user?.totalDown) || 0;
  const total = up + down;

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
      color: "#23a559",
      label: "Done (up)",
      start: -Math.PI / 2,
      end: -Math.PI / 2 + upAngle,
    },
    {
      value: down,
      color: "#f23f43",
      label: "Received (down)",
      start: -Math.PI / 2 + upAngle,
      end: Math.PI * 1.5,
    },
  ];

  slices.forEach((slice) => {
    if (slice.value <= 0) return;

    const path = createSvgEl("path", {
      d: pieSlice(cx, cy, radius, slice.start, slice.end),
      fill: slice.color,
    });

    const title = createSvgEl("title");
    title.textContent = `${slice.label}: ${slice.value}`;
    path.appendChild(title);
    svg.appendChild(path);
  });

  const ratio = createSvgEl("text", {
    x: String(cx),
    y: String(cy + 4),
    "text-anchor": "middle",
    fill: "#f2f3f5",
    "font-size": "14",
    "font-weight": "600",
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
}
