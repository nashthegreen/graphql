import { graphqlRequest, SessionExpiredError } from "./api.js";
import {
  LEVEL_PATH_LIKE,
  MODULE_PATH,
  XP_PATH_LIKE,
  XP_PISCINE_JS_PATH,
  XP_PISCINE_NLIKE,
  XP_PISCINE_RUST_PATH,
} from "./constants.js";
import {
  renderSkillsRadarChart,
  renderTechRadarChart,
} from "./charts/radarChart.js";
import { getProfileEl } from "./dom.js";
import { USER_ID_QUERY, PROFILE_QUERY } from "./queries.js";
import { renderDeveloperInfo } from "./render/developer.js";
import {
  cleanupStatistics,
  renderStatistics,
} from "./render/statistics.js";
import { mountView } from "./router.js";
import { appState } from "./token.js";
import { logout } from "./auth.js";

let loading = false;
let loadGeneration = 0;

function showProfileError(message) {
  const el = getProfileEl().error;
  if (!el) return;
  el.textContent = message;
  el.classList.remove("hidden");
}

function clearProfileError() {
  const el = getProfileEl().error;
  if (!el) return;
  el.textContent = "";
  el.classList.add("hidden");
}

function renderProfile(data) {
  const els = getProfileEl();
  renderDeveloperInfo(data, els);
  renderStatistics(data, els);
  const skills = data.skills || [];
  const tip = els.chartTooltip;
  renderSkillsRadarChart(els.skillsChart, skills, tip);
  renderTechRadarChart(els.techChart, skills, tip);
}

export async function loadProfile() {
  if (loading) return;
  loading = true;
  const gen = ++loadGeneration;
  clearProfileError();

  let userId = Number(appState.userId);

  try {
    if (!userId) {
      const bootstrap = await graphqlRequest(USER_ID_QUERY);
      if (gen !== loadGeneration) return;
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
      xpPiscineNlike: XP_PISCINE_NLIKE,
      xpPiscineJs: XP_PISCINE_JS_PATH,
      xpPiscineRust: XP_PISCINE_RUST_PATH,
      levelPath: LEVEL_PATH_LIKE,
      modulePath: MODULE_PATH,
    });

    if (gen !== loadGeneration) return;

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
    if (gen !== loadGeneration) return;
    showProfileError(error.message || "Failed to load profile data.");
  } finally {
    if (gen === loadGeneration) loading = false;
  }
}

/**
 * Mount the profile view, bind logout, and load data.
 * Cleanup cancels in-flight work and tears down chart listeners.
 */
export function mountProfile() {
  mountView("profile", {
    mount() {
      const { logoutBtn } = getProfileEl();
      logoutBtn?.addEventListener("click", logout);

      return () => {
        loadGeneration += 1;
        loading = false;
        logoutBtn?.removeEventListener("click", logout);
        cleanupStatistics();
        const tip = document.getElementById("tm-tooltip");
        if (tip) {
          tip.classList.remove("visible");
          tip.innerHTML = "";
        }
      };
    },
  });

  loadProfile();
}
