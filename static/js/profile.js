import { graphqlRequest } from "./api.js";
import {
  LEVEL_PATH_LIKE,
  MODULE_PATH,
  XP_PATH_EXCLUDE,
  XP_PATH_LIKE,
} from "./constants.js";
import { renderSkillsRadarChart } from "./charts/radarChart.js";
import { profileEl } from "./dom.js";
import { USER_ID_QUERY, PROFILE_QUERY, XP_COMPARE_QUERY } from "./queries.js";
import { renderDeveloperInfo } from "./render/developer.js";
import { renderStatistics } from "./render/statistics.js";
import { appState } from "./state.js";

let loading = false;

function showProfileError(message) {
  profileEl.error.textContent = message;
  profileEl.error.classList.remove("hidden");
}

function clearProfileError() {
  profileEl.error.textContent = "";
  profileEl.error.classList.add("hidden");
}

function renderProfile(data) {
  renderDeveloperInfo(data, profileEl);
  renderStatistics(data, profileEl);
  renderSkillsRadarChart(profileEl.skillsChart, data.skills || []);
}

function flattenEventUserXp(rows) {
  const out = [];
  (rows || []).forEach((row) => {
    const userId = row.userId;
    const login = row.user?.login;
    (row.user?.transactions || []).forEach((tx) => {
      out.push({
        amount: tx.amount,
        createdAt: tx.createdAt,
        userId,
        user: { login },
      });
    });
  });
  return out;
}

async function loadXpComparison(eventId) {
  if (!eventId) return { cohortXp: [], allXp: [] };

  try {
    const result = await graphqlRequest(XP_COMPARE_QUERY, {
      eventId: Number(eventId),
      xpPath: XP_PATH_LIKE,
      xpExclude: XP_PATH_EXCLUDE,
      modulePath: MODULE_PATH,
    });

    if (result.errors?.length) {
      console.warn("XP compare query:", result.errors[0].message);
      return { cohortXp: [], allXp: [] };
    }

    const cohortXp = flattenEventUserXp(result.data?.cohortUsers);
    const allXp = flattenEventUserXp(result.data?.allUsers);
    return {
      cohortXp,
      allXp: allXp.length ? allXp : cohortXp,
    };
  } catch (error) {
    console.warn("XP compare query failed:", error);
    return { cohortXp: [], allXp: [] };
  }
}

export async function loadProfile() {
  if (loading) return;
  loading = true;
  clearProfileError();

  let userId = Number(appState.userId);

  try {
    if (!userId) {
      const bootstrap = await graphqlRequest(USER_ID_QUERY);
      if (bootstrap.errors?.length) {
        showProfileError(bootstrap.errors[0].message);
        return;
      }
      userId = Number(bootstrap.data?.user?.[0]?.id);
      if (userId) appState.userId = userId;
    }

    if (!userId) {
      showProfileError("Could not read user id from JWT.");
      return;
    }

    const result = await graphqlRequest(PROFILE_QUERY, {
      userId,
      xpPath: XP_PATH_LIKE,
      xpExclude: XP_PATH_EXCLUDE,
      levelPath: LEVEL_PATH_LIKE,
      modulePath: MODULE_PATH,
    });

    if (result.errors?.length) {
      showProfileError(result.errors[0].message);
      return;
    }

    if (!result.data) {
      showProfileError("No profile data returned.");
      return;
    }

    const eventId =
      result.data.moduleEvent?.[0]?.eventId ??
      result.data.moduleEvent?.[0]?.event?.id;

    const compare = await loadXpComparison(eventId);
    renderProfile({ ...result.data, ...compare });
  } catch (error) {
    showProfileError(error.message || "Failed to load profile data.");
  } finally {
    loading = false;
  }
}
