import { renderXpLineChart } from "../charts/lineChart.js";
import { renderAuditPieChart } from "../charts/pieChart.js";
import { formatXp } from "../charts/utils.js";

export function renderStatistics(data, els) {
  const user = data.user?.[0] || {};
  const totalXp =
    data.xpTotal?.aggregate?.sum?.amount ??
    (data.xpTransactions || []).reduce((sum, tx) => sum + tx.amount, 0);
  const progressDone = data.progressDone?.aggregate?.count ?? 0;

  els.statTotalXp.textContent = formatXp(totalXp);
  els.statProgressDone.textContent = String(progressDone);
  els.statAuditRatio.textContent = Number(user.auditRatio || 0).toFixed(2);

  renderXpLineChart(els.xpChart, data.xpTransactions);
  renderAuditPieChart(els.auditChart, user);
}
