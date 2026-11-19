"use client";

import { Check, Circle } from "lucide-react";

export function isStrongPassword(password: string): boolean {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password)
  );
}

export function PasswordStrengthHint({ password }: { password: string }) {
  if (!password) return null;

  const rules = [
    { label: "At least 8 characters", met: password.length >= 8 },
    { label: "Uppercase letter", met: /[A-Z]/.test(password) },
    { label: "Lowercase letter", met: /[a-z]/.test(password) },
    { label: "A number", met: /\d/.test(password) },
  ];

  return (
    <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
      {rules.map((r) => (
        <div
          key={r.label}
          className={`flex items-center gap-1.5 ${
            r.met ? "text-emerald-600 font-medium" : "text-[#64748b]"
          }`}
        >
          {r.met ? (
            <Check className="w-3 h-3 shrink-0" />
          ) : (
            <Circle className="w-2.5 h-2.5 shrink-0 opacity-60" />
          )}
          <span>{r.label}</span>
        </div>
      ))}
    </div>
  );
}
