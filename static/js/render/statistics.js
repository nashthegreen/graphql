import { renderXpLineChart } from "../charts/lineChart.js";
import { renderAuditPieChart } from "../charts/pieChart.js";
import { summarizeProjects, renderProjectLists } from "./projects.js";
import { renderXpTreemap } from "./treemap.js";

let latestTopProjects = [];
let treemapResizeBound = false;
let treemapEls = null;
let xpCompareBound = false;

/** @type {'cohort' | 'all'} */
let compareMode = "cohort";

let xpChartState = {
  transactions: [],
  cohortTransactions: [],
  allTransactions: [],
  tooltip: null,
  svg: null,
};

function redrawTreemap() {
  if (!treemapEls) return;
  renderXpTreemap(
    treemapEls.treemap,
    treemapEls.treemapTooltip,
    latestTopProjects
  );
}

function redrawXpChart() {
  if (!xpChartState.svg) return;
  renderXpLineChart(xpChartState.svg, {
    transactions: xpChartState.transactions,
    compareMode,
    cohortTransactions: xpChartState.cohortTransactions,
    allTransactions: xpChartState.allTransactions,
    tooltip: xpChartState.tooltip,
  });
}

function syncCompareButton(btn) {
  if (!btn) return;
  btn.dataset.mode = compareMode;
  btn.classList.add("active");
  btn.textContent = compareMode === "cohort" ? "Cohort" : "All students";
  btn.title =
    compareMode === "cohort"
      ? "Showing cohort average — click for all students"
      : "Showing all students average — click for cohort";
}

export function renderStatistics(data, els) {
  const user = data.user?.[0] || {};
  const auditsUp = data.auditsUp?.aggregate?.count ?? 0;
  const auditsDown = data.auditsDown?.aggregate?.count ?? 0;
  const { top } = summarizeProjects(data.xpTransactions || []);

  latestTopProjects = top;
  treemapEls = els;

  if (els.statAuditsUp) els.statAuditsUp.textContent = String(auditsUp);
  if (els.statAuditsDown) els.statAuditsDown.textContent = String(auditsDown);

  xpChartState = {
    transactions: data.xpTransactions || [],
    cohortTransactions: data.cohortXp || [],
    allTransactions: data.allXp || data.cohortXp || [],
    tooltip: els.chartTooltip || els.treemapTooltip,
    svg: els.xpChart,
  };

  syncCompareButton(els.xpCompareBtn);
  redrawXpChart();
  renderAuditPieChart(els.auditChart, user, {
    upCount: auditsUp,
    downCount: auditsDown,
    tooltip: els.chartTooltip || els.treemapTooltip,
  });
  redrawTreemap();
  renderProjectLists(
    data.xpTransactions,
    els.topProjectsList,
    els.recentProjectsList
  );

  if (!treemapResizeBound) {
    treemapResizeBound = true;
    window.addEventListener("resize", () => {
      redrawTreemap();
      redrawXpChart();
    });
  }

  if (!xpCompareBound && els.xpCompareBtn) {
    xpCompareBound = true;
    els.xpCompareBtn.addEventListener("click", () => {
      compareMode = compareMode === "cohort" ? "all" : "cohort";
      syncCompareButton(els.xpCompareBtn);
      redrawXpChart();
    });
  }
}
