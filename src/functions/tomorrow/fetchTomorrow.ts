import type { Env, TomorrowResponse, } from "../../types";

export default async function fetchTomorrow (
  env: Env,
): Promise<TomorrowResponse> {
  const url = `https://api.tomorrow.io/v4/timelines?location=${env.TOMORROW_LOCATION_ID}&fields=temperature,temperatureApparent&units=imperial&timesteps=current`;
  const headers = new Headers({ apiKey: env.TOMORROW_API_KEY, },);
  const init = { headers, };
  const response = await fetch(url, init,);
  const json = await response.json();
  return json as TomorrowResponse;
}
