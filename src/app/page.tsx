
"use client";

import { useState, useEffect, useCallback } from 'react';
import NewsArticleCard from '@/components/news/news-article-card';
import type { Article as NewsArticleType } from '@/services/newsService';
import Filters from '@/components/news/filters';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { fetchNewsArticles } from '@/actions/newsActions';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, RefreshCw, CheckSquare } from "lucide-react";
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";


const categories = ["Technology", "Business", "Sports", "Health", "Science", "Entertainment", "General", "Politics", "Food", "Travel"];
const countries = [
  { name: "Global", code: "all" }, 
  { name: "USA", code: "us" },
  { name: "UK", code: "gb" },
  { name: "Canada", code: "ca" },
  { name: "Australia", code: "au" },
  { name: "Germany", code: "de" },
  { name: "France", code: "fr" },
  { name: "India", code: "in" },
  { name: "Japan", code: "jp" },
];

export default function DashboardPage() {
  const [articles, setArticles] = useState<NewsArticleType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all'); 
  const [selectedCountryCode, setSelectedCountryCode] = useState('all'); 
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnlyVerified, setShowOnlyVerified] = useState(false);

  const loadNews = useCallback(async (isRetry: boolean = false) => {
    if (!isRetry) setIsLoading(true);
    setApiKeyError(null);

    let apiCategoryQuery: string | null = selectedCategory.toLowerCase();
    if (selectedCategory === 'all') {
      apiCategoryQuery = 'general'; 
    }
    
    const currentCountryObject = countries.find(c => c.code === selectedCountryCode);
    const displayCountryName = currentCountryObject ? currentCountryObject.name : "Global";
    const apiCountryCodeForQuery = selectedCountryCode === 'all' ? null : selectedCountryCode;

    const displayCategoryForCard = selectedCategory === 'all' ? 'General' : selectedCategory;

    try {
      const fetchedArticles = await fetchNewsArticles(
        searchQuery || apiCategoryQuery, 
        searchQuery ? null : apiCountryCodeForQuery, 
        displayCategoryForCard, 
        displayCountryName,
        user?.categoryClicks,
        searchQuery ? true : false 
      );
      setArticles(fetchedArticles);
    } catch (error) {
      console.error("Failed to fetch news articles:", error);
      if (error instanceof Error && (error.message.toLowerCase().includes('api key') || error.message.toLowerCase().includes('api token') || error.message.toLowerCase().includes('configured or available') || error.message.toLowerCase().includes('access_key'))) {
        setApiKeyError(error.message); 
      } else {
         setApiKeyError(error instanceof Error ? error.message : "Could not load news. Please try again later.");
      }
      setArticles([]); 
    } finally {
      if (!isRetry) setIsLoading(false);
    }
  }, [selectedCategory, selectedCountryCode, user, searchQuery]);

  useEffect(() => {
    loadNews();
  }, [loadNews]);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchQuery) { 
          loadNews();
      } else if (!searchQuery && (selectedCategory !== 'all' || selectedCountryCode !== 'all')) {
         loadNews();
      } else if (!searchQuery && selectedCategory === 'all' && selectedCountryCode === 'all') {
         loadNews();
      }
    }, 500); 

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery, loadNews]);


  const handleClearFilters = () => {
    setSelectedCategory('all');
    setSelectedCountryCode('all');
    setSearchQuery(''); 
  };
  
  const handleSearchInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };
  
  const handleSearchButtonClick = () => {
    loadNews(); 
  };

  const articlesToDisplay = showOnlyVerified
    ? articles.filter(article => article.verified)
    : articles;

  return (
    <div className="space-y-6 md:space-y-8">
      <header className="text-center py-4 md:py-6">
        <p className="text-lg text-muted-foreground mt-1">Your daily digest of world news, with a Neubrutalist twist!</p>
      </header>
      
      <div className="mb-8 neu-brutal bg-card p-4 space-y-4">
        <div className="flex flex-wrap gap-3 md:gap-4 items-center">
            <input 
                type="text" 
                value={searchQuery}
                onChange={handleSearchInputChange}
                placeholder="Search news..."
                className="p-2 neu-brutal bg-background border-black flex-grow focus:ring-2 focus:ring-primary focus:outline-none"
            />
            <Filters
              categories={categories}
              countries={countries.map(c => ({ name: c.name, code: c.code }))}
              selectedCategory={selectedCategory}
              selectedCountryCode={selectedCountryCode}
              onCategoryChange={setSelectedCategory}
              onCountryChange={setSelectedCountryCode}
              onClearFilters={handleClearFilters}
            />
             <Button 
                onClick={handleSearchButtonClick} 
                className="neu-brutal bg-newsmania-red text-black hover:bg-red-400 p-2 px-3 md:px-4 neu-brutal-hover neu-brutal-active"
            >
                <RefreshCw size={18} className="md:mr-1" /> Search
            </Button>
        </div>
        <div className="flex items-center space-x-2 neu-brutal bg-background border-black p-3 rounded-md">
          <Switch
            id="verified-news-toggle"
            checked={showOnlyVerified}
            onCheckedChange={setShowOnlyVerified}
            className="data-[state=checked]:bg-newsmania-green data-[state=unchecked]:bg-muted"
          />
          <Label htmlFor="verified-news-toggle" className="font-medium text-foreground flex items-center">
            <CheckSquare size={18} className="mr-2 text-newsmania-green" /> Show Only Verified News
          </Label>
        </div>
      </div>


      {apiKeyError && (
        <Alert variant="destructive" className="mb-6 neu-brutal">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle className="font-bold">API Configuration Error!</AlertTitle>
          <AlertDescription>
            {apiKeyError} <br />
            Please ensure the relevant API key is correctly set in your <code>.env</code> file.
          </AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
             <Card key={index} className="neu-brutal bg-card p-4 flex flex-col justify-between min-h-[200px]">
                <Skeleton className="h-6 w-3/4 mb-2 bg-muted/50" />
                <Skeleton className="h-4 w-1/2 mb-1 bg-muted/50" />
                <Skeleton className="h-4 w-full mb-1 bg-muted/50" />
                <Skeleton className="h-4 w-full mb-1 bg-muted/50" />
                <Skeleton className="h-4 w-3/4 mb-3 bg-muted/50" />
                <div className="flex justify-between items-center mt-auto pt-2 border-t border-muted-foreground/30">
                  <Skeleton className="h-8 w-20 bg-muted/50" />
                  <Skeleton className="h-8 w-20 bg-muted/50" />
                </div>
            </Card>
          ))}
        </div>
      ) : articlesToDisplay.length === 0 && !apiKeyError ? (
          <div className="neu-brutal bg-newsmania-yellow text-black p-6 md:p-8 text-center">
            <AlertTriangle size={48} className="mx-auto mb-3" />
            <h2 className="text-2xl font-bold">No {showOnlyVerified ? "verified " : ""}news articles found.</h2>
            <p className="mt-1">Try different search terms or filters, or toggle the verified news filter!</p>
          </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articlesToDisplay.map((article) => (
            <NewsArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </div>
  );
}
