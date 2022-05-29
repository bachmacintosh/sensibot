import type {
  RESTGetAPIChannelMessagesResult,
  RESTPostAPIChannelMessagesBulkDeleteJSONBody,
} from "discord-api-types/v10";
import APIVersion from "../../const/discord/ourAPIVersion";
import type { Env, } from "../../types";


export default async function deletePreviousMessages (
  messages: RESTGetAPIChannelMessagesResult,
  env: Env,
): Promise<void> {
  const headers = new Headers({
    Authorization: `Bot ${env.DISCORD_BOT_TOKEN}`,
    "Content-Type": "application/json",
  },);

  const messageIds: string[] = [];
  messages.forEach((message,) => {
    messageIds.push(message.id,);
  },);
  const payload: RESTPostAPIChannelMessagesBulkDeleteJSONBody
      = { messages: messageIds, };

  const url = `https://discord.com/api/v${APIVersion}/channels/${env.DISCORD_CHANNEL_ID}/messages/bulk-delete`;
  const init: RequestInit = {
    method: "POST",
    headers,
    body: JSON.stringify(payload,),
  };

  const response = await fetch(url, init,);
  if (response.status !== 204) {
    throw new Error(`Error deleting previous message, status: ${response.status}`,);
  }
}
