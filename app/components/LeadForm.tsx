"use client";

import { useState, type FormEvent } from "react";

const OPERATOR_CODES = ["25", "29", "33", "44"];

type Status = "idle" | "submitting" | "success" | "duplicate" | "error";

type LeadResponse = {
  ok?: boolean;
  duplicate?: boolean;
  field?: string;
  message?: string;
};

export default function LeadForm() {
  const [name, setName] = useState("");
  const [local, setLocal] = useState("");
  const [interest, setInterest] = useState("subscription");
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});
  const [serverError, setServerError] = useState("");

  const isSubmitting = status === "submitting";
  const isDone = status === "success" || status === "duplicate";

  function handlePhoneChange(value: string) {
    setLocal(value.replace(/\D/g, "").slice(0, 9));
  }

  function validate(): boolean {
    const next: { name?: string; phone?: string } = {};

    if (name.trim().length < 2) {
      next.name = "Укажите имя.";
    }
    if (local.length !== 9) {
      next.phone = "Введите 9 цифр номера после +375.";
    } else if (!OPERATOR_CODES.includes(local.slice(0, 2))) {
      next.phone = "Код оператора должен быть 25, 29, 33 или 44.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function collectSource() {
    const params = new URLSearchParams(window.location.search);
    const get = (key: string) => params.get(key) || undefined;
    const clickId =
      get("yclid") || get("gclid") || get("fbclid") || get("click_id");

    return {
      utm_source: get("utm_source"),
      utm_medium: get("utm_medium"),
      utm_campaign: get("utm_campaign"),
      utm_content: get("utm_content"),
      utm_term: get("utm_term"),
      click_id: clickId,
      referrer: document.referrer || undefined,
      page_url: window.location.href,
    };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    setServerError("");
    if (!validate()) return;

    setStatus("submitting");

    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: "+375" + local,
          interest,
          comment: comment.trim(),
          ...collectSource(),
        }),
      });

      const data = (await res.json().catch(() => null)) as LeadResponse | null;

      if (res.ok && data?.ok) {
        setStatus(data.duplicate ? "duplicate" : "success");
        return;
      }

      if (data?.field === "phone") {
        setErrors({ phone: data.message ?? "Проверьте номер телефона." });
        setStatus("idle");
        return;
      }

      setServerError(
        data?.message ?? "Не удалось отправить заявку. Попробуйте ещё раз.",
      );
      setStatus("error");
    } catch {
      setServerError("Нет связи с сервером. Проверьте интернет и попробуйте снова.");
      setStatus("error");
    }
  }

  if (isDone) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center">
        <h3 className="text-xl font-semibold text-neutral-900">
          {status === "duplicate"
            ? "Заявка уже принята"
            : "Спасибо, заявка принята"}
        </h3>
        <p className="mt-2 text-neutral-600">
          {status === "duplicate"
            ? "Мы уже получили ваш номер — менеджер перезвонит в рабочее время."
            : "Менеджер свяжется с вами в рабочее время, чтобы подтвердить заказ."}
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8"
    >
      <div className="grid gap-5">
        <div>
          <label htmlFor="lead-name" className="block text-sm font-medium text-neutral-800">
            Имя
          </label>
          <input
            id="lead-name"
            name="name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "lead-name-error" : undefined}
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 outline-none focus:border-neutral-900"
          />
          {errors.name && (
            <p id="lead-name-error" className="mt-1 text-sm text-red-600">
              {errors.name}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="lead-phone" className="block text-sm font-medium text-neutral-800">
            Телефон
          </label>
          <div className="mt-1 flex rounded-lg border border-neutral-300 focus-within:border-neutral-900">
            <span className="flex items-center border-r border-neutral-200 px-3 text-neutral-500">
              +375
            </span>
            <input
              id="lead-phone"
              name="phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              placeholder="29 123-45-67"
              value={formatLocal(local)}
              onChange={(e) => handlePhoneChange(e.target.value)}
              aria-invalid={Boolean(errors.phone)}
              aria-describedby={errors.phone ? "lead-phone-error" : undefined}
              className="w-full rounded-r-lg px-3 py-2 outline-none"
            />
          </div>
          {errors.phone && (
            <p id="lead-phone-error" className="mt-1 text-sm text-red-600">
              {errors.phone}
            </p>
          )}
        </div>

        <fieldset>
          <legend className="text-sm font-medium text-neutral-800">Что интересует</legend>
          <div className="mt-2 grid gap-2">
            {INTEREST_OPTIONS.map((option) => (
              <label
                key={option.value}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-neutral-200 px-3 py-2 has-[:checked]:border-neutral-900"
              >
                <input
                  type="radio"
                  name="interest"
                  value={option.value}
                  checked={interest === option.value}
                  onChange={() => setInterest(option.value)}
                />
                <span className="text-neutral-700">{option.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor="lead-comment" className="block text-sm font-medium text-neutral-800">
            Комментарий <span className="text-neutral-400">(необязательно)</span>
          </label>
          <textarea
            id="lead-comment"
            name="comment"
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 outline-none focus:border-neutral-900"
          />
        </div>

        {serverError && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {serverError}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-neutral-900 px-5 py-3 font-medium text-white transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Отправляем…" : "Отправить заявку"}
        </button>

        <p className="text-xs text-neutral-500">
          Нажимая кнопку, вы соглашаетесь на обработку персональных данных.
        </p>
      </div>
    </form>
  );
}

const INTEREST_OPTIONS = [
  { value: "subscription", label: "Подписка — 2 пачки в месяц" },
  { value: "one-time", label: "Разовый заказ" },
  { value: "question", label: "У меня вопрос" },
];

function formatLocal(digits: string): string {
  const d = digits.slice(0, 9);
  if (d.length === 0) return "";
  if (d.length <= 2) return "(" + d;
  if (d.length <= 5) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2, 5)}-${d.slice(5)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 5)}-${d.slice(5, 7)}-${d.slice(7, 9)}`;
}
