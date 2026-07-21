import {
  createSvgEl,
  clearSvg,
  showEmptyChart,
  skillLabel,
  palette,
} from "./utils.js";

function axisPoint(cx, cy, radius, index, count) {
  const angle = (Math.PI * 2 * index) / count - Math.PI / 2;
  return {
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle),
    angle,
  };
}

export function renderSkillsRadarChart(svg, skills) {
  clearSvg(svg);

  const data = (skills || [])
    .filter((skill) => skill?.type?.startsWith("skill"))
    .slice(0, 8);

  if (!data.length) {
    showEmptyChart(svg, "No skills data available", 640, 360);
    return;
  }

  const width = 640;
  const height = 360;
  const cx = width / 2;
  const cy = height / 2 + 10;
  const maxRadius = 110;
  const levels = [25, 50, 75, 100];
  const count = data.length;

  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");

  levels.forEach((level) => {
    const ratio = level / 100;
    const points = Array.from({ length: count }, (_, index) => {
      const point = axisPoint(cx, cy, maxRadius * ratio, index, count);
      return `${point.x},${point.y}`;
    }).join(" ");

    svg.appendChild(
      createSvgEl("polygon", {
        points,
        fill: "none",
        stroke: palette.grid,
        "stroke-width": "1",
      })
    );
  });

  for (let index = 0; index < count; index += 1) {
    const outer = axisPoint(cx, cy, maxRadius, index, count);
    svg.appendChild(
      createSvgEl("line", {
        x1: String(cx),
        y1: String(cy),
        x2: String(outer.x),
        y2: String(outer.y),
        stroke: palette.grid,
      })
    );

    const labelPoint = axisPoint(cx, cy, maxRadius + 22, index, count);
    const label = createSvgEl("text", {
      x: String(labelPoint.x),
      y: String(labelPoint.y),
      fill: palette.ink,
      "font-size": "11",
      "text-anchor": "middle",
      "dominant-baseline": "middle",
      "font-family": "IBM Plex Mono, monospace",
    });
    label.textContent = skillLabel(data[index].type);
    svg.appendChild(label);
  }

  const valuePoints = data
    .map((skill, index) => {
      const ratio = Math.min(Math.max(Number(skill.amount) || 0, 0), 100) / 100;
      const point = axisPoint(cx, cy, maxRadius * ratio, index, count);
      return `${point.x},${point.y}`;
    })
    .join(" ");

  svg.appendChild(
    createSvgEl("polygon", {
      points: valuePoints,
      fill: "rgba(227, 153, 58, 0.18)",
      stroke: palette.amber,
      "stroke-width": "2",
    })
  );

  data.forEach((skill, index) => {
    const ratio = Math.min(Math.max(Number(skill.amount) || 0, 0), 100) / 100;
    const point = axisPoint(cx, cy, maxRadius * ratio, index, count);
    const dot = createSvgEl("circle", {
      cx: String(point.x),
      cy: String(point.y),
      r: "4",
      fill: palette.amber,
    });

    const title = createSvgEl("title");
    title.textContent = `${skillLabel(skill.type)}: ${skill.amount}%`;
    dot.appendChild(title);
    svg.appendChild(dot);
  });
}
