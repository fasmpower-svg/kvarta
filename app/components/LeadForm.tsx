"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

const OPERATOR_CODES = ["25", "29", "33", "44"];

const INTEREST_OPTIONS = [
  { value: "subscription", label: "Подписка — 2 пачки в месяц" },
  { value: "one-time", label: "Разовый заказ" },
  { value: "question", label: "У меня вопрос" },
] as const;

type Interest = (typeof INTEREST_OPTIONS)[number]["value"];
type Status = "idle" | "submitting" | "success" | "duplicate" | "error";

type LeadResponse = {
  ok?: boolean;
  duplicate?: boolean;
  field?: string;
  message?: string;
};

type OrderDetail = { interest: Interest; order?: string };

function buildComment(interest: Interest, product: string): string {
  if (interest === "subscription") return "Подписка — 2 пачки в месяц";
  if (interest === "one-time") {
    return product ? `Разовый заказ: ${product}` : "Разовый заказ";
  }
  return "";
}

export default function LeadForm() {
  const [name, setName] = useState("");
  const [local, setLocal] = useState("");
  const [interest, setInterest] = useState<Interest>("subscription");
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});
  const [serverError, setServerError] = useState("");

  const autoComment = useRef(true);
  const lastProduct = useRef("");

  const isSubmitting = status === "submitting";
  const isDone = status === "success" || status === "duplicate";

  useEffect(() => {
    function onOrder(event: Event) {
      const detail = (event as CustomEvent<OrderDetail>).detail;
      if (!detail) return;
      if (detail.order) lastProduct.current = detail.order;
      setInterest(detail.interest);
      if (autoComment.current) {
        setComment(buildComment(detail.interest, lastProduct.current));
      }
    }
    window.addEventListener("kvarta:order", onOrder);
    return () => window.removeEventListener("kvarta:order", onOrder);
  }, []);

  function pickInterest(value: Interest) {
    setInterest(value);
    if (autoComment.current) setComment(buildComment(value, lastProduct.current));
  }

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
    const clickId = get("yclid") || get("gclid") || get("fbclid") || get("click_id");

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

      setServerError(data?.message ?? "Не удалось отправить заявку. Попробуйте ещё раз.");
      setStatus("error");
    } catch {
      setServerError("Нет связи с сервером. Проверьте интернет и попробуйте снова.");
      setStatus("error");
    }
  }

  if (isDone) {
    return (
      <div className="done">
        <h3>{status === "duplicate" ? "Заявка уже принята" : "Спасибо, заявка принята"}</h3>
        <p>
          {status === "duplicate"
            ? "Мы уже получили ваш номер — менеджер перезвонит в рабочее время."
            : "Менеджер свяжется с вами в рабочее время, чтобы подтвердить заказ."}
        </p>
      </div>
    );
  }

  return (
    <form className="lead" onSubmit={handleSubmit} noValidate>
      <div>
        <label htmlFor="lead-name">Имя</label>
        <input
          id="lead-name"
          name="name"
          type="text"
          autoComplete="name"
          placeholder="Как к вам обращаться"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? "lead-name-error" : undefined}
        />
        {errors.name && (
          <p id="lead-name-error" className="err">
            {errors.name}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="lead-phone">Телефон</label>
        <div className="phone-row">
          <span className="cc">+375</span>
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
          />
        </div>
        {errors.phone ? (
          <p id="lead-phone-error" className="err">
            {errors.phone}
          </p>
        ) : (
          <div className="hint">Белорусский номер: код оператора 25, 29, 33 или 44.</div>
        )}
      </div>

      <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
        <legend className="lbl">Что интересует</legend>
        <div className="radios">
          {INTEREST_OPTIONS.map((option) => (
            <label key={option.value}>
              <input
                type="radio"
                name="interest"
                value={option.value}
                checked={interest === option.value}
                onChange={() => pickInterest(option.value)}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="lead-comment">Комментарий</label>
        <textarea
          id="lead-comment"
          name="comment"
          rows={3}
          placeholder="Необязательно"
          value={comment}
          onChange={(e) => {
            autoComment.current = false;
            setComment(e.target.value);
          }}
        />
      </div>

      {serverError && (
        <p role="alert" className="alert">
          {serverError}
        </p>
      )}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Отправляем…" : "Отправить заявку"}
      </button>

      <p className="hint">Нажимая кнопку, вы соглашаетесь на обработку персональных данных.</p>
    </form>
  );
}

function formatLocal(digits: string): string {
  const d = digits.slice(0, 9);
  if (d.length === 0) return "";
  if (d.length <= 2) return "(" + d;
  if (d.length <= 5) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2, 5)}-${d.slice(5)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 5)}-${d.slice(5, 7)}-${d.slice(7, 9)}`;
}
