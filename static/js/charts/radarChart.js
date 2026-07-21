import {
  createSvgEl,
  clearSvg,
  showEmptyChart,
  setSvgA11y,
  skillLabel,
  palette,
  placeTooltip,
  hideTooltip,
} from "./utils.js";

/** Language / tool skills shown on the Technologies spider. */
const TECH_TYPES = new Set([
  "skill_go",
  "skill_js",
  "skill_javascript",
  "skill_html",
  "skill_css",
  "skill_sql",
  "skill_docker",
  "skill_unix",
  "skill_c",
  "skill_cpp",
  "skill_c++",
  "skill_csharp",
  "skill_c#",
  "skill_php",
  "skill_python",
  "skill_rust",
  "skill_java",
  "skill_ruby",
  "skill_kotlin",
  "skill_swift",
  "skill_typescript",
  "skill_bash",
  "skill_shell",
  "skill_flutter",
  "skill_dart",
  "skill_graphql",
]);

function axisPoint(cx, cy, radius, index, count) {
  const angle = (Math.PI * 2 * index) / count - Math.PI / 2;
  return {
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle),
    angle,
  };
}

function prepareSkills(skills, predicate) {
  return (skills || [])
    .filter((skill) => skill?.type?.startsWith("skill") && predicate(skill.type))
    .sort((a, b) => (Number(b.amount) || 0) - (Number(a.amount) || 0))
    .slice(0, 8);
}

export function splitSkills(skills) {
  const tech = prepareSkills(skills, (type) => TECH_TYPES.has(type));
  const domain = prepareSkills(skills, (type) => !TECH_TYPES.has(type));
  return { domain, tech };
}

/**
 * @param {SVGElement} svg
 * @param {Array} skills
 * @param {string} [emptyMessage]
 * @param {string} [a11yTitle]
 * @param {HTMLElement|null} [tooltip]
 * @param {'skill'|'technology'} [kind]
 */
export function renderRadarChart(
  svg,
  skills,
  emptyMessage = "No skills data available",
  a11yTitle = "Skills radar chart",
  tooltip = null,
  kind = "skill"
) {
  clearSvg(svg);
  if (svg._radarCleanup) {
    svg._radarCleanup();
    svg._radarCleanup = null;
  }

  const data = (skills || []).slice(0, 8);

  if (!data.length) {
    showEmptyChart(svg, emptyMessage, 420, 400, {
      title: a11yTitle,
      desc: emptyMessage,
    });
    return;
  }

  const pad = 52;
  const maxRadius = 140;
  const size = (maxRadius + pad) * 2;
  const cx = size / 2;
  const cy = size / 2;
  const levels = [50, 75, 100];
  const count = data.length;
  const summary = data
    .map((skill) => `${skillLabel(skill.type)} ${skill.amount}%`)
    .join(", ");

  svg.setAttribute("viewBox", `0 0 ${size} ${size}`);
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
  setSvgA11y(svg, a11yTitle, summary);

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

    const labelPoint = axisPoint(cx, cy, maxRadius + 28, index, count);
    const label = createSvgEl("text", {
      x: String(labelPoint.x),
      y: String(labelPoint.y),
      fill: palette.ink,
      "font-size": "12",
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
      "stroke-width": "2.5",
    })
  );

  const handlers = [];

  data.forEach((skill, index) => {
    const amount = Number(skill.amount) || 0;
    const ratio = Math.min(Math.max(amount, 0), 100) / 100;
    const point = axisPoint(cx, cy, maxRadius * ratio, index, count);
    const name = skillLabel(skill.type);
    const rank = index + 1;
    const tipHtml = `<b>${name}</b><br>${Math.round(amount)}%<br>Top #${rank} ${kind}`;

    const hit = createSvgEl("circle", {
      cx: String(point.x),
      cy: String(point.y),
      r: "14",
      fill: "transparent",
      tabindex: "0",
      role: "img",
      "aria-label": `${name}: ${Math.round(amount)}%`,
      style: "cursor:pointer; outline:none",
    });

    const show = (eventOrTarget) => placeTooltip(tooltip, eventOrTarget, tipHtml);
    const onEnter = (event) => show(event);
    const onMove = (event) => placeTooltip(tooltip, event, tipHtml);
    const onLeave = () => hideTooltip(tooltip);
    const onFocus = () => show(hit);
    const onBlur = onLeave;
    const onKey = (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        show(hit);
      }
    };

    hit.addEventListener("mouseenter", onEnter);
    hit.addEventListener("mousemove", onMove);
    hit.addEventListener("mouseleave", onLeave);
    hit.addEventListener("focus", onFocus);
    hit.addEventListener("blur", onBlur);
    hit.addEventListener("keydown", onKey);
    handlers.push({ hit, onEnter, onMove, onLeave, onFocus, onBlur, onKey });

    svg.appendChild(hit);

    const dot = createSvgEl("circle", {
      cx: String(point.x),
      cy: String(point.y),
      r: "4.5",
      fill: palette.amber,
      "pointer-events": "none",
    });
    svg.appendChild(dot);
  });

  svg._radarCleanup = () => {
    handlers.forEach(
      ({ hit, onEnter, onMove, onLeave, onFocus, onBlur, onKey }) => {
        hit.removeEventListener("mouseenter", onEnter);
        hit.removeEventListener("mousemove", onMove);
        hit.removeEventListener("mouseleave", onLeave);
        hit.removeEventListener("focus", onFocus);
        hit.removeEventListener("blur", onBlur);
        hit.removeEventListener("keydown", onKey);
      }
    );
    hideTooltip(tooltip);
  };
}

export function renderSkillsRadarChart(svg, skills, tooltip = null) {
  const { domain } = splitSkills(skills);
  renderRadarChart(
    svg,
    domain,
    "No skills data available",
    "Skills radar chart",
    tooltip,
    "skill"
  );
}

export function renderTechRadarChart(svg, skills, tooltip = null) {
  const { tech } = splitSkills(skills);
  renderRadarChart(
    svg,
    tech,
    "No technologies data available",
    "Technologies radar chart",
    tooltip,
    "technology"
  );
}
