
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
  countries: Array<{ name: string; code: string }>; // Updated to accept objects
  selectedCategory: string;
  selectedCountryCode: string; // Updated to selectedCountryCode
  onCategoryChange: (category: string) => void;
  onCountryChange: (countryCode: string) => void; // Updated to countryCode
  onClearFilters: () => void;
}

export default function Filters({
  categories,
  countries,
  selectedCategory,
  selectedCountryCode,
  onCategoryChange,
  onCountryChange,
  onClearFilters,
}: FiltersProps) {
  return (
    // Removed outer container as it's now part of page.tsx structure
    // Styles are applied directly to Select and Button for Neubrutalism
    <>
      <Select value={selectedCategory} onValueChange={onCategoryChange}>
        <SelectTrigger className="neu-brutal bg-newsmania-green text-black border-black w-full md:w-[180px] focus:ring-primary">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent className="neu-brutal border-black bg-card">
          <SelectItem value="all" className="hover:bg-newsmania-green/50 focus:bg-newsmania-green/50">All Categories</SelectItem>
          {categories.map((category) => (
            <SelectItem key={category} value={category.toLowerCase()} className="hover:bg-newsmania-green/50 focus:bg-newsmania-green/50">
              {category}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={selectedCountryCode} onValueChange={onCountryChange}>
        <SelectTrigger className="neu-brutal bg-newsmania-orange text-black border-black w-full md:w-[180px] focus:ring-primary">
          <SelectValue placeholder="Country" />
        </SelectTrigger>
        <SelectContent className="neu-brutal border-black bg-card">
          {/* <SelectItem value="all" className="hover:bg-newsmania-orange/50 focus:bg-newsmania-orange/50">All Countries</SelectItem> */}
          {countries.map((country) => (
            <SelectItem key={country.code} value={country.code} className="hover:bg-newsmania-orange/50 focus:bg-newsmania-orange/50">
              {country.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Button 
        variant="outline" 
        onClick={onClearFilters} 
        className="neu-brutal bg-card border-black text-black hover:bg-muted w-full md:w-auto neu-brutal-hover neu-brutal-active"
      >
        <FilterX className="mr-2 h-4 w-4" /> Clear
      </Button>
    </>
  );
}
