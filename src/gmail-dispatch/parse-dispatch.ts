import { randomUUID } from "node:crypto";

import { z } from "zod";

import { assertAllowedContentPaths } from "../policy/allowed-paths.js";
import type { NormalizedDispatchRequest } from "../types.js";

const labelSchema = z.string().trim().min(1);

const envelopeSchema = z.object({
  action: z.string().trim().min(1).optional(),
  client_payload: z
    .object({
      body: z.string().optional(),
      email: z
        .object({
          body: z.string().optional(),
          from: z
            .union([
              z.string().email(),
              z.object({
                email: z.string().email(),
                name: z.string().trim().min(1).optional(),
              }),
            ])
            .optional(),
          labels: z.array(labelSchema).optional(),
          message_id: z.string().trim().min(1).optional(),
          received_at: z.string().trim().min(1).optional(),
          subject: z.string().optional(),
        })
        .optional(),
      labels: z.array(labelSchema).optional(),
      message_id: z.string().trim().min(1).optional(),
      received_at: z.string().trim().min(1).optional(),
      requested_paths: z.array(z.string()).optional(),
      sender_email: z.string().email().optional(),
      sender_name: z.string().trim().min(1).optional(),
      source: z.string().trim().min(1).optional(),
      subject: z.string().optional(),
      target_repo: z.string().trim().min(1).optional(),
    })
    .default({}),
});

interface ParseDispatchOptions {
  defaultTargetRepo: string;
}

export function parseRepositoryDispatch(
  payload: unknown,
  options: ParseDispatchOptions,
): NormalizedDispatchRequest {
  const parsedEnvelope = envelopeSchema.parse(payload);
  const clientPayload = parsedEnvelope.client_payload;
  const emailPayload = clientPayload.email;
  const sender = (() => {
    if (typeof emailPayload?.from === "string") {
      return { email: emailPayload.from };
    }

    if (emailPayload?.from) {
      return emailPayload.from.name
        ? { email: emailPayload.from.email, name: emailPayload.from.name }
        : { email: emailPayload.from.email };
    }

    if (clientPayload.sender_email) {
      return clientPayload.sender_name
        ? {
            email: clientPayload.sender_email,
            name: clientPayload.sender_name,
          }
        : {
            email: clientPayload.sender_email,
          };
    }

    return undefined;
  })();

  if (!sender) {
    throw new Error("repository_dispatch payload is missing the sender email.");
  }

  const labels = [...(emailPayload?.labels ?? []), ...(clientPayload.labels ?? [])];
  const normalizedLabels = Array.from(new Set(labels.map((label) => label.toLowerCase())));

  if (!normalizedLabels.includes("portfolio-agent")) {
    throw new Error(
      "repository_dispatch payload must include the Gmail label portfolio-agent.",
    );
  }

  const body = emailPayload?.body ?? clientPayload.body;
  if (!body || body.trim().length === 0) {
    throw new Error("repository_dispatch payload is missing the email body.");
  }

  const subject = (emailPayload?.subject ?? clientPayload.subject ?? "").trim();
  const requestedPaths = clientPayload.requested_paths
    ? assertAllowedContentPaths(
        clientPayload.requested_paths,
        "Requested payload paths",
      )
    : [];

  const request: NormalizedDispatchRequest = {
    body: body.trim(),
    eventType: parsedEnvelope.action ?? "repository_dispatch",
    labels: normalizedLabels,
    requestId:
      emailPayload?.message_id ?? clientPayload.message_id ?? randomUUID(),
    requestedPaths,
    sender,
    source: "gmail",
    subject,
    targetRepo: clientPayload.target_repo ?? options.defaultTargetRepo,
  };

  const receivedAt = emailPayload?.received_at ?? clientPayload.received_at;
  if (receivedAt) {
    request.receivedAt = receivedAt;
  }

  return request;
}
