"use client";

import { useState, useEffect } from 'react';
import NewsArticleCard, { type NewsArticle } from '@/components/news/news-article-card';
import Filters from '@/components/news/filters';
import { Skeleton } from '@/components/ui/skeleton';

const mockArticles: NewsArticle[] = [
  { id: '1', title: 'Groundbreaking AI discovers new exoplanet', summary: 'Scientists harness artificial intelligence to find a planet with Earth-like conditions in a distant solar system.', imageUrl: 'https://placehold.co/600x400.png', source: 'Tech Chronicle', category: 'Technology', country: 'USA', publishedAt: new Date(Date.now() - 3600000 * 2).toISOString(), url: '#', aiHint: 'planet space' },
  { id: '2', title: 'Global markets react to new trade agreement', summary: 'Stock exchanges worldwide show mixed reactions following the announcement of a major international trade deal.', imageUrl: 'https://placehold.co/600x400.png', source: 'Financial Times', category: 'Business', country: 'UK', publishedAt: new Date(Date.now() - 3600000 * 5).toISOString(), url: '#', aiHint: 'stock market' },
  { id: '3', title: 'Champions League Final: Underdogs Triumph', summary: 'In a stunning upset, the underdog team clinched the Champions League trophy after a dramatic penalty shootout.', imageUrl: 'https://placehold.co/600x400.png', source: 'Sports Today', category: 'Sports', country: 'Global', publishedAt: new Date(Date.now() - 3600000 * 1).toISOString(), url: '#', aiHint: 'soccer stadium' },
  { id: '4', title: 'Breakthrough in Cancer Research Announced', summary: 'A new study reveals a promising new therapy that targets cancer cells with unprecedented accuracy.', imageUrl: 'https://placehold.co/600x400.png', source: 'Health Journal', category: 'Health', country: 'Canada', publishedAt: new Date(Date.now() - 3600000 * 8).toISOString(), url: '#', aiHint: 'science lab' },
  { id: '5', title: 'New Art Exhibit Opens Downtown', summary: 'A captivating new exhibition featuring contemporary artists from around the world has opened at the city gallery.', imageUrl: 'https://placehold.co/600x400.png', source: 'City Arts', category: 'Entertainment', country: 'USA', publishedAt: new Date(Date.now() - 3600000 * 3).toISOString(), url: '#', aiHint: 'art gallery' },
  { id: '6', title: 'Exploring the Wonders of the Amazon', summary: 'A documentary team ventures deep into the Amazon rainforest, uncovering breathtaking biodiversity and ancient cultures.', imageUrl: 'https://placehold.co/600x400.png', source: 'Nature Explorer', category: 'Science', country: 'Brazil', publishedAt: new Date(Date.now() - 3600000 * 12).toISOString(), url: '#', aiHint: 'rainforest nature' },
];

const categories = ["Technology", "Business", "Sports", "Health", "Science", "Entertainment"];
const countries = ["USA", "UK", "Canada", "Global", "Brazil"];

export default function DashboardPage() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedCountry, setSelectedCountry] = useState('all');

  useEffect(() => {
    // Simulate API call
    setIsLoading(true);
    setTimeout(() => {
      let filteredArticles = mockArticles;
      if (selectedCategory !== 'all') {
        filteredArticles = filteredArticles.filter(article => article.category === selectedCategory);
      }
      if (selectedCountry !== 'all') {
        filteredArticles = filteredArticles.filter(article => article.country === selectedCountry);
      }
      setArticles(filteredArticles);
      setIsLoading(false);
    }, 1000);
  }, [selectedCategory, selectedCountry]);

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
      ) : articles.length === 0 ? (
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