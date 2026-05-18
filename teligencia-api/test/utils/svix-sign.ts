/*
 * Tiny helper that signs a webhook body with the CLERK_WEBHOOK_SIGNING_SECRET
 * so test specs can POST verified payloads to /webhooks/clerk.
 */

import { Webhook } from 'svix';
import { randomUUID } from 'crypto';

export interface SignedDelivery {
  svixId: string;
  svixTimestamp: string;
  svixSignature: string;
  rawBody: string;
}

export function signDelivery(payload: unknown): SignedDelivery {
  const secret = process.env.CLERK_WEBHOOK_SIGNING_SECRET;
  if (!secret) throw new Error('CLERK_WEBHOOK_SIGNING_SECRET required');
  const wh = new Webhook(secret);
  const svixId = `msg_test_${randomUUID()}`;
  const svixTimestamp = Math.floor(Date.now() / 1000).toString();
  const rawBody = JSON.stringify(payload);
  const svixSignature = wh.sign(
    svixId,
    new Date(Number(svixTimestamp) * 1000),
    rawBody,
  );
  return { svixId, svixTimestamp, svixSignature, rawBody };
}
