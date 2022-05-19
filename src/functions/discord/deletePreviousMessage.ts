import APIVersion from "../../const/discord/ourAPIVersion";
import type { Env, } from "../../types";

export default async function deletePreviousMessage (
  id: string,
  env: Env,
): Promise<void> {
  const headers = new Headers({
    Authorization: `Bot ${env.DISCORD_BOT_TOKEN}`,
    "Content-Type": "application/json",
  },);

  const url = `https://discord.com/api/v${APIVersion}/channels/${env.DISCORD_CHANNEL_ID}/messages/${id}`;
  const init: RequestInit = {
    method: "DELETE",
    headers,
  };
  const response = await fetch(url, init,);
  if (response.status !== 204) {
    throw new Error(`Error deleting previous message, status: ${response.status}`,);
  }
}
