export type PasswordLevel = "fraca" | "media" | "forte";

export interface PasswordRule {
  id: string;
  label: string;
  met: boolean;
}

export interface PasswordEvaluation {
  level: PasswordLevel;
  score: number;
  rules: PasswordRule[];
}

export function evaluatePassword(password: string): PasswordEvaluation {
  const rules: PasswordRule[] = [
    { id: "len8", label: "Mínimo de 8 caracteres", met: password.length >= 8 },
    { id: "len12", label: "Mínimo de 12 caracteres", met: password.length >= 12 },
    {
      id: "cases",
      label: "Letras maiúsculas e minúsculas",
      met: /[a-z]/.test(password) && /[A-Z]/.test(password),
    },
    { id: "digit", label: "Pelo menos um número", met: /\d/.test(password) },
    {
      id: "symbol",
      label: "Pelo menos um símbolo (!@#$...)",
      met: /[^a-zA-Z0-9]/.test(password),
    },
  ];
  const score = rules.filter((r) => r.met).length;
  const level: PasswordLevel =
    password.length < 8 || score <= 3 ? "fraca" : score === 4 ? "media" : "forte";
  return { level, score, rules };
}

const LEVEL_META: Record<PasswordLevel, { label: string; fill: number; color: string }> = {
  fraca: { label: "Fraca", fill: 1, color: "#D93026" },
  media: { label: "Média", fill: 2, color: "#FFB300" },
  forte: { label: "Forte", fill: 3, color: "#2BAF6E" },
};

export default function PasswordStrength({ password }: { password: string }) {
  const evaluation = evaluatePassword(password);
  const meta = LEVEL_META[evaluation.level];

  return (
    <div className="mt-2" role="status" aria-live="polite">
      <div className="flex items-center gap-1">
        {[1, 2, 3].map((segment) => (
          <span
            key={segment}
            aria-hidden="true"
            className="h-1.5 flex-1 rounded-full transition-colors"
            style={{
              backgroundColor:
                segment <= meta.fill ? meta.color : "var(--line)",
            }}
          />
        ))}
        <span className="ml-2 text-[11px] font-bold" style={{ color: meta.color }}>
          {meta.label}
        </span>
      </div>
      <ul className="mt-2 grid grid-cols-1 gap-1 sm:grid-cols-2">
        {evaluation.rules.map((rule) => (
          <li
            key={rule.id}
            className={`flex items-center gap-1.5 text-[11px] leading-4 ${
              rule.met ? "text-[#2BAF6E]" : "text-ink-soft"
            }`}
          >
            <span aria-hidden="true" className="text-[10px]">
              {rule.met ? "✓" : "○"}
            </span>
            {rule.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
