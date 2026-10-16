"use client";
import {
  Camera,
  Coffee,
  Headphones,
  Laptop,
  Speaker,
  Watch,
  Wind,
  Blender,
} from "lucide-react";
import type { Warranty } from "@/lib/demo/types";
export function ProductIcon({
  name,
  large = false,
}: {
  name: string;
  large?: boolean;
}) {
  const n = name.toLowerCase();
  const Icon = n.includes("headphone")
    ? Headphones
    : n.includes("kopi")
      ? Coffee
      : n.includes("laptop")
        ? Laptop
        : n.includes("purifier")
          ? Wind
          : n.includes("kamera")
            ? Camera
            : n.includes("watch")
              ? Watch
              : n.includes("blender")
                ? Blender
                : Speaker;
  return (
    <span
      className={`product-icon ${large ? "product-icon-large" : ""} product-tone-${n.length % 4}`}
    >
      <Icon size={large ? 52 : 25} strokeWidth={1.5} />
    </span>
  );
}
export function ProductIdentity({ product }: { product: Warranty }) {
  return (
    <span className="product-identity">
      <ProductIcon name={product.productName} />
      <span>
        <strong>{product.productName}</strong>
        <span>
          {product.brand} · {product.model}
        </span>
      </span>
    </span>
  );
}
