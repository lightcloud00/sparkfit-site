interface Env {
  LEADS?: KVNamespace;
  RESEND_API_KEY?: string;
}

/** Escape HTML so user input can't inject markup into the notification email. */
const escHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

type LeadPayload = Record<string, unknown>;

const JSON_HEADERS: HeadersInit = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Allow": "POST, OPTIONS",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

function clean(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

async function readPayload(request: Request): Promise<LeadPayload> {
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return (await request.json()) as LeadPayload;
  }
  const form = await request.formData();
  return Object.fromEntries(form.entries()) as LeadPayload;
}

async function handleLead(request: Request, env: Env): Promise<Response> {
  if (!env.LEADS) {
    return json({ error: "Lead storage unavailable" }, 503);
  }

  let payload: LeadPayload;
  try {
    payload = await readPayload(request);
  } catch {
    return json({ error: "Invalid request body" }, 400);
  }

  const email = clean(payload.email, 254).toLowerCase();
  if (!EMAIL_RE.test(email)) {
    return json({ error: "Invalid email" }, 400);
  }

  const formId = clean(payload.formId, 80) || "unknown-form";
  const source = clean(payload.source, 120) || `sparkfit.app-${formId}`;
  const createdAt = new Date().toISOString();
  const key = `sparkfit/${formId}/${createdAt.slice(0, 10)}/${crypto.randomUUID()}`;

  const name = clean(payload.name, 100) || null;
  await env.LEADS.put(
    key,
    JSON.stringify({
      site: "sparkfit.app",
      app: "SPARK Fitness Connection",
      type: "lead",
      form_id: formId,
      email,
      name,
      firm: clean(payload.firm, 160) || null,
      subject: clean(payload.subject, 160) || null,
      source,
      created_at: createdAt,
      ua: request.headers.get("user-agent") || null,
    }),
  );

  // Notify Gus's inbox of the new lead (mirrors the working gusdigitalsolutions
  // contact.ts Resend pattern). Non-fatal: the KV capture above already
  // succeeded, so an email hiccup never loses a lead.
  if (env.RESEND_API_KEY) {
    try {
      const safeEmail = escHtml(email);
      const resendResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "SparkFit Leads <onboarding@resend.dev>",
          to: ["lightcloud007@gmail.com"],
          subject: `New SparkFit lead: ${safeEmail}`,
          html: `
            <h2>New SparkFit website lead</h2>
            <p><strong>Email:</strong> ${safeEmail}</p>
            <p><strong>Name:</strong> ${name ? escHtml(name) : "(not given)"}</p>
            <p><strong>Form:</strong> ${escHtml(formId)}</p>
            <p><strong>Source:</strong> ${escHtml(source)}</p>
            <p><strong>When:</strong> ${createdAt}</p>
          `,
          reply_to: email,
        }),
      });
      if (!resendResponse.ok) {
        console.error("[lead] resend error", await resendResponse.text());
      }
    } catch (mailErr) {
      console.error("[lead] resend exception", mailErr);
    }
  }

  return json({ success: true, key });
}

export const onRequestOptions: PagesFunction<Env> = () =>
  new Response(null, { status: 204, headers: JSON_HEADERS });

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) =>
  handleLead(request, env);

export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  const method = request.method.toUpperCase();
  if (method === "OPTIONS") {
    return new Response(null, { status: 204, headers: JSON_HEADERS });
  }
  if (method === "POST") {
    return handleLead(request, env);
  }
  return json({ error: "Method not allowed", allow: ["POST", "OPTIONS"] }, 405);
};
