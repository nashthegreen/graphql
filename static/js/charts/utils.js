const SVG_NS = "http://www.w3.org/2000/svg";

export const palette = {
  amber: "#E3993A",
  cyan: "#5FC9C0",
  rose: "#D96B6B",
  ink: "#E7EEF4",
  inkDim: "#93A9C0",
  inkFaint: "#5C7891",
  grid: "#1E3F5F",
};

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
    fill: palette.inkDim,
    "font-size": "14",
    "font-family": "IBM Plex Mono, monospace",
  });
  text.textContent = message;
  svg.appendChild(text);
}

export function formatXp(amount) {
  const { value, unit } = formatXpParts(amount);
  return unit ? `${value} ${unit}` : value;
}

export function formatXpParts(amount) {
  const raw = Number(amount) || 0;
  if (raw >= 1_000_000) {
    return { value: (raw / 1_000_000).toFixed(2), unit: "MB" };
  }
  if (raw >= 1_000) {
    return { value: (raw / 1_000).toFixed(1), unit: "kB" };
  }
  return { value: String(raw), unit: "B" };
}

export function skillLabel(type) {
  return type.replace(/^skill_/, "").replace(/_/g, " ");
}
