import type { Env, SensiboResponse, } from "../../types";

export default async function turnAcOff (
  env: Env,
  sensibo: SensiboResponse,
): Promise<void> {
  let body = "";
  if (sensibo.result.acState.mode === "cool"
        || sensibo.result.acState.mode === "dry") {
    body = JSON.stringify({
      acState: {
        on: true,
        mode: "fan",
        fanLevel: "auto",
      },
    },);
  } else if (sensibo.result.acState.mode === "heat") {
    body = JSON.stringify({
      acState: {
        on: false,
        mode: "heat",
        fanLevel: "auto",
      },
    },);
  }
  const url = `https://home.sensibo.com/api/v2/pods/${env.SENSIBO_DEVICE_ID}/acStates?apiKey=${env.SENSIBO_API_KEY}`;
  const headers = new Headers({ "Content-Type": "application/json", },);
  const init = {
    method: "POST",
    headers,
    body,
  };

  await fetch(url, init,);
}
