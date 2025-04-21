const baseUrl =
  process.env.NODE_ENV === "development"
    ? "http://localhost:80"
    : "https://api-v1-horizon-external-api.solarisfn.org";

export const endpoints = {
  GET_BASE_URL: baseUrl,
  // login
  GET_DISCORD_URI: `${baseUrl}/s/api/oauth/discord`,

  // normal
  GET_LAUNCHER: `${baseUrl}/s/api/v2/launcher`,
  GET_LAUNCHER_TRAILER: `${baseUrl}/s/api/v2/launcher/trailer`,
  GET_LAUNCHER_FILES: `${baseUrl}/s/api/v2/launcher/files`,
  GET_LAUNCHER_NEWS: `${baseUrl}/s/api/v2/launcher/news`,
  GET_LAUNCHER_SERVERS: `${baseUrl}/s/api/v2/launcher/servers`,
  GET_LAUNCHER_POSTS: `${baseUrl}/s/api/v2/launcher/posts`,
  GET_LAUNCHER_SHOP: `${baseUrl}/s/api/v2/launcher/shop`,
  GET_LAUNCHER_LEADERBOARD: `${baseUrl}/s/api/v2/launcher/leaderboard`,

  // account
  GET_GENERATE_ACCOUNT_RESP: `${baseUrl}/s/api/v2/launcher/account`,
  GET_ACTIVE_CHECK: `${baseUrl}/s/api/v2/launcher/account/active`,
  POST_EDIT_DISPLAYNAME: `${baseUrl}/s/api/v2/launcher/account/edit/display`,
  GET_ACCOUNT_STATISTICS_RESP: `${baseUrl}/s/api/v2/launcher/account/statistics`,

  // fortnite service
  GET_EXCHANGE_CODE: `${baseUrl}/account/api/oauth/exchange`,
};
