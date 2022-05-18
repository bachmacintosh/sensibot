import type { Context, } from "toucan-js/dist/types";
import type { Env, } from "./types";

import Toucan from "toucan-js";
import fetchSensibo from "./functions/sensibo/fetchSensibo";
import fetchTomorrow from "./functions/tomorrow/fetchTomorrow";
import handleAcState from "./functions/sensibo/handleAcState";
import handleInteraction from "./functions/discord/handleInteraction";

export default {
  async fetch (
    request: Request, env: Env, context: Context,
  ): Promise<Response> {
    const sentry = new Toucan({
      dsn: "https://25641ba90b33429baa4c313eaa8d57d5@o79685.ingest.sentry.io/6397906",
      context,
      request,
      allowedHeaders: ["user-agent",],
      allowedSearchParams: /(.*)/u,
    },);
    try {
      const response = await handleInteraction(request, env,);
      return response;
    } catch (err) {
      sentry.captureException(err,);
      console.error(err,);
      return new Response(`Something went wrong`, { status: 500, },);
    }
  },
  scheduled (
    event: ScheduledEvent,
    env: Env,
    context: Context,
  ): void {
    const sentry = new Toucan({
      dsn: "https://25641ba90b33429baa4c313eaa8d57d5@o79685.ingest.sentry.io/6397906",
      context,
    },);
    try {
      context.waitUntil(handle(env,),);
    } catch (err) {
      sentry.captureException(err,);
    }
  },
};

async function handle (env: Env,) {
  const tomorrow = await fetchTomorrow(env,);
  const sensibo = await fetchSensibo(env,);
  await handleAcState(env, tomorrow, sensibo,);
}
