import {RESTPostAPIChannelMessageJSONBody} from "discord-api-types/v10";

type Env = {
  DISCORD_BOT_TOKEN: string;
  DISCORD_CHANNEL_ID: string;
  SENSIBO_API_KEY: string;
  SENSIBO_DEVICE_ID: string;
  TOMORROW_LOCATION_ID: string;
  TOMORROW_API_KEY: string;
};
type Interval = {
  startTime: string;
  values: {
    temperature: number;
    temperatureApparent: number;
  };
};

type Timeline = {
  timestep: string;
  startTime: string;
  endTime: string;
  intervals: Interval[];
};

type TomorrowResponse = {
  data: {
    timelines: Timeline[];
  }
};

type SensiboResponse = {
  status: string;
  result: {
    acState: {
      timestamp: {
        time: string;
        secondsAgo: number;
      };
      on: boolean;
      mode: "cool" | "heat" | "dry" | "fan" | "auto";
      fanLevel: "quiet" | "low" | "medium" | "high" | "auto" | "string";
      swing: "stopped" | "rangeFull";
      light: "on" | "off";
    };
    measurements: {
      time: {
        time: string;
        secondsAgo: number;
      };
      temperature: number;
      humidity: number;
      feelsLike: number;
      rssi: number;
    };
  };
};

export default {
  fetch(request: Request, env: Env, context: ExecutionContext) {
    return new Response("Hello");
  },
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(handleScheduled(event, env));
  },
};

async function handleScheduled(event: ScheduledEvent, env: Env) {
  const tomorrow = await fetchTomorrow(env);
  const sensibo = await fetchSensibo(env);
  console.log("Temps");
  console.log(JSON.stringify(tomorrow, null, 2));
  console.log("Sensibo");
  console.log(JSON.stringify(sensibo, null, 2));
  await handleAcState(env, event, tomorrow, sensibo);
}

async function fetchTomorrow(env: Env) {
  const url = `https://api.tomorrow.io/v4/timelines?location=${env.TOMORROW_LOCATION_ID}&fields=temperature,temperatureApparent&units=imperial&timesteps=current`;
  const headers = new Headers({
    apiKey: TOMORROW_API_KEY
  });
  const init = {
    headers,
  };
  const response = await fetch(url, init);
  return await response.json() as TomorrowResponse;
}

async function fetchSensibo(env: Env) {
  const url = `https://home.sensibo.com/api/v2/pods/${env.SENSIBO_DEVICE_ID}?apiKey=${env.SENSIBO_API_KEY}&fields=acState,measurements`;
  const response = await fetch(url);
  return await response.json() as SensiboResponse;
}

async function handleAcState(env: Env, event: ScheduledEvent, tomorrow: TomorrowResponse, sensibo: SensiboResponse) {
  const dateOptions = {timeZone: "America/New_York"};
  const date = new Date().toLocaleString("en-US", dateOptions);
  const runTime = new Date(date).getHours();
  const outdoorTemp = Math.floor(tomorrow.data.timelines[0].intervals[0].values.temperature);
  const roomTemp = Math.floor((sensibo.result.measurements.temperature * 1.8) + 32);

  if (sensibo.result.acState.on) {
    if (sensibo.result.acState.mode === "cool" || sensibo.result.acState.mode === "dry") {
      if (outdoorTemp < 60 && roomTemp < 75) {
        await turnAcOff(env, sensibo);
        await sendToDiscord(env, true, `Outdoor Temp ${outdoorTemp}°F < 60°F`, true, "Fan", 70);
      } else if (runTime < 8) {
        await turnAcOff(env, sensibo);
        await sendToDiscord(env, true, "Time is after 12:00AM", true, "Fan", 70);
      } else {
        await sendToDiscord(env, false, `Outdoor Temp ${outdoorTemp}°F and/or Room Temp. ${roomTemp}°F are still warm`, true, "Fan", 70);
      }
    }
    if (sensibo.result.acState.mode === "fan") {
      if ((outdoorTemp >= 60 && outdoorTemp < 122) && roomTemp >= 75) {
        if (runTime >= 8) {
          await turnAcOn(env, "cool", 70);
          await sendToDiscord(env, true, `Outdoor Temp ${outdoorTemp}°F >= 60°F, Room Temp >= ${roomTemp}°F`, true, "Cool", 70);
        } else {
          await sendToDiscord(env, false, `Outdoor Temp ${outdoorTemp}°F >= 60°F, Room Temp >= ${roomTemp}°F, but deferring Cool Mode until 8:00AM`, true, "Cool", 70);
        }
      }
    }
    if (sensibo.result.acState.mode === "heat") {
      if (outdoorTemp < -22) {
        await turnAcOff(env, sensibo);
        await sendToDiscord(env, true, `Outdoor Temp ${outdoorTemp}°F < -22°F`, false, "Heat", 65);
      } else if (runTime >= 22 || runTime < 8) {
        await sendToDiscord(env, false, "Heat Mode will stay on between 10:00PM-8:00AM", true, "Heat", 65);
      } else if (roomTemp >= 75) {
        await turnAcOff(env, sensibo);
        await sendToDiscord(env, true, `Room Temp ${roomTemp}°F >= 75°F`, false, "Heat", 65);
      } else if (outdoorTemp >= 50) {
        await turnAcOff(env, sensibo);
        await sendToDiscord(env, true, `Outdoor Temp ${outdoorTemp}°F >= 50°F`, false, "Heat", 65);
      } else {
        await sendToDiscord(env, false, `Outdoor Temp ${outdoorTemp}°F and/or Room Temp. ${roomTemp}°F are still cold`, true, "Heat", 65);
      }
    }
  } else if (!sensibo.result.acState.on && sensibo.result.acState.mode === "heat") {
    if ((runTime >= 22 || runTime < 8) && outdoorTemp > -22 && outdoorTemp < 35) {
      await turnAcOn(env, "heat", 65);
      await sendToDiscord(env, true, `Outdoor Temp ${outdoorTemp}°F < 35°F tonight`, true, "Heat", 65);
    } else if (roomTemp < 70 && outdoorTemp > -22 && outdoorTemp < 35) {
      await turnAcOn(env, "heat", 65);
      await sendToDiscord(env, true, `Outdoor Temp ${outdoorTemp}°F <= 35°F`, true, "Heat", 65);
    } else if (roomTemp < 65 && outdoorTemp > -22 && outdoorTemp < 86) {
      await turnAcOn(env, "heat", 65);
      await sendToDiscord(env, true, `Room Temp ${roomTemp}°F <= 65°F`, true, "Heat", 65);
    } else {
      await sendToDiscord(env, false, `Outdoor Temp ${outdoorTemp}°F and/or Room Temp. ${roomTemp}°F are still warm`, true, "Heat", 65);
    }
  } else {
    await sendToDiscord(env, false, "A/C is off, no action taken", false, "Cool", 70);
  }
}

async function turnAcOn(env: Env, mode: string, temp: number) {
  const url = `https://home.sensibo.com/api/v2/pods/${env.SENSIBO_DEVICE_ID}/acStates?apiKey=${env.SENSIBO_API_KEY}`;
  const headers = new Headers({"Content-Type": "application/json"});
  const body = JSON.stringify({
    acState: {
      on: true,
      mode,
      fanLevel: "auto",
      targetTemperature: temp,
      temperatureUnit: "F"
    }
  });
  const init = {
    method: "POST",
    headers,
    body
  }

  await fetch(url, init);
}

async function turnAcOff(env: Env, sensibo: SensiboResponse) {
  let body;
  if (sensibo.result.acState.mode === "cool" || sensibo.result.acState.mode === "dry") {
    body = JSON.stringify({
      acState: {
        on: true,
        mode: "fan",
        fanLevel: "auto"
      }
    });
  } else if (sensibo.result.acState.mode === "heat") {
    body = JSON.stringify({
      acState: {
        on: false,
        mode: "heat",
        fanLevel: "auto",
      }
    });
  }
  const url = `https://home.sensibo.com/api/v2/pods/${env.SENSIBO_DEVICE_ID}/acStates?apiKey=${env.SENSIBO_API_KEY}`;
  const headers = new Headers({"Content-Type": "application/json"});
  const init = {
    method: "POST",
    headers,
    body
  }

  await fetch(url, init);
}

async function sendToDiscord(env: Env, updated: boolean, reason: string, power: boolean, mode: string, temp: number) {
  const url = `https://discord.com/api/v9/channels/${DISCORD_CHANNEL_ID}/messages`;
  const headers = new Headers({
    Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
    "Content-Type": "application/json"
  });
  const fields = [];
  if (!updated) {
    fields.push({
      name: "Reason",
      value: reason,
      inline: true
    });
  } else {
    fields.push({
      name: "Power",
      value: power ? "On" : "Off",
      inline: true
    });
    if (power) {
      fields.push({
        name: "Mode",
        value: mode,
        inline: true
      });
      if (mode !== "Fan") {
        fields.push({
          name: "Temp",
          value: `${temp}°F`,
          inline: true
        });
      }
    }
    fields.push({
      name: "Reason",
      value: reason,
      inline: true
    });
  }
  const payload: RESTPostAPIChannelMessageJSONBody = {
    embeds: [{
      title: updated ? "A/C State Updated" : "A/C State Not Updated",
      description: updated ? "The state of the A/C was changed to the following settings:" : "The A/C State was not updated for the following reason:",
      color: 3195298,
      fields,
    }]
  };

  const init = {
    method: "POST",
    headers,
    body: JSON.stringify(payload)
  }
  console.log("Posting to Discord...");
  console.log(payload);
  const response = await fetch(url, init);
  const text = await response.text();
  console.log(text);
}
