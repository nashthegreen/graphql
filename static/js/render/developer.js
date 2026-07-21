import { formatXpParts } from "../charts/utils.js";
import { GITEA_BASE } from "../constants.js";
import { projectNameFromPath, summarizeProjects } from "./projects.js";

/**
 * Platform logic (getRank): highest rank whose threshold level is <= current level.
 * ranksDefinitions come from the module object's attrs.
 */
function getRank(level, ranksDefinitions) {
  const value = Number(level) || 0;
  if (value < 0 || !Array.isArray(ranksDefinitions) || !ranksDefinitions.length) {
    return null;
  }

  const match = ranksDefinitions
    .filter(
      (rank) =>
        typeof rank?.name === "string" &&
        typeof rank?.level === "number" &&
        value >= rank.level
    )
    .sort((a, b) => b.level - a.level)[0];

  return match?.name || null;
}

function resolveLevel(data) {
  const eventLevel = data.moduleEvent?.[0]?.level;
  if (eventLevel != null && eventLevel !== "") return Number(eventLevel);

  const txLevel = data.latestLevel?.[0]?.amount;
  if (txLevel != null && txLevel !== "") return Number(txLevel);

  return 0;
}

function resolveRanksDefinitions(data) {
  const fromEvent = data.moduleEvent?.[0]?.event?.object?.attrs?.ranksDefinitions;
  if (Array.isArray(fromEvent) && fromEvent.length) return fromEvent;

  const fromObject = data.moduleObject?.[0]?.attrs?.ranksDefinitions;
  if (Array.isArray(fromObject) && fromObject.length) return fromObject;

  return [];
}

/**
 * Platform XP formulas (learn.reboot01.com):
 * getXp(level) = 33*l^3 + 124.5*l^2 + 672.5*l
 */
function xpForLevel(level) {
  const l = Number(level) || 0;
  if (l <= 0) return 0;
  return 33 * l ** 3 + 124.5 * l ** 2 + 672.5 * l;
}

function levelProgress(level, totalXp) {
  const value = Number(level) || 0;
  if (value <= 0) {
    return { progress: 0, label: "—" };
  }

  const nextLevel = value + 1;
  const xpNow = Number(totalXp) || 0;
  const xpFloor = xpForLevel(value);
  const xpCeil = xpForLevel(nextLevel);
  const span = xpCeil - xpFloor;

  let progress = 0;
  if (span > 0) {
    progress = Math.min(Math.max((xpNow - xpFloor) / span, 0), 1);
  }

  const pct = Math.round(progress * 100);
  return {
    progress,
    label: `${pct}% to level ${nextLevel}`,
  };
}

function setLevelArc(arc, progress) {
  if (!arc) return;
  const circumference = 2 * Math.PI * 33;
  arc.setAttribute("stroke-dasharray", circumference.toFixed(1));
  arc.setAttribute(
    "stroke-dashoffset",
    (circumference * (1 - progress)).toFixed(1)
  );
}

/**
 * Platform best-friend logic: most frequent co-member login across
 * finished groups with more than one member.
 */
function resolveBestFriend(groups, selfLogin, selfId) {
  const counts = {};

  (groups || [])
    .filter((group) => group?.status === "finished" && group.members?.length > 1)
    .forEach((group) => {
      group.members.forEach((member) => {
        const login = member?.login || member?.userLogin || member?.user?.login;
        const id = member?.userId ?? member?.user?.id;
        if (!login) return;
        if (selfLogin && login === selfLogin) return;
        if (selfId != null && Number(id) === Number(selfId)) return;
        counts[login] = (counts[login] || 0) + 1;
      });
    });

  const entries = Object.entries(counts);
  if (!entries.length) return null;

  const max = Math.max(...entries.map(([, count]) => count));
  const winners = entries
    .filter(([, count]) => count === max)
    .map(([login]) => login)
    .sort();

  if (winners.length === 1) return `@${winners[0]}`;
  return `@${winners[0]} +${winners.length - 1}`;
}

export function renderDeveloperInfo(data, els) {
  const user = data.user?.[0] || {};
  const profile = data.profile || user;
  const level = resolveLevel(data);
  const ranksDefinitions = resolveRanksDefinitions(data);
  const rank = getRank(level, ranksDefinitions);
  const totalXp =
    data.xpUp?.aggregate?.sum?.amount ??
    data.xpTotal?.aggregate?.sum?.amount ??
    (data.xpTransactions || []).reduce(
      (sum, tx) => sum + (tx.amount > 0 ? tx.amount : 0),
      0
    );
  const { progress, label: rankSub } = levelProgress(level, totalXp);

  const fullName = [profile.firstName, profile.lastName]
    .filter(Boolean)
    .join(" ");
  const login = profile.login || user.login || "user";
  const userId = profile.id || user.id;
  const { value, unit } = formatXpParts(totalXp);
  const { recent } = summarizeProjects(data.xpTransactions || []);
  const latest = recent[0];
  const bestFriend = resolveBestFriend(data.finishedGroups, login, userId);

  els.title.textContent = fullName || "Developer Profile";
  els.login.textContent = `@${login}`;
  els.devName.textContent = fullName || login || "—";
  els.devLogin.textContent = login || "—";
  if (els.devGitea) {
    if (login && login !== "user") {
      els.devGitea.href = `${GITEA_BASE}/${encodeURIComponent(login)}`;
      els.devGitea.textContent = `git/${login} ↗`;
      els.devGitea.removeAttribute("aria-disabled");
    } else {
      els.devGitea.removeAttribute("href");
      els.devGitea.textContent = "—";
      els.devGitea.setAttribute("aria-disabled", "true");
    }
  }
  els.devEmail.textContent = profile.email || user.email || "—";
  els.devUserId.textContent = String(userId || "—");
  els.devBestFriend.textContent = bestFriend || "—";
  els.devTotalXpNum.textContent = value;
  els.devTotalXpUnit.textContent = unit || "";
  els.devLevel.textContent = level ? String(level) : "—";
  els.devRank.textContent = rank || "—";
  els.devRankSub.textContent = level ? rankSub : "—";
  setLevelArc(els.levelArc, level ? progress : 0);
  els.latestProject.textContent = latest
    ? projectNameFromPath(latest.path) || latest.name
    : "—";
}
