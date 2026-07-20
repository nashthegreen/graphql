const SVG_NS = "http://www.w3.org/2000/svg";

export function createSvgEl(tag, attrs = {}) {
  const el = document.createElementNS(SVG_NS, tag);
  Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
  return el;
}

export function clearSvg(svg) {
  svg.innerHTML = "";
  svg.removeAttribute("viewBox");
}

export function showEmptyChart(svg, message, width = 600, height = 280) {
  clearSvg(svg);
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");

  const text = createSvgEl("text", {
    x: String(width / 2),
    y: String(height / 2),
    "text-anchor": "middle",
    fill: "#949ba4",
    "font-size": "14",
  });
  text.textContent = message;
  svg.appendChild(text);
}

export function formatXp(amount) {
  const value = Number(amount) || 0;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)} MB`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)} kB`;
  return `${value} B`;
}

export function skillLabel(type) {
  return type.replace(/^skill_/, "").replace(/_/g, " ");
}
