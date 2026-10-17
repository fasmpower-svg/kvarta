/// <reference types="@cloudflare/workers-types" />

interface Env {
  kvarta_db: D1Database;
  ASSETS: Fetcher;
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_CHAT_ID?: string;
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

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const INTEREST_LABELS: Record<string, string> = {
  subscription: "Подписка (2 пачки в месяц)",
  "one-time": "Разовый заказ",
  question: "Вопрос",
};

function leadMessage(data: {
  name: string;
  phone: string;
  interest: string;
  comment: string;
  utm_source: string;
  utm_campaign: string;
  utm_content: string;
  page_url: string;
}): string {
  const lines = [
    "<b>Новая заявка «Кварта»</b>",
    `Имя: ${escapeHtml(data.name)}`,
    `Телефон: ${escapeHtml(data.phone)}`,
    `Интерес: ${escapeHtml(INTEREST_LABELS[data.interest] ?? data.interest)}`,
  ];
  if (data.comment) lines.push(`Комментарий: ${escapeHtml(data.comment)}`);
  const source = [data.utm_source, data.utm_campaign, data.utm_content].filter(Boolean).join(" / ");
  lines.push(`Источник: ${source ? escapeHtml(source) : "прямой заход"}`);
  if (data.page_url) lines.push(`Страница: ${escapeHtml(data.page_url)}`);
  return lines.join("\n");
}

async function notifyTelegram(env: Env, text: string): Promise<void> {
  const token = env.TELEGRAM_BOT_TOKEN;
  const chatId = env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });
    if (!res.ok) {
      console.error("telegram notify status", res.status, await res.text());
    }
  } catch (err) {
    console.error("telegram notify failed", err);
  }
}

async function handleLead(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
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

    ctx.waitUntil(
      notifyTelegram(
        env,
        leadMessage({
          name,
          phone,
          interest,
          comment,
          utm_source: cleanText(payload.utm_source, 200),
          utm_campaign: cleanText(payload.utm_campaign, 200),
          utm_content: cleanText(payload.utm_content, 200),
          page_url: cleanText(payload.page_url, 500),
        }),
      ),
    );

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
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const { pathname } = new URL(request.url);

    if (pathname === "/api/lead") {
      if (request.method !== "POST") {
        return json({ ok: false, error: "method_not_allowed" }, 405);
      }
      return handleLead(request, env, ctx);
    }

    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
