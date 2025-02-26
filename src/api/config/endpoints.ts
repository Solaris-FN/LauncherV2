const baseUrl = "https://avalon-external-api.solarisfn.org";

export const endpoints = {
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

  // account
  GET_GENERATE_ACCOUNT_RESP: `${baseUrl}/s/api/v2/launcher/account`,
  GET_ACTIVE_CHECK: `${baseUrl}/s/api/v2/launcher/account/active`,
  POST_EDIT_DISPLAYNAME: `${baseUrl}/s/api/v2/launcher/edit/displayname`,

  // fortnite service
  GET_EXCHANGE_CODE: `https://avalon-fortnite-api.solarisfn.org/account/api/oauth/exchange`,
};
