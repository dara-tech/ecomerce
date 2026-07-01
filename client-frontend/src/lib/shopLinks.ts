/** Map legacy CMS/footer paths like /categories/sale to real storefront routes. */
const LEGACY_SHOP_PATHS: Record<string, string> = {
  new: '/products?sort=newest',
  sale: '/products',
  spring: '/products',
  essentials: '/products',
  tech: '/products?category=Electronics',
  winter: '/products?category=Clothing',
};

export function resolveShopLink(linkUrl?: string | null): string {
  if (!linkUrl) return '/products';

  const legacy = linkUrl.match(/^\/categories\/([^/?#]+)/);
  if (legacy) {
    return LEGACY_SHOP_PATHS[legacy[1].toLowerCase()] ?? '/products';
  }

  return linkUrl;
}
