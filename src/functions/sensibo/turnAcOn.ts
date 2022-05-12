import type { Env, } from "../../types";

export default async function turnAcOn (
  env: Env,
  mode: "auto" | "cool" | "dry" | "fan" | "heat",
  temp: number,
): Promise<void> {
  const url = `https://home.sensibo.com/api/v2/pods/${env.SENSIBO_DEVICE_ID}/acStates?apiKey=${env.SENSIBO_API_KEY}`;
  const headers = new Headers({ "Content-Type": "application/json", },);
  const body = JSON.stringify({
    acState: {
      on: true,
      mode,
      fanLevel: "auto",
      targetTemperature: temp,
      temperatureUnit: "F",
    },
  },);
  const init = {
    method: "POST",
    headers,
    body,
  };

  await fetch(url, init,);
}
