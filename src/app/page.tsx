
"use client";

import { useState, useEffect, useCallback } from 'react';
import NewsArticleCard from '@/components/news/news-article-card';
import type { Article as NewsArticleType } from '@/services/newsService'; // Renamed to avoid conflict
import Filters from '@/components/news/filters'; // Will need styling updates
import { Skeleton } from '@/components/ui/skeleton'; // Keep for loading
import { Card } from '@/components/ui/card'; // For loading skeleton container
import { fetchNewsArticles } from '@/actions/newsActions';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, RefreshCw } from "lucide-react"; // Replaced Terminal with AlertTriangle
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';

const categories = ["Technology", "Business", "Sports", "Health", "Science", "Entertainment", "General", "Politics", "Food", "Travel"];
// Country codes for APIs (ensure they match what APIs expect)
const countries = [
  { name: "Global", code: "all" }, // 'all' or null for global
  { name: "USA", code: "us" },
  { name: "UK", code: "gb" },
  { name: "Canada", code: "ca" },
  { name: "Australia", code: "au" },
  { name: "Germany", code: "de" },
  { name: "France", code: "fr" },
  { name: "India", code: "in" },
  { name: "Japan", code: "jp" },
  // { name: "China", code: "cn" }, // Example, add more as needed
];

export default function DashboardPage() {
  const [articles, setArticles] = useState<NewsArticleType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all'); 
  const [selectedCountryCode, setSelectedCountryCode] = useState('all'); 
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState(''); // For search input

  const loadNews = useCallback(async (isRetry: boolean = false) => {
    if (!isRetry) setIsLoading(true); // Don't show full loading on silent retry for AI
    setApiKeyError(null);

    let apiCategoryQuery: string | null = selectedCategory.toLowerCase();
    if (selectedCategory === 'all') {
      apiCategoryQuery = 'general'; 
    }
    
    // Determine display country name from code
    const currentCountryObject = countries.find(c => c.code === selectedCountryCode);
    const displayCountryName = currentCountryObject ? currentCountryObject.name : "Global";
    const apiCountryCodeForQuery = selectedCountryCode === 'all' ? null : selectedCountryCode;

    const displayCategoryForCard = selectedCategory === 'all' ? 'General' : selectedCategory;

    try {
      const fetchedArticles = await fetchNewsArticles(
        searchQuery || apiCategoryQuery, // Pass searchQuery if present, otherwise category
        searchQuery ? null : apiCountryCodeForQuery, // If searching, country might be less relevant or handled by query
        displayCategoryForCard, 
        displayCountryName,
        user?.categoryClicks,
        searchQuery ? true : false // isSearchQuery flag
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
  
  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchQuery) { // Only fetch if search query is not empty
          loadNews();
      } else if (!searchQuery && (selectedCategory !== 'all' || selectedCountryCode !== 'all')) {
         // If search is cleared, reload based on filters if they are not default
         loadNews();
      } else if (!searchQuery && selectedCategory === 'all' && selectedCountryCode === 'all') {
         // If search cleared and filters are default, load general news
         loadNews();
      }
    }, 500); // 500ms debounce

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]); // Effect only runs when searchQuery changes


  const handleClearFilters = () => {
    setSelectedCategory('all');
    setSelectedCountryCode('all');
    setSearchQuery(''); 
    // loadNews will be triggered by useEffect watching these state changes
  };
  
  const handleSearchInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };
  
  const handleSearchButtonClick = () => {
    loadNews(); // Trigger news load immediately on button click
  };

  return (
    <div className="space-y-6 md:space-y-8">
      <header className="text-center py-4 md:py-6">
        {/* Title is in Navbar now, this can be a sub-header or removed */}
        {/* <h1 className="text-4xl font-headline font-bold text-primary neu-brutal-header">NewsWave Dashboard</h1> */}
        <p className="text-lg text-muted-foreground mt-1">Your daily digest of world news, with a Neubrutalist twist!</p>
      </header>
      
      {/* Search and Filter Section - Neubrutal Styling */}
      <div className="mb-8 neu-brutal bg-card p-4">
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
              countries={countries.map(c => ({ name: c.name, code: c.code }))} // Pass objects for Filters
              selectedCategory={selectedCategory}
              selectedCountryCode={selectedCountryCode}
              onCategoryChange={setSelectedCategory}
              onCountryChange={setSelectedCountryCode}
              onClearFilters={handleClearFilters}
              // Removed onSearchClick as search is triggered by input change or dedicated button
            />
             <Button 
                onClick={handleSearchButtonClick} 
                className="neu-brutal bg-newsmania-red text-black hover:bg-red-400 p-2 px-3 md:px-4 neu-brutal-hover neu-brutal-active"
            >
                <RefreshCw size={18} className="md:mr-1" /> Search
            </Button>
        </div>
      </div>


      {apiKeyError && (
        <Alert variant="destructive" className="mb-6 neu-brutal">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle className="font-bold">API Configuration Error!</AlertTitle>
          <AlertDescription>
            {apiKeyError} <br />
            Please ensure the relevant API key (Mediastack, The Guardian, GNews, or Newsdata.io) is correctly set in your <code>.env</code> file.
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
      ) : articles.length === 0 && !apiKeyError ? (
          <div className="neu-brutal bg-newsmania-yellow text-black p-6 md:p-8 text-center">
            <AlertTriangle size={48} className="mx-auto mb-3" />
            <h2 className="text-2xl font-bold">No news articles found.</h2>
            <p className="mt-1">Try different search terms or filters!</p>
          </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article) => (
            <NewsArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}
      {/* Basic Pagination - Can be enhanced */}
      {/* Add pagination controls here if needed, styled with Neubrutalism */}
    </div>
  );
}
