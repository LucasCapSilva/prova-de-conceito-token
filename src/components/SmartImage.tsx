import { useState } from "react";
import { FALLBACK_IMAGE } from "../data/products";

interface SmartImageProps {
  src: string;
  alt: string;
  className?: string;
  eager?: boolean;
}

export default function SmartImage({ src, alt, className, eager }: SmartImageProps) {
  const [current, setCurrent] = useState(src);

  return (
    <img
      src={current}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      draggable={false}
      onError={() => current !== FALLBACK_IMAGE && setCurrent(FALLBACK_IMAGE)}
      className={className}
    />
  );
}
