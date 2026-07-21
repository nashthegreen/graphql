import { renderXpLineChart } from "../charts/lineChart.js";
import { renderAuditPieChart } from "../charts/pieChart.js";
import { formatXp } from "../charts/utils.js";
import { summarizeProjects, renderProjectLists } from "./projects.js";
import { renderXpTreemap } from "./treemap.js";

let latestTopProjects = [];
let treemapResizeBound = false;
let treemapEls = null;

let xpChartState = {
  transactions: [],
  tooltip: null,
  svg: null,
};

function redrawTreemap() {
  if (!treemapEls) return;
  renderXpTreemap(
    treemapEls.treemap,
    treemapEls.chartTooltip,
    latestTopProjects
  );
}

function redrawXpChart() {
  if (!xpChartState.svg) return;
  renderXpLineChart(xpChartState.svg, {
    transactions: xpChartState.transactions,
    tooltip: xpChartState.tooltip,
  });
}

export function renderStatistics(data, els) {
  const user = data.user?.[0] || {};
  // Platform totals: totalUp = given (done), totalDown = received.
  // Prefer these over transaction counts so the donut matches auditRatio.
  const auditsUp = Number(user.totalUp) || 0;
  const auditsDown = Number(user.totalDown) || 0;
  const { top } = summarizeProjects(data.xpTransactions || []);

  latestTopProjects = top;
  treemapEls = els;

  if (els.statAuditsUp) els.statAuditsUp.textContent = formatXp(auditsUp);
  if (els.statAuditsDown) els.statAuditsDown.textContent = formatXp(auditsDown);

  xpChartState = {
    transactions: data.xpTransactions || [],
    tooltip: els.chartTooltip,
    svg: els.xpChart,
  };

  redrawXpChart();
  renderAuditPieChart(els.auditChart, user, {
    upCount: auditsUp,
    downCount: auditsDown,
    tooltip: els.chartTooltip,
  });
  redrawTreemap();
  renderProjectLists(
    data.xpTransactions,
    els.recentProjectsList,
    els.topProjectsList
  );

  if (!treemapResizeBound) {
    treemapResizeBound = true;
    window.addEventListener("resize", () => {
      redrawTreemap();
      redrawXpChart();
    });
  }
}
