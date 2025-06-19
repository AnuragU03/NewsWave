
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

// Newsdata.io specific interfaces
interface NewsDataIOResult {
  article_id: string;
  title: string;
  link: string;
  keywords: string[] | null;
  creator: string[] | null;
  video_url: string | null;
  description: string | null;
  content: string | null;
  pubDate: string;
  image_url: string | null;
  source_id: string;
  country: string[];
  category: string[];
  language: string;
}

interface NewsDataIOResponse {
  status: string;
  totalResults?: number;
  results?: NewsDataIOResult[];
  nextPage?: string;
  code?: string; // For errors (sometimes in results object)
  message?: string; // For errors (sometimes in results object)
}

// Mediastack specific interfaces
interface MediaStackArticle {
  author: string | null;
  title: string;
  description: string;
  url: string;
  source: string; // Source name
  image: string | null;
  category: string;
  language: string;
  country: string; // 2-letter ISO code
  published_at: string; // ISO 8601 format
}

interface MediaStackResponse {
  pagination?: {
    limit: number;
    offset: number;
    count: number;
    total: number;
  };
  data?: MediaStackArticle[];
  // For errors, Mediastack might return a different structure
  error?: {
    code: string;
    message: string;
    context?: any;
  };
}


export class NewsService {
  private apiRotator: ApiRotator;

  constructor() {
    this.apiRotator = new ApiRotator();
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
    try {
      const newsDataArticles = await this.tryNewsData(params);
      if (newsDataArticles.length > 0) {
        return newsDataArticles;
      }
      console.log('Newsdata.io returned no articles or failed, trying Mediastack...');
    } catch (error) {
      console.error('Error fetching from Newsdata.io:', error);
      if (error instanceof Error && (error.message.includes('API key') || error.message.includes('configured or available'))) {
          // If it's an API key issue from Newsdata, we might not want to immediately try another,
          // or we might want to throw this error to the user directly.
          // For now, let's log and proceed to try Mediastack.
      }
    }
    
    try {
      const mediaStackArticles = await this.tryMediaStack(params);
      if (mediaStackArticles.length > 0) {
        return mediaStackArticles;
      }
      console.log('Mediastack returned no articles or failed.');
    } catch (error) {
      console.error('Error fetching from Mediastack:', error);
       if (error instanceof Error && (error.message.includes('API key') || error.message.includes('configured or available'))) {
          throw error; // Re-throw Mediastack API key issues to be displayed.
      }
    }

    console.warn('All primary news APIs (Newsdata.io, Mediastack) failed or returned no articles.');
    // If we reached here and no specific API key error was thrown for the *last* attempted API,
    // it means APIs might be down or returning empty.
    // Throw a generic error or return empty based on desired behavior.
    return []; 
  }

  private async tryNewsData(queryParams: NewsQueryParams): Promise<Article[]> {
    const newsDataSettings = apiConfig.news.newsdata;
    const apiKey = this.apiRotator.getNextAvailableKey('newsdata', newsDataSettings.keys);

    if (!apiKey) {
      throw new Error('No Newsdata.io API key is configured or available. Please add NEWSDATA_API_KEY to your .env file.');
    }

    const params = new URLSearchParams({
      apikey: apiKey,
      image: '1',
      language: 'en', // Limiting to English for now
    });

    let newsdataCategoryParam = queryParams.category?.toLowerCase();
    if (newsdataCategoryParam === 'general' || newsdataCategoryParam === 'all' || !newsdataCategoryParam) {
      newsdataCategoryParam = 'top';
    }
    params.append('category', newsdataCategoryParam);

    if (queryParams.country && queryParams.country.toLowerCase() !== 'all' && queryParams.country.toLowerCase() !== 'global') {
      params.append('country', queryParams.country.toLowerCase());
    }
    if (queryParams.query) {
      params.append('q', queryParams.query);
    }
    
    try {
      const response = await fetch(`${newsDataSettings.baseUrl}/news?${params.toString()}`);
      const data: NewsDataIOResponse = await response.json();
      this.apiRotator.recordUsage('newsdata', apiKey);

      if (!response.ok || data.status === 'error') {
        let errorMessage = `Newsdata.io API error: Status ${response.status}.`;
        // Newsdata.io error structure can vary
        if (data.results && typeof data.results === 'object' && 'message' in (data.results as any) ) {
            errorMessage = `Newsdata.io API error: ${(data.results as { message: string }).message}`;
        } else if (data.message) {
            errorMessage = `Newsdata.io API error: ${data.message}`;
        } else if (data.code) {
             errorMessage = `Newsdata.io API error code: ${data.code}`;
        }
        console.error('Newsdata.io API request failed:', errorMessage, data);
        if (errorMessage.toLowerCase().includes('api key') || errorMessage.toLowerCase().includes('apikey')) {
            throw new Error(`Newsdata.io API key issue: ${errorMessage}. Please check NEWSDATA_API_KEY or your API plan.`);
        }
        return []; // For other errors, return empty to allow fallback
      }
      
      if (!data.results || data.results.length === 0) {
        return [];
      }

      return data.results.slice(0, 21).map((article) => ({
        id: article.article_id || article.link,
        title: article.title || 'No title available',
        summary: article.description || article.content || 'No summary available',
        imageUrl: article.image_url || `https://placehold.co/600x400.png`,
        source: article.source_id || 'Unknown source',
        category: queryParams.displayCategory, 
        country: queryParams.displayCountry, 
        publishedAt: article.pubDate,
        url: article.link,
        aiHint: this.generateAiHint(queryParams.displayCategory, article.title || ""),
        originalProvider: 'newsdata.io',
      }));
    } catch (error) {
      console.error('Failed to fetch or parse from Newsdata.io:', error);
      if (error instanceof Error && error.message.includes("API key issue")) {
        throw error;
      }
      return []; 
    }
  }

  private async tryMediaStack(queryParams: NewsQueryParams): Promise<Article[]> {
    const mediaStackSettings = apiConfig.news.mediastack;
    const apiKey = this.apiRotator.getNextAvailableKey('mediastack', mediaStackSettings.keys);

    if (!apiKey) {
      // Don't throw here if NewsData was already tried. Let fetchNews handle the "all failed" scenario.
      // If Mediastack is the *only* one configured, then throwing would be appropriate.
      // For now, assume it's a fallback.
      console.warn('No Mediastack API key is configured or available.');
      return [];
    }

    const params = new URLSearchParams({
      access_key: apiKey,
      limit: '25', // Fetch a bit more to filter down to 21 if needed
      languages: 'en', // Limiting to English
    });

    if (queryParams.category && queryParams.category.toLowerCase() !== 'all' && queryParams.category.toLowerCase() !== 'general') {
      params.append('categories', queryParams.category.toLowerCase());
    } else if (queryParams.category?.toLowerCase() === 'general') {
       // Mediastack uses 'general' for its main category. If 'all', don't specify category to get general.
       params.append('categories', 'general');
    }


    if (queryParams.country && queryParams.country.toLowerCase() !== 'all' && queryParams.country.toLowerCase() !== 'global') {
      params.append('countries', queryParams.country.toLowerCase());
    }
    if (queryParams.query) {
      params.append('keywords', queryParams.query);
    }
    
    try {
      const response = await fetch(`${mediaStackSettings.baseUrl}/news?${params.toString()}`);
      const data: MediaStackResponse = await response.json();
      this.apiRotator.recordUsage('mediastack', apiKey);

      if (data.error) {
        console.error(`Mediastack API error: ${data.error.code} - ${data.error.message}`);
        if (data.error.code.includes('api_key') || data.error.code.includes('access_key') || data.error.code.includes('subscription')) {
             throw new Error(`Mediastack API key issue: ${data.error.message}. Please check your MEDIASTACK_KEY_... in .env or your API plan limits.`);
        }
        return [];
      }
      
      if (!data.data || data.data.length === 0) {
        return [];
      }

      return data.data.slice(0, 21).map((article, index) => ({
        id: article.url || `${article.source}_${index}`,
        title: article.title || 'No title available',
        summary: article.description || 'No summary available',
        imageUrl: article.image || `https://placehold.co/600x400.png`,
        source: article.source || 'Unknown source',
        category: queryParams.displayCategory,
        country: queryParams.displayCountry,
        publishedAt: article.published_at,
        url: article.url,
        aiHint: this.generateAiHint(queryParams.displayCategory, article.title || ""),
        originalProvider: 'mediastack.com',
      }));
    } catch (error) {
      console.error('Failed to fetch or parse from Mediastack:', error);
      if (error instanceof Error && error.message.includes("API key issue")) {
        throw error;
      }
      return []; 
    }
  }

  // Stub for The Guardian - can be implemented if Guardian key is provided
  private async tryGuardianApi(params: NewsQueryParams): Promise<Article[]> {
    const guardianSettings = apiConfig.news.guardian;
    const apiKey = this.apiRotator.getNextAvailableKey('guardian', guardianSettings.keys);
    if (!apiKey) {
      console.warn('No Guardian API key configured for tryGuardianApi.');
      return [];
    }
    console.log('Attempting to fetch from The Guardian (stubbed)', params);
    // Implementation would be similar, using guardian config
    return [];
  }


  async fetchLocalNews(location: string): Promise<Article[]> {
    console.log('Fetching local news for:', location, '(stubbed)');
    return this.fetchNews({ displayCategory: 'Local', displayCountry: location, query: `news in ${location}` });
  }

  async searchNews(query: string): Promise<Article[]> {
    console.log('Searching news for:', query, '(stubbed)');
    return this.fetchNews({ displayCategory: 'Search Results', displayCountry: 'Global', query });
  }

  async getNewsByCategory(category: string): Promise<Article[]> {
    console.log('Fetching news by category:', category, '(stubbed)');
    return this.fetchNews({ category, displayCategory: category, displayCountry: 'Global' });
  }
}
