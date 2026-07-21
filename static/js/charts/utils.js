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

/**
 * Add <title> and <desc> for screen readers (call after clearSvg).
 */
export function setSvgA11y(svg, title, desc) {
  if (!svg) return;
  const titleEl = createSvgEl("title");
  titleEl.textContent = title;
  svg.appendChild(titleEl);

  if (desc) {
    const descEl = createSvgEl("desc");
    descEl.textContent = desc;
    svg.appendChild(descEl);
  }
}

export function showEmptyChart(
  svg,
  message,
  width = 600,
  height = 280,
  a11y = null
) {
  clearSvg(svg);
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");

  if (a11y?.title) {
    setSvgA11y(svg, a11y.title, a11y.desc || message);
  }

  const text = createSvgEl("text", {
    x: String(width / 2),
    y: String(height / 2),
    "text-anchor": "middle",
    "dominant-baseline": "middle",
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

/**
 * Position a floating tooltip near a client point or an element's box.
 */
export function placeTooltip(tooltip, eventOrEl, html) {
  if (!tooltip) return;
  tooltip.innerHTML = html;
  tooltip.style.display = "block";

  let x;
  let y;
  if (eventOrEl?.clientX != null) {
    x = eventOrEl.clientX + 14;
    y = eventOrEl.clientY + 14;
  } else if (eventOrEl?.getBoundingClientRect) {
    const rect = eventOrEl.getBoundingClientRect();
    x = rect.left + rect.width / 2 + 10;
    y = rect.top + 8;
  } else {
    return;
  }

  tooltip.style.left = `${x}px`;
  tooltip.style.top = `${y}px`;
}

export function hideTooltip(tooltip) {
  if (tooltip) tooltip.style.display = "none";
}

/** Mix amber intensity by t in [0,1] (higher = more XP / more saturated). */
export function amberByIntensity(t) {
  const clamped = Math.min(Math.max(t, 0), 1);
  const r = Math.round(90 + (227 - 90) * clamped);
  const g = Math.round(70 + (153 - 70) * clamped);
  const b = Math.round(40 + (58 - 40) * clamped);
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Bind pointer + keyboard tooltip handlers. Returns a cleanup function.
 */
export function bindTooltipTarget(el, tooltip, getContent) {
  if (!el || !tooltip) return () => {};

  const show = (eventOrEl) => placeTooltip(tooltip, eventOrEl, getContent());
  const hide = () => hideTooltip(tooltip);

  const onEnter = (event) => show(event);
  const onMove = (event) => placeTooltip(tooltip, event, getContent());
  const onLeave = () => hide();
  const onFocus = () => show(el);
  const onBlur = () => hide();
  const onKey = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      show(el);
    }
  };

  el.addEventListener("mouseenter", onEnter);
  el.addEventListener("mousemove", onMove);
  el.addEventListener("mouseleave", onLeave);
  el.addEventListener("focus", onFocus);
  el.addEventListener("blur", onBlur);
  el.addEventListener("keydown", onKey);

  return () => {
    el.removeEventListener("mouseenter", onEnter);
    el.removeEventListener("mousemove", onMove);
    el.removeEventListener("mouseleave", onLeave);
    el.removeEventListener("focus", onFocus);
    el.removeEventListener("blur", onBlur);
    el.removeEventListener("keydown", onKey);
    hide();
  };
}
