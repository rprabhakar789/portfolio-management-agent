import type { NotificationSummary } from "../types.js";

export async function sendEmailNotificationHook(
  webhookUrl: string | undefined,
  summary: NotificationSummary,
) {
  if (!webhookUrl) {
    return;
  }

  const response = await fetch(webhookUrl, {
    body: JSON.stringify(summary),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(
      `Email notification hook failed with status ${response.status}.`,
    );
  }
}
