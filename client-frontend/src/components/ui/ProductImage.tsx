"use client";

import Image, { ImageProps } from "next/image";
import { useState } from "react";
import { Package } from "lucide-react";

interface ProductImageProps extends Omit<ImageProps, "src"> {
  src: string;
  fallbackText?: string;
  /** Icon-only placeholder for compact product rails (no text on image). */
  compactPlaceholder?: boolean;
}

function isRemoteUrl(src: string) {
  return /^https?:\/\//i.test(src);
}

export default function ProductImage({
  src,
  alt,
  fallbackText,
  compactPlaceholder,
  fill,
  sizes,
  className,
  priority,
  loading,
  ...props
}: ProductImageProps) {
  const [error, setError] = useState(false);

  if (error || !src || src === "/images/sample.jpg") {
    return (
      <div
        className={`flex w-full h-full items-center justify-center bg-muted text-muted-foreground ${
          compactPlaceholder ? "" : "flex-col"
        } ${className || ""}`}
      >
        <Package className={`opacity-25 ${compactPlaceholder ? "size-8" : "mb-2 size-12"}`} />
        {!compactPlaceholder && (
          <span className="px-4 text-center text-sm font-medium opacity-50">
            {fallbackText || alt || "No Image Available"}
          </span>
        )}
      </div>
    );
  }

  return (
    <Image
      {...props}
      className={className}
      fill={fill}
      sizes={fill && !sizes ? "(max-width: 768px) 100vw, 64px" : sizes}
      src={src}
      alt={alt}
      priority={priority}
      loading={priority ? undefined : loading ?? "lazy"}
      unoptimized={isRemoteUrl(src)}
      onError={() => setError(true)}
    />
  );
}
