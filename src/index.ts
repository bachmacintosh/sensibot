import type { Context, } from "toucan-js/dist/types";
import type { Env, } from "./types";

import Toucan from "toucan-js";
import fetchSensibo from "./functions/sensibo/fetchSensibo";
import fetchTomorrow from "./functions/tomorrow/fetchTomorrow";
import handleAcState from "./functions/sensibo/handleAcState";

export default {
  fetch (
    request: Request, env: Env, context: Context,
  ): Response {
    const sentry = new Toucan({
      dsn: "https://25641ba90b33429baa4c313eaa8d57d5@o79685.ingest.sentry.io/6397906",
      context,
      request,
      allowedHeaders: ["user-agent",],
      allowedSearchParams: /(.*)/u,
    },);
    try {
      const url = new URL(request.url,);
      if (url.pathname === "/") {
        return new Response("Hello at root",);
      } else {
        return new Response("Hello Else",);
      }
    } catch (err) {
      sentry.captureException(err,);
      console.error(err,);
      return new Response(`Something went wrong`, { status: 500, },);
    }
  },
  async scheduled (
    event: ScheduledEvent,
    env: Env,
    context: Context,
  ): Promise<void> {
    const sentry = new Toucan({
      dsn: "dsn...",
      context,
    },);
    try {
      await handle(env,);
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
