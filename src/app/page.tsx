
"use client";

import { useState, useEffect, useCallback } from 'react';
import NewsArticleCard from '@/components/news/news-article-card';
import type { Article as NewsArticle } from '@/services/newsService'; // Use the new Article type
import Filters from '@/components/news/filters';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchNewsArticles } from '@/actions/newsActions';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";

const categories = ["Technology", "Business", "Sports", "Health", "Science", "Entertainment", "General", "Politics", "Food", "Travel"];
const countries = ["USA", "UK", "Canada", "Global", "Brazil", "Australia", "India", "Germany", "France", "Japan", "China"]; // Added more

// Country codes for Newsdata.io and Mediastack (generally common 2-letter ISO)
const countryCodeMap: { [key: string]: string | null } = {
  "USA": "us",
  "UK": "gb",
  "Canada": "ca",
  "Brazil": "br",
  "Australia": "au",
  "India": "in",
  "Germany": "de",
  "France": "fr",
  "Japan": "jp",
  "China": "cn",
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

    let apiCategoryQuery: string | null = selectedCategory.toLowerCase();
    if (selectedCategory === 'all') {
      apiCategoryQuery = 'general'; // Default to 'general' for "All Categories" for APIs
    }
    
    let apiCountryCode: string | null = null;
    if (selectedCountry !== 'all' && countryCodeMap[selectedCountry] !== undefined) {
      apiCountryCode = countryCodeMap[selectedCountry];
    } else if (selectedCountry === 'all') {
      apiCountryCode = null; // Explicitly null for global/all countries
    }


    const displayCategoryForCard = selectedCategory === 'all' ? 'General' : selectedCategory;
    const displayCountryForCard = selectedCountry === 'all' ? 'Global' : selectedCountry;

    try {
      const fetchedArticles = await fetchNewsArticles(apiCategoryQuery, apiCountryCode, displayCategoryForCard, displayCountryForCard);
      setArticles(fetchedArticles);
    } catch (error) {
      console.error("Failed to fetch news articles:", error);
      if (error instanceof Error && error.message.toLowerCase().includes('api key')) {
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
          <AlertTitle>API Configuration Error</AlertTitle>
          <AlertDescription>
            {apiKeyError}
            {apiKeyError.toLowerCase().includes("newsdata.io api key") && 
              " Please ensure your NEWSDATA_API_KEY is correctly set in the .env file."}
            {apiKeyError.toLowerCase().includes("mediastack api key") && 
              " Please ensure your MEDIASTACK_KEY_... (e.g., MEDIASTACK_KEY_1) is correctly set in the .env file."}
            {!apiKeyError.toLowerCase().includes("newsdata.io api key") && !apiKeyError.toLowerCase().includes("mediastack api key") && apiKeyError.toLowerCase().includes("api key") &&
              " Please ensure your API keys (e.g., NEWSDATA_API_KEY, MEDIASTACK_KEY_1) are correctly set in the .env file."}
          </AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="bg-card p-4 rounded-lg shadow-md space-y-3">
              <Skeleton className="h-48 w-full md:w-48 lg:w-56 xl:w-64 md:h-auto flex-shrink-0" />
              <div className="flex-grow space-y-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
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
