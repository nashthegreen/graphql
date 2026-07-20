export const views = {
  loading: document.getElementById("loading-view"),
  login: document.getElementById("login-view"),
  profile: document.getElementById("profile-view"),
};

export const loginEl = {
  form: document.getElementById("login-form"),
  identifier: document.getElementById("login-identifier"),
  password: document.getElementById("login-password"),
  error: document.getElementById("login-error"),
  submitBtn: document.getElementById("login-submit-btn"),
};

export const profileEl = {
  title: document.getElementById("profile-title"),
  login: document.getElementById("profile-login"),
  error: document.getElementById("profile-error"),

  devName: document.getElementById("dev-name"),
  devLogin: document.getElementById("dev-login"),
  devEmail: document.getElementById("dev-email"),
  devUserId: document.getElementById("dev-user-id"),
  devTotalXp: document.getElementById("dev-total-xp"),
  devLevel: document.getElementById("dev-level"),
  devRank: document.getElementById("dev-rank"),

  statTotalXp: document.getElementById("stat-total-xp"),
  statProgressDone: document.getElementById("stat-progress-done"),
  statAuditRatio: document.getElementById("stat-audit-ratio"),
  xpChart: document.getElementById("xp-line-chart"),
  auditChart: document.getElementById("audit-pie-chart"),

  skillsChart: document.getElementById("skills-radar-chart"),
};

export const logoutBtn = document.getElementById("logout-btn");
