import { graphqlRequest, SessionExpiredError } from "./api.js";
import {
  LEVEL_PATH_LIKE,
  MODULE_PATH,
  XP_PATH_EXCLUDE,
  XP_PATH_EXCLUDE_GO,
  XP_PATH_LIKE,
} from "./constants.js";
import {
  renderSkillsRadarChart,
  renderTechRadarChart,
} from "./charts/radarChart.js";
import { profileEl } from "./dom.js";
import { USER_ID_QUERY, PROFILE_QUERY } from "./queries.js";
import { renderDeveloperInfo } from "./render/developer.js";
import { renderStatistics } from "./render/statistics.js";
import { appState } from "./token.js";

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
  const skills = data.skills || [];
  const tip = profileEl.chartTooltip;
  renderSkillsRadarChart(profileEl.skillsChart, skills, tip);
  renderTechRadarChart(profileEl.techChart, skills, tip);
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
      xpExcludeGo: XP_PATH_EXCLUDE_GO,
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

    renderProfile(result.data);
  } catch (error) {
    if (error instanceof SessionExpiredError) return;
    showProfileError(error.message || "Failed to load profile data.");
  } finally {
    loading = false;
  }
}
