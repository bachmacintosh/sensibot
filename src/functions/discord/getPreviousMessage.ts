import APIVersion from "../../const/discord/ourAPIVersion";
import type { Env, } from "../../types";
import type { RESTGetAPIChannelMessagesResult, } from "discord-api-types/v10";

export default async function getPreviousMessage (
  env: Env,
): Promise<string | null> {
  const headers = new Headers({
    Authorization: `Bot ${env.DISCORD_BOT_TOKEN}`,
    "Content-Type": "application/json",
  },);

  const url = `https://discord.com/api/v${APIVersion}/channels/${env.DISCORD_CHANNEL_ID}/messages?limit=1`;
  const init: RequestInit = {
    method: "GET",
    headers,
  };

  const response = await fetch(url, init,);
  const json = await response.json();
  const messages = json as RESTGetAPIChannelMessagesResult;
  if (messages.length === 0) {
    return null;
  } else {
    return messages[0].id;
  }
}
