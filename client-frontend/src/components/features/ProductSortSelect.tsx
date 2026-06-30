"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ProductSortSelect() {
  return (
    <Select defaultValue="Featured">
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Sort by: Featured" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="Featured">Sort by: Featured</SelectItem>
        <SelectItem value="Price: Low to High">Price: Low to High</SelectItem>
        <SelectItem value="Price: High to Low">Price: High to Low</SelectItem>
        <SelectItem value="Newest Arrivals">Newest Arrivals</SelectItem>
      </SelectContent>
    </Select>
  );
}
