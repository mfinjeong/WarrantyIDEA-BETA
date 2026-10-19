"use client";
import {
  Camera,
  Coffee,
  Headphones,
  Laptop,
  Speaker,
  Package,
  Smartphone,
  Tv,
  Refrigerator,
  WashingMachine,
  Printer,
  Gamepad2,
  Tablet,
  Monitor,
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
  const Icon = /headphone|headset|earbud/.test(n)
    ? Headphones
    : /kopi|coffee/.test(n)
      ? Coffee
      : n.includes("laptop")
        ? Laptop
        : n.includes("purifier")
          ? Wind
          : /kamera|camera/.test(n)
            ? Camera
            : /watch|jam tangan/.test(n)
              ? Watch
              : n.includes("blender")
                ? Blender
                : /speaker|pengeras suara/.test(n)
                  ? Speaker
                  : /smartphone|handphone|ponsel|iphone/.test(n)
                    ? Smartphone
                    : /televisi|\btv\b/.test(n)
                      ? Tv
                      : /kulkas|refrigerator/.test(n)
                        ? Refrigerator
                        : /mesin cuci|washing/.test(n)
                          ? WashingMachine
                          : /printer/.test(n)
                            ? Printer
                            : /konsol|playstation|xbox|gamepad/.test(n)
                              ? Gamepad2
                              : /tablet|ipad/.test(n)
                                ? Tablet
                                : /monitor/.test(n)
                                  ? Monitor
                                  : Package;
  return (
    <span
      aria-hidden="true"
      className={`product-icon ${large ? "product-icon-large" : ""} product-tone-${n.length % 4}`}
    >
      <Icon size={large ? 52 : 25} strokeWidth={1.5} aria-hidden="true" />
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
