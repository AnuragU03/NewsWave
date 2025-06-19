
"use client";

import { useState, useEffect, useCallback } from 'react';
import NewsArticleCard, { type NewsArticle } from '@/components/news/news-article-card';
import Filters from '@/components/news/filters';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchNews } from '@/services/news-service'; 
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";

const categories = ["Technology", "Business", "Sports", "Health", "Science", "Entertainment", "General", "Politics", "Food", "Travel"]; // Added more Newsdata.io relevant cats
const countries = ["USA", "UK", "Canada", "Global", "Brazil", "Australia", "India"]; // Added more countries

const countryCodeMap: { [key: string]: string | null } = {
  "USA": "us",
  "UK": "gb",
  "Canada": "ca",
  "Brazil": "br",
  "Australia": "au",
  "India": "in",
  "Global": null, 
};

export default function DashboardPage() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);

  const loadNews = useCallback(async () => {
    setIsLoading(true);
    setApiKeyError(null);

    // apiCategory will be lowercase category name or 'general' if 'all' or 'General' is selected.
    // This 'general' will be mapped to 'top' by the news-service for Newsdata.io.
    let apiCategory: string = selectedCategory.toLowerCase();
    if (selectedCategory === 'all' || selectedCategory === 'General') {
      apiCategory = 'general'; 
    }
    
    let apiCountryCode: string | null = null;
    if (selectedCountry !== 'all' && countryCodeMap[selectedCountry] !== undefined) {
      apiCountryCode = countryCodeMap[selectedCountry];
    }

    const displayCategoryForCard = selectedCategory === 'all' ? 'General' : selectedCategory;
    const displayCountryForCard = selectedCountry === 'all' ? 'Global' : selectedCountry;

    try {
      // The news-service will handle mapping 'general' to 'top' if needed,
      // and will default to 'top' if apiCategory is effectively null/all.
      const categoryToFetch = apiCategory; 
      const countryToFetch = apiCountryCode;

      const fetchedArticles = await fetchNews(categoryToFetch, countryToFetch, displayCategoryForCard, displayCountryForCard);
      setArticles(fetchedArticles);
    } catch (error) {
      console.error("Failed to fetch news articles:", error);
      if (error instanceof Error && error.message.includes('API key')) {
        setApiKeyError(error.message);
      } else {
         setApiKeyError(error instanceof Error ? error.message : "Could not load news. Please try again later.");
      }
      setArticles([]); 
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory, selectedCountry]);

  useEffect(() => {
    loadNews();
  }, [loadNews]);

  const handleClearFilters = () => {
    setSelectedCategory('all');
    setSelectedCountry('all');
  };

  return (
    <div className="space-y-8">
      <header className="text-center py-8">
        <h1 className="text-4xl font-headline font-bold text-primary">NewsWave Dashboard</h1>
        <p className="text-lg text-muted-foreground mt-2">Your daily digest of world news.</p>
      </header>
      
      <Filters
        categories={categories}
        countries={countries}
        selectedCategory={selectedCategory}
        selectedCountry={selectedCountry}
        onCategoryChange={setSelectedCategory}
        onCountryChange={setSelectedCountry}
        onClearFilters={handleClearFilters}
      />

      {apiKeyError && (
        <Alert variant="destructive" className="mb-6">
          <Terminal className="h-4 w-4" />
          <AlertTitle>API Error</AlertTitle>
          <AlertDescription>
            {apiKeyError}
            {apiKeyError.includes("API key") && 
              " Please ensure your NEWSDATA_API_KEY is correctly set in the .env file."}
          </AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="bg-card p-4 rounded-lg shadow-md space-y-3">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      ) : articles.length === 0 && !apiKeyError ? (
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold text-muted-foreground">No articles found.</h2>
            <p className="text-muted-foreground mt-2">Try adjusting your filters or check back later.</p>
          </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article) => (
            <NewsArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </div>
  );
}
