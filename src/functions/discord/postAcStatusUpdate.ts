import type {
  AcUpdateEmbed,
  Env,
} from "../../types";
import APIVersion from "../../const/discord/ourAPIVersion";
import type { RESTPostAPIChannelMessageJSONBody, } from "discord-api-types/v10";

export default async function postAcStatusUpdate (
  env: Env,
  embed: AcUpdateEmbed,): Promise<void> {
  const url = `https://discord.com/api/v${APIVersion}/channels/${env.DISCORD_CHANNEL_ID}/messages`;
  const headers = new Headers({
    Authorization: `Bot ${env.DISCORD_BOT_TOKEN}`,
    "Content-Type": "application/json",
  },);
  const fields = [];
  if (embed.updated) {
    fields.push({
      name: "Power",
      value: embed.power ? "On" : "Off",
      inline: true,
    },);
    if (embed.power) {
      fields.push({
        name: "Mode",
        value: embed.mode,
        inline: true,
      },);
      if (embed.mode !== "Fan") {
        fields.push({
          name: "Temp",
          value: `${embed.temp}°F`,
          inline: true,
        },);
      }
    }
    fields.push({
      name: "Reason",
      value: embed.reason,
      inline: true,
    },);
  } else {
    fields.push({
      name: "Reason",
      value: embed.reason,
      inline: true,
    },);
  }
  const payload: RESTPostAPIChannelMessageJSONBody = {
    embeds: [
      {
        title: embed.updated ? "A/C State Updated" : "A/C State Not Updated",
        description: embed.updated ? `The state of the A/C was changed to the following settings:` : `The A/C State was not updated for the following reason:`,
        color: 3195298,
        fields,
      },
    ],
  };

  const init = {
    method: "POST",
    headers,
    body: JSON.stringify(payload,),
  };
  await fetch(url, init,);
}
