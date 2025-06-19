
import { apiConfig } from '@/config/apiConfig';
import { ApiRotator } from '@/utils/apiRotator';

// This interface should be compatible with src/components/news/news-article-card.tsx NewsArticle
export interface Article {
  id: string;
  title: string;
  summary: string;
  imageUrl: string; // Ensure this is always a string, provide placeholder if null
  source: string;
  category: string; // The category it was requested for or determined
  country: string; // The country it was requested for or determined
  publishedAt: string;
  url: string;
  aiHint?: string;
  originalProvider?: string; // To know which API it came from
}

export interface NewsQueryParams {
  category?: string | null;
  country?: string | null;
  query?: string;
  page?: number;
  displayCategory: string; // For consistent UI display
  displayCountry: string;  // For consistent UI display
}

// NewsAPI.org specific interfaces
interface NewsApiArticle {
  source: { id: string | null; name: string };
  author: string | null;
  title: string;
  description: string | null;
  url: string;
  urlToImage: string | null;
  publishedAt: string; // ISO 8601 format
  content: string | null;
}

interface NewsApiResponse {
  status: string; // "ok" or "error"
  totalResults?: number;
  articles?: NewsApiArticle[];
  code?: string; // For errors
  message?: string; // For errors
}


export class NewsService {
  private apiRotator: ApiRotator;
  // private cache: RedisClient; // Placeholder for Redis caching

  constructor() {
    this.apiRotator = new ApiRotator();
    // this.cache = new RedisClient(...); // Initialize Redis client here
  }

  private generateAiHint(category: string, title: string): string {
    if (category && category.toLowerCase() !== 'general' && category.toLowerCase() !== 'top') {
      return category.toLowerCase();
    }
    const titleWords = title.split(' ').slice(0, 2);
    if (titleWords.length > 0) {
      return titleWords.join(' ').toLowerCase();
    }
    return "news media";
  }

  async fetchNews(params: NewsQueryParams): Promise<Article[]> {
    // Basic strategy: try NewsAPI.org first as per priority (simplified)
    // In a full implementation, iterate through configured sources based on priority
    // and key availability from ApiRotator.

    try {
      const newsApiArticles = await this.tryNewsApi(params);
      if (newsApiArticles.length > 0) {
        return newsApiArticles;
      }
    } catch (error) {
      console.error('Error fetching from NewsAPI.org:', error);
      // Fall through to try other APIs if configured, or rethrow/return empty
    }
    
    // try {
    //   const mediaStackArticles = await this.tryMediaStack(params);
    //   if (mediaStackArticles.length > 0) return mediaStackArticles;
    // } catch (error) {
    //   console.error('Error fetching from MediaStack:', error);
    // }

    // try {
    //   const guardianArticles = await this.tryGuardianApi(params);
    //   if (guardianArticles.length > 0) return guardianArticles;
    // } catch (error) {
    //   console.error('Error fetching from The Guardian:', error);
    // }

    console.warn('All news APIs failed or returned no articles.');
    return []; // Return empty if all fail
  }

  private async tryNewsApi(queryParams: NewsQueryParams): Promise<Article[]> {
    const newsApiSettings = apiConfig.news.newsapi;
    const apiKey = this.apiRotator.getNextAvailableKey('newsapi', newsApiSettings.keys);

    if (!apiKey) {
      console.error('No NewsAPI.org key available or configured.');
      // Optionally, you could throw an error that `fetchNewsArticles` can catch
      // and display to the user if NO keys are configured at all.
      // For now, returning empty allows fallback to other (future) providers.
      return [];
    }

    const params = new URLSearchParams({
      apiKey: apiKey,
    });

    if (queryParams.country) {
      params.append('country', queryParams.country);
    }
    if (queryParams.category && queryParams.category.toLowerCase() !== 'all' && queryParams.category.toLowerCase() !== 'general') {
      params.append('category', queryParams.category);
    }
    if (queryParams.query) {
      params.append('q', queryParams.query);
    }
    if (queryParams.page) {
      params.append('page', queryParams.page.toString());
    }
    // NewsAPI.org defaults to 'top-headlines' if no 'q' is present.
    // If 'category' or 'country' is specified, it uses 'top-headlines' endpoint.
    // If only 'q' is specified, it uses 'everything' endpoint.
    const endpoint = (queryParams.query) ? 'everything' : 'top-headlines';


    try {
      const response = await fetch(`${newsApiSettings.baseUrl}/${endpoint}?${params.toString()}`);
      const data: NewsApiResponse = await response.json();
      this.apiRotator.recordUsage('newsapi', apiKey);

      if (data.status === 'error') {
        console.error(`NewsAPI.org error: ${data.code} - ${data.message}`);
        if (data.code === 'apiKeyMissing' || data.code === 'apiKeyInvalid' || data.code === 'apiKeyDisabled' || data.code === 'keyInvalid') {
             throw new Error(`NewsAPI.org API key issue: ${data.message}. Please check your NEWSAPI_KEY_1/2 in .env.`);
        }
        return [];
      }
      
      if (!data.articles || data.articles.length === 0) {
        return [];
      }

      return data.articles.slice(0, 21).map((article, index) => ({
        id: article.url || `${article.source.name}_${index}`, // Ensure unique ID
        title: article.title || 'No title available',
        summary: article.description || article.content || 'No summary available',
        imageUrl: article.urlToImage || `https://placehold.co/600x400.png`, // Placeholder if null
        source: article.source.name || 'Unknown source',
        category: queryParams.displayCategory, // Use the display category passed in
        country: queryParams.displayCountry,   // Use the display country passed in
        publishedAt: article.publishedAt,
        url: article.url,
        aiHint: this.generateAiHint(queryParams.displayCategory, article.title || ""),
        originalProvider: 'newsapi.org',
      }));
    } catch (error) {
      console.error('Failed to fetch or parse from NewsAPI.org:', error);
      if (error instanceof Error && error.message.includes("API key issue")) {
        throw error; // Re-throw specific API key errors
      }
      return []; // Return empty on other errors to allow fallback
    }
  }

  // Stub for MediaStack
  private async tryMediaStack(params: NewsQueryParams): Promise<Article[]> {
    console.log('Attempting to fetch from MediaStack (stubbed)', params);
    // Implementation would be similar to tryNewsApi, using mediastack config
    return [];
  }

  // Stub for The Guardian
  private async tryGuardianApi(params: NewsQueryParams): Promise<Article[]> {
    console.log('Attempting to fetch from The Guardian (stubbed)', params);
    // Implementation would be similar, using guardian config
    return [];
  }

  async fetchLocalNews(location: string): Promise<Article[]> {
    console.log('Fetching local news for:', location, '(stubbed)');
    // This would likely involve using a geocoding service to get coordinates
    // or a region, then querying news APIs that support location-based search.
    // Example: queryParams.query = `news near ${location}`
    return this.fetchNews({ displayCategory: 'Local', displayCountry: location, query: `news in ${location}` });
  }

  async searchNews(query: string): Promise<Article[]> {
    console.log('Searching news for:', query, '(stubbed)');
    return this.fetchNews({ displayCategory: 'Search Results', displayCountry: 'Global', query });
  }

  async getNewsByCategory(category: string): Promise<Article[]> {
    console.log('Fetching news by category:', category, '(stubbed)');
    // Assuming 'category' here is the API-specific category string
    return this.fetchNews({ category, displayCategory: category, displayCountry: 'Global' });
  }
}
