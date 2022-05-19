import * as nacl from "tweetnacl";
import type {
  APIInteraction,
  APIInteractionResponsePong,
} from "discord-api-types/v10";
import {
  InteractionResponseType,
  InteractionType,
} from "discord-api-types/v10";
import type { Env, } from "../../types";

export default async function handleInteraction (
  request: Request,
  env: Env,
): Promise<Response> {
  if (request.method === "POST") {
    const signature = request.headers.get("X-Signature-Ed25519",);
    const timestamp = request.headers.get("X-Signature-Timestamp",);

    if (signature === null || timestamp === null) {
      return new Response("Unauthorized, nice try.", { status: 401, },);
    }

    const rawBody = await request.text();
    const encoder = new TextEncoder();

    const authorized = nacl.sign.detached.verify(
      encoder.encode(timestamp + rawBody,),
      encoder.encode(signature,),
      encoder.encode(env.DISCORD_PUBLIC_KEY,),
    );

    if (!authorized) {
      return new Response("Unauthorized, nice try.", { status: 401, },);
    }

    const json = await request.json();
    const interaction = json as APIInteraction;

    if (interaction.type === InteractionType.Ping) {
      const pong: APIInteractionResponsePong
          = { type: InteractionResponseType.Pong, };
      return new Response(JSON.stringify(pong,), { status: 200, },);
    } else {
      return new Response("Interaction is not known.", { status: 404, },);
    }
  } else {
    return new Response("This method is not allowed.", { status: 400, },);
  }
}
