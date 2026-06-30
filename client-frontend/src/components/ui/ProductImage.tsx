"use client";

import Image, { ImageProps } from "next/image";
import { useState } from "react";
import { Package } from "lucide-react";

interface ProductImageProps extends Omit<ImageProps, "src"> {
  src: string;
  fallbackText?: string;
}

export default function ProductImage({ src, alt, fallbackText, fill, sizes, ...props }: ProductImageProps) {
  const [error, setError] = useState(false);

  if (error || !src || src === '/images/sample.jpg') {
    return (
      <div className={`flex flex-col items-center justify-center bg-muted text-muted-foreground w-full h-full ${props.className || ''}`}>
        <Package className="w-12 h-12 mb-2 opacity-20" />
        <span className="text-sm font-medium opacity-50 px-4 text-center">
          {fallbackText || alt || "No Image Available"}
        </span>
      </div>
    );
  }

  return (
    <Image
      {...props}
      fill={fill}
      sizes={fill && !sizes ? "(max-width: 768px) 100vw, 64px" : sizes}
      src={src}
      alt={alt}
      onError={() => setError(true)}
    />
  );
}
