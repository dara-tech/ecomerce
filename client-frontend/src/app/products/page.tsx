import type { Metadata } from "next";
import ProductCatalog from "@/components/features/ProductCatalog";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<Metadata> {
  const params = await searchParams;
  const category =
    typeof params.category === "string" ? params.category : undefined;

  return {
    title: category ? `${category} Products` : "All Products",
    description: `Shop our collection of ${category ? category.toLowerCase() : "premium tech"} products and accessories.`,
  };
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const category =
    typeof params.category === "string" ? params.category : undefined;

  return <ProductCatalog initialCategory={category} />;
}
