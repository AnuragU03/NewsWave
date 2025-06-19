"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { FilterX } from "lucide-react";

interface FiltersProps {
  categories: string[];
  countries: string[];
  selectedCategory: string;
  selectedCountry: string;
  onCategoryChange: (category: string) => void;
  onCountryChange: (country: string) => void;
  onClearFilters: () => void;
}

export default function Filters({
  categories,
  countries,
  selectedCategory,
  selectedCountry,
  onCategoryChange,
  onCountryChange,
  onClearFilters,
}: FiltersProps) {
  return (
    <div className="mb-8 p-6 bg-card rounded-xl shadow-md flex flex-col md:flex-row gap-4 items-center">
      <h3 className="text-lg font-semibold text-foreground mr-4 hidden md:block">Filter News</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:flex md:flex-row gap-4 w-full md:w-auto">
        <Select value={selectedCategory} onValueChange={onCategoryChange}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Select Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedCountry} onValueChange={onCountryChange}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Select Country" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Countries</SelectItem>
            {countries.map((country) => (
              <SelectItem key={country} value={country}>
                {country}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Button variant="outline" onClick={onClearFilters} className="w-full md:w-auto">
          <FilterX className="mr-2 h-4 w-4" /> Clear Filters
        </Button>
      </div>
    </div>
  );
}