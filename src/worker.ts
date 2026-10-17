/// <reference types="@cloudflare/workers-types" />

interface Env {
  kvarta_db: D1Database;
  ASSETS: Fetcher;
}

const DEDUP_WINDOW_MS = 10 * 60 * 1000;
const BY_OPERATOR_CODES = new Set(["25", "29", "33", "44"]);
const INTERESTS = new Set(["subscription", "one-time", "question"]);

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function normalizePhone(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const digits = raw.replace(/\D/g, "");

  let local: string;
  if (digits.startsWith("375")) local = digits.slice(3);
  else if (digits.startsWith("80")) local = digits.slice(2);
  else if (digits.length === 9) local = digits;
  else return null;

  if (local.length !== 9) return null;
  if (!BY_OPERATOR_CODES.has(local.slice(0, 2))) return null;

  return "+375" + local;
}

function cleanText(raw: unknown, maxLen: number): string {
  if (typeof raw !== "string") return "";
  return raw.trim().slice(0, maxLen);
}

async function handleLead(request: Request, env: Env): Promise<Response> {
  let payload: Record<string, unknown>;
  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ ok: false, error: "bad_json", message: "Некорректный запрос." }, 400);
  }

  const name = cleanText(payload.name, 120);
  const phone = normalizePhone(payload.phone);
  const interest = cleanText(payload.interest, 32);
  const comment = cleanText(payload.comment, 2000);

  if (name.length < 2) {
    return json(
      { ok: false, error: "validation", field: "name", message: "Укажите имя." },
      400,
    );
  }
  if (!phone) {
    return json(
      {
        ok: false,
        error: "validation",
        field: "phone",
        message: "Проверьте номер: нужен белорусский мобильный (+375 25 / 29 / 33 / 44).",
      },
      400,
    );
  }
  if (!INTERESTS.has(interest)) {
    return json(
      { ok: false, error: "validation", field: "interest", message: "Выберите, что вас интересует." },
      400,
    );
  }

  const now = Date.now();

  try {
    const last = await env.kvarta_db
      .prepare("SELECT created_at_ms FROM leads WHERE phone = ?1 ORDER BY created_at_ms DESC LIMIT 1")
      .bind(phone)
      .first<{ created_at_ms: number }>();

    if (last && now - last.created_at_ms < DEDUP_WINDOW_MS) {
      return json({ ok: true, duplicate: true });
    }

    await env.kvarta_db
      .prepare(
        `INSERT INTO leads
          (name, phone, interest, comment, utm_source, utm_medium, utm_campaign,
           utm_content, utm_term, click_id, referrer, page_url, user_agent, created_at_ms)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14)`,
      )
      .bind(
        name,
        phone,
        interest,
        comment || null,
        cleanText(payload.utm_source, 200) || null,
        cleanText(payload.utm_medium, 200) || null,
        cleanText(payload.utm_campaign, 200) || null,
        cleanText(payload.utm_content, 200) || null,
        cleanText(payload.utm_term, 200) || null,
        cleanText(payload.click_id, 200) || null,
        cleanText(payload.referrer, 500) || null,
        cleanText(payload.page_url, 500) || null,
        cleanText(request.headers.get("user-agent") ?? "", 500) || null,
        now,
      )
      .run();

    return json({ ok: true });
  } catch (err) {
    console.error("lead insert failed", err);
    return json(
      { ok: false, error: "server", message: "Не удалось сохранить заявку. Попробуйте позже." },
      500,
    );
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);

    if (pathname === "/api/lead") {
      if (request.method !== "POST") {
        return json({ ok: false, error: "method_not_allowed" }, 405);
      }
      return handleLead(request, env);
    }

    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
