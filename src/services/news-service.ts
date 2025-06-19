
'use server';

import type { NewsArticle } from '@/components/news/news-article-card';

const API_BASE_URL = 'https://newsapi.org/v2/top-headlines';

interface NewsApiArticle {
  source: {
    id: string | null;
    name: string;
  };
  author: string | null;
  title: string;
  description: string | null;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  content: string | null;
}

interface NewsApiResponse {
  status: string;
  totalResults: number;
  articles: NewsApiArticle[];
  code?: string; // For error messages
  message?: string; // For error messages
}

// Helper to generate a simple aiHint from category or title
function generateAiHint(category: string, title: string): string {
  if (category && category.toLowerCase() !== 'general') {
    return category.toLowerCase();
  }
  // Fallback to first two words of title if short enough
  const titleWords = title.split(' ').slice(0, 2);
  if (titleWords.length > 0) {
    return titleWords.join(' ').toLowerCase();
  }
  return "news media"; // generic fallback
}


export async function fetchNews(
  categoryQuery: string | null,
  countryQuery: string | null,
  displayCategory: string, // Category for UI display
  displayCountry: string // Country for UI display
): Promise<NewsArticle[]> {
  const apiKey = process.env.NEWS_API_KEY;

  if (!apiKey || apiKey === "YOUR_NEWS_API_KEY_HERE") {
    console.error('News API key is missing or not configured.');
    throw new Error('News API key is not configured. Please add it to your .env file.');
  }

  const params = new URLSearchParams({
    apiKey: apiKey,
    pageSize: '21', // Fetch a bit more for variety
  });

  if (categoryQuery) {
    params.append('category', categoryQuery);
  }
  if (countryQuery) {
    params.append('country', countryQuery);
  }

  // If no specific category or country, default to general news in US (or API default)
  if (!categoryQuery && !countryQuery) {
    params.append('category', 'general'); 
  }


  try {
    const response = await fetch(`${API_BASE_URL}?${params.toString()}`);
    if (!response.ok) {
      const errorData: NewsApiResponse = await response.json();
      console.error('News API request failed:', response.status, errorData.message);
      throw new Error(`Failed to fetch news: ${errorData.message || response.statusText}`);
    }

    const data: NewsApiResponse = await response.json();

    if (data.status === 'error') {
      console.error('News API error:', data.message);
      throw new Error(`News API error: ${data.message}`);
    }
    
    return data.articles.map((article, index) => ({
      id: article.url || `${article.title}-${index}`, // Use URL as ID, or fallback
      title: article.title || 'No title available',
      summary: article.description || article.content || 'No summary available',
      imageUrl: article.urlToImage || `https://placehold.co/600x400.png`,
      source: article.source.name || 'Unknown source',
      category: displayCategory, // Use the category name passed for display
      country: displayCountry, // Use the country name passed for display
      publishedAt: article.publishedAt,
      url: article.url,
      aiHint: generateAiHint(displayCategory, article.title || ""),
    }));
  } catch (error) {
    console.error('Error fetching news:', error);
    // In case of error, return an empty array or rethrow as per requirement
    // For now, rethrowing to let the UI handle it.
    if (error instanceof Error) {
        throw error;
    }
    throw new Error('An unknown error occurred while fetching news.');
  }
}
