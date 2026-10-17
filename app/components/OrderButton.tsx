"use client";

import type { ReactNode } from "react";

type Props = {
  interest: "subscription" | "one-time";
  order?: string;
  className?: string;
  children: ReactNode;
};

export default function OrderButton({ interest, order, className, children }: Props) {
  function handleClick() {
    window.dispatchEvent(
      new CustomEvent("kvarta:order", { detail: { interest, order } }),
    );
    document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <button type="button" className={className} onClick={handleClick}>
      {children}
    </button>
  );
}
