import CategoriesView from "@/components/features/CategoriesView";
import { getApiUrl } from "@/lib/api";

interface Category {
  _id: string;
  name: string;
  description: string;
  icon?: string;
  isActive: boolean;
}

async function getCategories(): Promise<Category[]> {
  try {
    const res = await fetch(`${getApiUrl()}/categories`, {
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      return [];
    }

    const data = await res.json();
    return data.filter((c: Category) => c.isActive);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

export default async function CategoriesPage() {
  const categories = await getCategories();

  return <CategoriesView categories={categories} />;
}
