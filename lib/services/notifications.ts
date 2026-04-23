import { randomUUID } from "crypto";

import { getSupabaseServiceClient } from "@/lib/supabase/admin";

type NotificationChannel = "whatsapp" | "sms" | "email";

type SendNotificationInput = {
  clientId?: string;
  projectId?: string;
  to: string;
  channel: NotificationChannel;
  message: string;
};

type NotificationProvider = {
  send: (input: SendNotificationInput) => Promise<{ ok: boolean; externalId?: string; reason?: string }>;
};

function isEnabled(value: string | undefined) {
  return value === "true";
}

function getEnv(...keys: string[]) {
  for (const key of keys) {
    const value = process.env[key];
    if (value && value.trim().length > 0) {
      return value;
    }
  }

  return undefined;
}

function formatRecipient(channel: NotificationChannel, recipient: string) {
  if (channel !== "whatsapp") {
    return recipient;
  }

  return recipient.startsWith("whatsapp:") ? recipient : `whatsapp:${recipient}`;
}

const mockProvider: NotificationProvider = {
  async send(input) {
    console.info("[MockNotification]", input.channel, input.to, input.message);
    return {
      ok: true,
      externalId: `mock-${randomUUID()}`,
    };
  },
};

function makeTwilioProvider(channel: "whatsapp" | "sms"): NotificationProvider | null {
  const accountSid = getEnv(
    channel === "whatsapp" ? "WHATSAPP_TWILIO_ACCOUNT_SID" : "SMS_TWILIO_ACCOUNT_SID",
    "TWILIO_ACCOUNT_SID",
  );
  const authToken = getEnv(
    channel === "whatsapp" ? "WHATSAPP_TWILIO_AUTH_TOKEN" : "SMS_TWILIO_AUTH_TOKEN",
    "TWILIO_AUTH_TOKEN",
  );
  const sender = getEnv(channel === "whatsapp" ? "WHATSAPP_PROVIDER_SENDER" : "SMS_PROVIDER_SENDER");

  if (!accountSid || !authToken || !sender) {
    return null;
  }

  const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const credentials = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

  return {
    async send(input) {
      const payload = new URLSearchParams({
        To: formatRecipient(channel, input.to),
        From: formatRecipient(channel, sender),
        Body: input.message,
      });

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: payload.toString(),
      });

      const body = (await response.json().catch(() => null)) as { sid?: string; message?: string } | null;

      if (!response.ok) {
        return {
          ok: false,
          reason: body?.message ?? `Twilio error (${response.status})`,
        };
      }

      return {
        ok: true,
        externalId: body?.sid ?? `twilio-${randomUUID()}`,
      };
    },
  };
}

function makeResendProvider(): NotificationProvider | null {
  const apiKey = getEnv("RESEND_API_KEY", "EMAIL_PROVIDER_API_KEY");
  const sender = getEnv("RESEND_FROM_EMAIL", "EMAIL_PROVIDER_SENDER");

  if (!apiKey || !sender) {
    return null;
  }

  return {
    async send(input) {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: sender,
          to: [input.to],
          subject: "Ultra Frame Notification",
          text: input.message,
        }),
      });

      const body = (await response.json().catch(() => null)) as { id?: string; message?: string } | null;

      if (!response.ok) {
        return {
          ok: false,
          reason: body?.message ?? `Resend error (${response.status})`,
        };
      }

      return {
        ok: true,
        externalId: body?.id ?? `email-${randomUUID()}`,
      };
    },
  };
}

function getProvider(channel: NotificationChannel): NotificationProvider {
  const flag = getEnv(
    channel === "whatsapp"
      ? "NOTIFY_WHATSAPP_ENABLED"
      : channel === "sms"
        ? "NOTIFY_SMS_ENABLED"
        : "NOTIFY_EMAIL_ENABLED",
  );

  if (!isEnabled(flag)) {
    return mockProvider;
  }

  if (channel === "whatsapp") {
    return makeTwilioProvider("whatsapp") ?? mockProvider;
  }

  if (channel === "sms") {
    return makeTwilioProvider("sms") ?? mockProvider;
  }

  return makeResendProvider() ?? mockProvider;
}

export async function sendNotification(input: SendNotificationInput) {
  const provider = getProvider(input.channel);
  const result = await provider.send(input);

  const supabase = getSupabaseServiceClient();
  if (supabase) {
    await supabase.from("notifications_log").insert({
      project_id: input.projectId ?? null,
      client_id: input.clientId ?? null,
      channel: input.channel,
      message_body: input.message,
      sent_status: result.ok ? "sent" : "failed",
    });
  }

  if (!result.ok) {
    console.error(`[Notification:${input.channel}]`, result.reason ?? "failed");
  }

  return result;
}


