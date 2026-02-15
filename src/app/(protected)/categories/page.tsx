import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { CategoriesClient, CategoriesSkeleton } from "@/components/categories";
import { getUserCategories } from "@/actions/categories";

export default async function CategoriesPage() {
  const user = await getUser();
  if (!user) {
    redirect("/login");
  }

  const categories = await getUserCategories();

  return (
    <Suspense fallback={<CategoriesSkeleton />}>
      <CategoriesClient categories={categories} />
    </Suspense>
  );
}
