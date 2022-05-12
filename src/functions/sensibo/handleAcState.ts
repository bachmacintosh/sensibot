import type { Env, SensiboResponse, TomorrowResponse, } from "../../types";
import postAcStatusUpdate from "../discord/postAcStatusUpdate";
import turnAcOff from "./turnAcOff";
import turnAcOn from "./turnAcOn";

const dateOptions = { timeZone: "America/New_York", };
const date = new Date().toLocaleString("en-US", dateOptions,);
const runTime = new Date(date,).getHours();

let embed = {
  updated: false,
  reason: "Embed was not set.",
  power: false,
  mode: "Cool",
  temp: 70,
};

export default async function handleAcState (
  env: Env,
  tomorrow: TomorrowResponse,
  sensibo: SensiboResponse,
): Promise<void> {
  const outdoorTemp
      = Math.floor(tomorrow.data.timelines[0].intervals[0].values.temperature,);
  const roomTemp
      = Math.floor((sensibo.result.measurements.temperature * 1.8) + 32,);

  if (sensibo.result.acState.on) {
    if (sensibo.result.acState.mode === "cool"
            || sensibo.result.acState.mode === "dry") {
      await handleAcThatIsCooling(env, sensibo, outdoorTemp, roomTemp,);
    }
    if (sensibo.result.acState.mode === "fan") {
      await handleAcThatIsFanning(env, sensibo, outdoorTemp, roomTemp,);
    }
    if (sensibo.result.acState.mode === "heat") {
      await handleAcThatIsHeating(env, sensibo, outdoorTemp, roomTemp,);
    }
  } else if (sensibo.result.acState.mode === "heat") {
    await handleAcWithHeatOff(env, sensibo, outdoorTemp, roomTemp,);
  } else {
    embed = {
      updated: false,
      reason: `No action taken, A/C is off. (Room: ${roomTemp}°F, Out: ${outdoorTemp}°F`,
      power: false,
      mode: "Cool",
      temp: 70,
    };
  }
  await postAcStatusUpdate(env, embed,);
}

async function handleAcThatIsCooling (
  env: Env,
  sensibo: SensiboResponse,
  outdoorTemp: number,
  roomTemp: number,
) {
  if (outdoorTemp < 60 && roomTemp < 75) {
    await turnAcOff(env, sensibo,);
    embed = {
      updated: true,
      reason: `Outdoor Temp ${outdoorTemp}°F < 60°F`,
      power: true,
      mode: "Fan",
      temp: 70,
    };
  } else if (runTime < 8) {
    await turnAcOff(env, sensibo,);
    embed = {
      updated: true,
      reason: "Time is after 12:00AM",
      power: true,
      mode: "Fan",
      temp: 70,
    };
  } else {
    embed = {
      updated: false,
      reason: `Outdoor Temp ${outdoorTemp}°F and/or Room Temp. ${roomTemp}°F are still warm`,
      power: true,
      mode: "Cool",
      temp: 70,
    };
  }
}

async function handleAcThatIsFanning (
  env: Env,
  sensibo: SensiboResponse,
  outdoorTemp: number,
  roomTemp: number,
) {
  if ((outdoorTemp >= 60 && outdoorTemp < 122) && roomTemp >= 75) {
    if (runTime >= 8) {
      await turnAcOn(env, "cool", 70,);
      embed = {
        updated: true,
        reason: `Outdoor Temp ${outdoorTemp}°F >= 60°F, Room Temp >= ${roomTemp}°F`,
        power: true,
        mode: "Cool",
        temp: 70,
      };
    } else {
      embed = {
        updated: false,
        reason: `Outdoor Temp ${outdoorTemp}°F >= 60°F, Room Temp >= ${roomTemp}°F, but deferring Cool Mode until 8:00AM`,
        power: true,
        mode: "Fan",
        temp: 70,
      };
    }
  }
}

async function handleAcThatIsHeating (
  env: Env,
  sensibo: SensiboResponse,
  outdoorTemp: number,
  roomTemp: number,
) {
  if (outdoorTemp < -22) {
    await turnAcOff(env, sensibo,);
    embed = {
      updated: true,
      reason: `Outdoor Temp ${outdoorTemp}°F < -22°F`,
      power: false,
      mode: "Heat",
      temp: 65,
    };
  } else if (runTime >= 22 || runTime < 8) {
    embed = {
      updated: false,
      reason: "Heat Mode will stay on between 10:00PM-8:00AM",
      power: true,
      mode: "Heat",
      temp: 65,
    };
  } else if (roomTemp >= 75) {
    await turnAcOff(env, sensibo,);
    embed = {
      updated: true,
      reason: `Room Temp ${roomTemp}°F >= 75°F`,
      power: false,
      mode: "Heat",
      temp: 65,
    };
  } else if (outdoorTemp >= 50) {
    await turnAcOff(env, sensibo,);
    embed = {
      updated: true,
      reason: `Outdoor Temp ${outdoorTemp}°F >= 50°F`,
      power: false,
      mode: "Heat",
      temp: 65,
    };
  } else {
    embed = {
      updated: false,
      reason: `Outdoor Temp ${outdoorTemp}°F and/or Room Temp. ${roomTemp}°F are still cold`,
      power: true,
      mode: "Heat",
      temp: 65,
    };
  }
}

async function handleAcWithHeatOff (
  env: Env,
  sensibo: SensiboResponse,
  outdoorTemp: number,
  roomTemp: number,
) {
  if ((runTime >= 22 || runTime < 8)
      && outdoorTemp > -22 && outdoorTemp < 35) {
    await turnAcOn(env, "heat", 65,);
    embed = {
      updated: true,
      reason: `Outdoor Temp ${outdoorTemp}°F < 35°F tonight`,
      power: true,
      mode: "Heat",
      temp: 65,
    };
  } else if (roomTemp < 70 && outdoorTemp > -22 && outdoorTemp < 35) {
    await turnAcOn(env, "heat", 65,);
    embed = {
      updated: true,
      reason: `Outdoor Temp ${outdoorTemp}°F <= 35°F`,
      power: true,
      mode: "Heat",
      temp: 65,
    };
  } else if (roomTemp < 65 && outdoorTemp > -22 && outdoorTemp < 86) {
    await turnAcOn(env, "heat", 65,);
    embed = {
      updated: true,
      reason: `Room Temp ${roomTemp}°F <= 65°F`,
      power: true,
      mode: "Heat",
      temp: 65,
    };
  } else {
    embed = {
      updated: false,
      reason: `Outdoor Temp ${outdoorTemp}°F and/or Room Temp. ${roomTemp}°F are still warm`,
      power: true,
      mode: "Heat",
      temp: 65,
    };
  }
}
