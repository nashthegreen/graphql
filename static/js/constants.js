export const SIGNIN_URL = "https://learn.reboot01.com/api/auth/signin";
export const GRAPHQL_URL =
  "https://learn.reboot01.com/api/graphql-engine/v1/graphql";

export const TOKEN_KEY = "graphql_profile_jwt";

/** Adjust these if your campus module path differs (see GRAPHQL_DATA_GUIDE.md). */
export const XP_PATH_LIKE = "/bahrain/bh-module/%";
export const XP_PATH_EXCLUDE = "/bahrain/bh-module/piscine-js/%";
export const XP_PATH_EXCLUDE_GO = "/bahrain/piscine-go/%";
/** Matches `/bahrain/bh-module` and nested paths (level txs use the root path). */
export const LEVEL_PATH_LIKE = "/bahrain/bh-module%";
export const MODULE_PATH = "/bahrain/bh-module";

/** Public Gitea profile base (platform git UI). */
export const GITEA_BASE = "https://learn.reboot01.com/git";
