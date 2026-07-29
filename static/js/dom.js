/** Resolve live DOM nodes after a view is mounted into #app. */

export function getApp() {
  return document.getElementById("app");
}

export function getLoginEl() {
  return {
    form: document.getElementById("login-form"),
    identifier: document.getElementById("login-identifier"),
    password: document.getElementById("login-password"),
    error: document.getElementById("login-error"),
    submitBtn: document.getElementById("login-submit-btn"),
  };
}

export function getProfileEl() {
  return {
    title: document.getElementById("profile-title"),
    login: document.getElementById("profile-login"),
    error: document.getElementById("profile-error"),

    devName: document.getElementById("dev-name"),
    devLogin: document.getElementById("dev-login"),
    devEmail: document.getElementById("dev-email"),
    devUserId: document.getElementById("dev-user-id"),
    devBestFriend: document.getElementById("dev-best-friend"),
    devGitea: document.getElementById("dev-gitea"),
    devTotalXpNum: document.getElementById("dev-total-xp-num"),
    devTotalXpUnit: document.getElementById("dev-total-xp-unit"),
    devLevel: document.getElementById("dev-level"),
    devRank: document.getElementById("dev-rank"),
    devRankSub: document.getElementById("dev-rank-sub"),
    levelArc: document.getElementById("level-arc"),
    latestProject: document.getElementById("dev-latest-project"),

    statAuditsUp: document.getElementById("stat-audits-up"),
    statAuditsDown: document.getElementById("stat-audits-down"),
    xpChart: document.getElementById("xp-line-chart"),
    auditChart: document.getElementById("audit-pie-chart"),
    treemap: document.getElementById("treemap"),
    chartTooltip: document.getElementById("tm-tooltip"),
    topProjectsList: document.getElementById("top-projects-list"),

    skillsChart: document.getElementById("skills-radar-chart"),
    techChart: document.getElementById("tech-radar-chart"),
    recentProjectsList: document.getElementById("recent-projects-list"),

    logoutBtn: document.getElementById("logout-btn"),
  };
}
