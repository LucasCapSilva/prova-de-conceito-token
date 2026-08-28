import { useMemo } from "react";
import { getAddresses } from "../lib/addresses";
import { estimateDeliveryDate } from "../lib/shipping";
import { formatDate } from "../lib/format";

export default function DeliveryEstimate({
  price,
  freeShipping,
  className = "",
}: {
  price: number;
  freeShipping: boolean;
  className?: string;
}) {
  const label = useMemo(() => {
    const addr = getAddresses()[0];
    if (!addr) return null;
    const date = estimateDeliveryDate(addr.cep, [{ freeShipping }], price);
    return date ? `chega até ${formatDate(date)}` : null;
  }, [price, freeShipping]);

  if (!label) return null;

  return (
    <p className={`text-[11px] text-ink-soft ${className}`}>
      🚚 {label}
    </p>
  );
}
