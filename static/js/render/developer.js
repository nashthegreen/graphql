import { formatXp } from "../charts/utils.js";

const RANKS = [
  "",
  "Guest",
  "Guest developer",
  "Beginner developer",
  "Junior developer",
  "Confirmed developer",
  "Apprentice developer",
  "Assistant developer",
  "Associate developer",
  "Developer",
  "Senior developer",
  "Expert developer",
  "Master developer",
  "Grand Master developer",
];

function levelToRank(level) {
  const value = Number(level) || 0;
  if (value <= 0) return "—";
  if (value >= RANKS.length) return RANKS[RANKS.length - 1];
  return RANKS[value] || "—";
}

export function renderDeveloperInfo(data, els) {
  const user = data.user?.[0] || {};
  const profile = data.profile || user;
  const levelTx = data.latestLevel?.[0];
  const level = levelTx?.amount ?? 0;
  const totalXp =
    data.xpUp?.aggregate?.sum?.amount ??
    data.xpTotal?.aggregate?.sum?.amount ??
    (data.xpTransactions || []).reduce(
      (sum, tx) => sum + (tx.amount > 0 ? tx.amount : 0),
      0
    );

  const fullName = [profile.firstName, profile.lastName]
    .filter(Boolean)
    .join(" ");

  els.title.textContent = fullName ? `${fullName}'s Profile` : "My Profile";
  els.login.textContent = `@${profile.login || user.login || "user"}`;
  els.devName.textContent = fullName || "—";
  els.devLogin.textContent = profile.login || user.login || "—";
  els.devEmail.textContent = profile.email || user.email || "—";
  els.devUserId.textContent = String(profile.id || user.id || "—");
  els.devTotalXp.textContent = formatXp(totalXp);
  els.devLevel.textContent = level ? String(level) : "—";
  els.devRank.textContent = level ? levelToRank(level) : "—";
}
