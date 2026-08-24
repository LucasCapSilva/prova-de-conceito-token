import { formatBRL } from "../lib/format";

interface Props {
  price: number;
  oldPrice?: number;
  size?: "sm" | "md";
  className?: string;
}

export default function Price({ price, oldPrice, size = "md", className = "" }: Props) {
  const sm = size === "sm";
  const num = formatBRL(price).replace("R$", "").trim();
  return (
    <div className={`flex items-baseline gap-x-2 ${className}`}>
      {oldPrice != null && oldPrice > price && (
        <span className={`${sm ? "text-[11px]" : "text-xs"} text-ink-soft line-through`}>
          {formatBRL(oldPrice)}
        </span>
      )}
      <span className="text-brand">
        <span className={`${sm ? "text-[10px]" : "text-xs"} font-medium`}>R$</span>
        <span className={`${sm ? "text-sm" : "text-lg"} font-bold leading-none`}>{num}</span>
      </span>
    </div>
  );
}
