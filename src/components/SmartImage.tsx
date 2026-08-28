import { useState } from "react";
import { FALLBACK_IMAGE } from "../data/products";

interface SmartImageProps {
  src: string;
  alt: string;
  className?: string;
  eager?: boolean;
  width?: number;
  height?: number;
}

export default function SmartImage({ src, alt, className, eager, width = 900, height = 900 }: SmartImageProps) {
  const [current, setCurrent] = useState(src);

  return (
    <img
      src={current}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      width={width}
      height={height}
      draggable={false}
      onError={() => current !== FALLBACK_IMAGE && setCurrent(FALLBACK_IMAGE)}
      className={className}
    />
  );
}
