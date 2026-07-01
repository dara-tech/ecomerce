import Link from "next/link";
import ProductImage from "@/components/ui/ProductImage";
import PriceDisplay from "@/components/features/PriceDisplay";
import { ReactNode } from "react";

export const MOBILE_PRODUCT_CARD_WIDTH = "w-[152px]";

type MobileProductCardProps = {
  id: string;
  name: string;
  image: string;
  price: number;
  category?: string;
  footer?: ReactNode;
  priority?: boolean;
};

export function MobileSectionHeader({
  title,
  subtitle,
  href,
  linkLabel = "View all",
}: {
  title: string;
  subtitle?: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3 md:mb-6">
      <div className="min-w-0">
        <h2 className="text-lg font-bold tracking-tight text-foreground md:text-2xl">{title}</h2>
        {subtitle && (
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground md:text-sm">{subtitle}</p>
        )}
      </div>
      {href && (
        <Link
          href={href}
          className="shrink-0 text-xs font-semibold text-foreground md:text-sm md:hover:underline md:underline-offset-4"
        >
          {linkLabel}
        </Link>
      )}
    </div>
  );
}

export function MobileProductRail({ children }: { children: ReactNode }) {
  return (
    <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-pl-4 px-4 pb-2 no-scrollbar md:hidden">
      {children}
    </div>
  );
}

export function CatalogProductCard({
  id,
  name,
  image,
  price,
  category,
  priority,
}: {
  id: string;
  name: string;
  image: string;
  price: number;
  category?: string;
  priority?: boolean;
}) {
  return (
    <Link
      href={`/products/${id}`}
      className="group flex flex-col transition-transform active:scale-[0.98]"
    >
      <div className="relative mb-2 aspect-[3/4] w-full overflow-hidden rounded-2xl bg-muted">
        <ProductImage
          src={image}
          alt={name}
          fill
          compactPlaceholder
          priority={priority}
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 768px) 50vw, 33vw"
        />
      </div>
      <h3 className="line-clamp-2 min-h-10 text-[13px] font-semibold leading-5 text-foreground">
        {name}
      </h3>
      <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{category || "\u00A0"}</p>
      <p className="mt-1 text-sm font-bold tabular-nums text-foreground">
        <PriceDisplay amount={price} />
      </p>
    </Link>
  );
}

export default function MobileProductCard({
  id,
  name,
  image,
  price,
  category,
  footer,
  priority,
}: MobileProductCardProps) {
  return (
    <article className={`${MOBILE_PRODUCT_CARD_WIDTH} shrink-0 snap-start snap-always flex flex-col`}>
      <Link href={`/products/${id}`} className="group flex flex-1 flex-col active:scale-[0.98] transition-transform">
        <div className="relative mb-2.5 aspect-[3/4] w-full overflow-hidden rounded-2xl bg-muted">
          <ProductImage
            src={image}
            alt={name}
            fill
            compactPlaceholder
            priority={priority}
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="152px"
          />
        </div>

        <div className="flex min-h-[4.75rem] flex-col">
          <h3 className="line-clamp-2 h-10 text-[13px] font-semibold leading-5 text-foreground">{name}</h3>
          <p className="mt-0.5 h-4 truncate text-[11px] text-muted-foreground">
            {category || "\u00A0"}
          </p>
          <p className="mt-auto pt-1.5 text-sm font-bold tabular-nums text-foreground">
            <PriceDisplay amount={price} />
          </p>
        </div>
      </Link>
      {footer ? <div className="mt-2 shrink-0">{footer}</div> : null}
    </article>
  );
}
