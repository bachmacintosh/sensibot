import type { Env, SensiboResponse, } from "../../types";

export default async function fetchSensibo (
  env: Env,
): Promise<SensiboResponse> {
  const url = `https://home.sensibo.com/api/v2/pods/${env.SENSIBO_DEVICE_ID}?apiKey=${env.SENSIBO_API_KEY}&fields=acState,measurements`;
  const response = await fetch(url,);
  if (!response.ok) {
    const text = await response.text();
    console.error(text,);
    throw new Error(`Error Fetching Sensibo at ${url}`,);
  }
  const json = await response.json();
  return json as SensiboResponse;
}
