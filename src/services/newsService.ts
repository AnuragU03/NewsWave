
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
  code?: string;
  message?: string;
}

// Mediastack specific interfaces
interface MediaStackArticle {
  author: string | null;
  title: string;
  description: string;
  url: string;
  source: string;
  image: string | null;
  category: string;
  language: string;
  country: string;
  published_at: string;
}

interface MediaStackResponse {
  pagination?: {
    limit: number;
    offset: number;
    count: number;
    total: number;
  };
  data?: MediaStackArticle[];
  error?: {
    code: string;
    message: string;
    context?: any;
  };
}

// GNews specific interfaces
interface GNewsArticle {
  title: string;
  description: string;
  content: string;
  url: string;
  image: string | null;
  publishedAt: string;
  source: {
    name: string;
    url: string;
  };
}

interface GNewsResponse {
  totalArticles?: number;
  articles?: GNewsArticle[];
  errors?: string[]; // GNews specific error reporting
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

  private sortArticlesByDate(articles: Article[]): Article[] {
    return articles.sort((a, b) => {
      const dateA = new Date(a.publishedAt);
      const dateB = new Date(b.publishedAt);

      if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) return 0;
      if (isNaN(dateA.getTime())) return 1; // a is invalid, b is valid, so b comes first (newer)
      if (isNaN(dateB.getTime())) return -1; // b is invalid, a is valid, so a comes first (newer)

      return dateB.getTime() - dateA.getTime(); // Sort descending (newest first)
    });
  }

  async fetchNews(params: NewsQueryParams): Promise<Article[]> {
    try {
      const newsDataArticles = await this.tryNewsData(params);
      if (newsDataArticles.length > 0) {
        return newsDataArticles; // Already sorted by tryNewsData
      }
      console.log('Newsdata.io returned no articles or failed, trying Mediastack...');
    } catch (error) {
      console.error('Error fetching from Newsdata.io:', error);
      if (error instanceof Error && (error.message.includes('API key') || error.message.includes('configured or available'))) {
          throw error;
      }
    }

    try {
      const mediaStackArticles = await this.tryMediaStack(params);
      if (mediaStackArticles.length > 0) {
        return mediaStackArticles; // Already sorted by tryMediaStack
      }
      console.log('Mediastack returned no articles or failed, trying GNews...');
    } catch (error) {
      console.error('Error fetching from Mediastack:', error);
       if (error instanceof Error && (error.message.includes('API key') || error.message.includes('configured or available'))) {
          throw error;
      }
    }

    try {
      const gnewsArticles = await this.tryGNews(params);
      if (gnewsArticles.length > 0) {
        return gnewsArticles; // Already sorted by tryGNews
      }
      console.log('GNews returned no articles or failed.');
    } catch (error) {
      console.error('Error fetching from GNews:', error);
       if (error instanceof Error && (error.message.includes('API key') || error.message.includes('configured or available'))) {
          throw error;
      }
    }

    console.warn('All news APIs (Newsdata.io, Mediastack, GNews) failed or returned no articles.');
    return [];
  }

  private async tryNewsData(queryParams: NewsQueryParams): Promise<Article[]> {
    const newsDataSettings = apiConfig.news.newsdata;
    if (!newsDataSettings) {
        throw new Error("Newsdata.io API configuration missing.");
    }
    const apiKey = this.apiRotator.getNextAvailableKey('newsdata', newsDataSettings.keys);

    if (!apiKey) {
      throw new Error('No Newsdata.io API key is configured or available. Please add NEWSDATA_API_KEY to your .env file.');
    }

    const params = new URLSearchParams({
      apikey: apiKey,
      image: '1',
      language: 'en',
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

        if (data.results && typeof data.results === 'object' && 'message' in (data.results as any) ) {
            errorMessage = `Newsdata.io API error: ${(data.results as { message: string }).message}`;
        } else if (data.message) {
            errorMessage = `Newsdata.io API error: ${data.message}`;
        } else if (data.code) {
             errorMessage = `Newsdata.io API error code: ${data.code}`;
        }
        console.error('Newsdata.io API request failed details:', errorMessage, data);
        if (errorMessage.toLowerCase().includes('api key') || errorMessage.toLowerCase().includes('apikey') || (data.code && data.code.toLowerCase().includes('unauthorized'))) {
            throw new Error(`Newsdata.io API key issue: ${errorMessage}. Please check NEWSDATA_API_KEY or your API plan.`);
        }
        console.warn(`Newsdata.io returned non-key error, allowing fallback: ${errorMessage}`);
        return [];
      }

      if (!data.results || data.results.length === 0) {
        return [];
      }

      const articles = data.results.slice(0, 21).map((article) => ({
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
      return this.sortArticlesByDate(articles);
    } catch (error) {
      console.error('Exception during Newsdata.io fetch or processing:', error);
      if (error instanceof Error && error.message.includes("API key issue")) {
        throw error;
      }
      // Do not re-throw general errors here to allow fallback
      return []; // Return empty array to allow fallback
    }
  }

  private async tryMediaStack(queryParams: NewsQueryParams): Promise<Article[]> {
    const mediaStackSettings = apiConfig.news.mediastack;
    if (!mediaStackSettings) {
        throw new Error("Mediastack API configuration missing.");
    }
    const apiKey = this.apiRotator.getNextAvailableKey('mediastack', mediaStackSettings.keys);

    if (!apiKey) {
      throw new Error('No Mediastack API key is configured or available. Please check MEDIASTACK_KEY_... in .env file.');
    }

    const params = new URLSearchParams({
      access_key: apiKey,
      limit: '25',
      languages: 'en',
      sort: 'published_desc', // Ask Mediastack to sort
    });

    if (queryParams.category && queryParams.category.toLowerCase() !== 'all' && queryParams.category.toLowerCase() !== 'general') {
      params.append('categories', queryParams.category.toLowerCase());
    } else if (queryParams.category?.toLowerCase() === 'general') {
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
        if (data.error.code.includes('api_key') || data.error.code.includes('access_key') || data.error.code.includes('subscription') || data.error.message.toLowerCase().includes('api key')) {
             throw new Error(`Mediastack API key issue: ${data.error.message}. Please check your MEDIASTACK_KEY_... in .env or your API plan limits.`);
        }
        console.warn(`Mediastack returned non-key error: ${data.error.message}`);
        return [];
      }

      if (!data.data || data.data.length === 0) {
        return [];
      }

      const articles = data.data.slice(0, 21).map((article, index) => ({
        id: article.url || `${article.source}_${index}_${new Date().getTime()}`,
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
      // Mediastack can sort with `published_desc`, but we sort again to be sure and consistent.
      return this.sortArticlesByDate(articles);
    } catch (error) {
      console.error('Exception during Mediastack fetch or processing:', error);
      if (error instanceof Error && error.message.includes("API key issue")) {
        throw error;
      }
      // Do not re-throw general errors here to allow fallback
      return []; // Return empty array to allow fallback
    }
  }

  private gnewsCategoryMap: { [key: string]: string } = {
    technology: "technology",
    business: "business",
    sports: "sports",
    health: "health",
    science: "science",
    entertainment: "entertainment",
    general: "general", // GNews uses 'general'
    politics: "nation", // GNews 'nation' can be a proxy for politics
    food: "general", // GNews doesn't have a specific food category
    travel: "general", // GNews doesn't have a specific travel category
  };

  private async tryGNews(queryParams: NewsQueryParams): Promise<Article[]> {
    const gnewsSettings = apiConfig.news.gnews;
    if (!gnewsSettings) {
      throw new Error("GNews API configuration missing.");
    }
    const apiKey = this.apiRotator.getNextAvailableKey('gnews', gnewsSettings.keys);

    if (!apiKey) {
      throw new Error('No GNews API key is configured or available. Please add GNEWS_API_KEY to your .env file.');
    }

    const params = new URLSearchParams({ token: apiKey, lang: 'en', max: '25', sortby: 'publishedAt' }); // Ask GNews to sort

    let endpoint = `${gnewsSettings.baseUrl}/top-headlines`;

    if (queryParams.query) {
      params.append('q', queryParams.query);
      endpoint = `${gnewsSettings.baseUrl}/search`;
    } else {
      if (queryParams.category && queryParams.category.toLowerCase() !== 'all') {
        const gnewsTopic = this.gnewsCategoryMap[queryParams.category.toLowerCase()] || 'general';
        params.append('topic', gnewsTopic);
      } else {
         params.append('topic', 'general');
      }

      if (queryParams.country && queryParams.country.toLowerCase() !== 'all' && queryParams.country.toLowerCase() !== 'global') {
        params.append('country', queryParams.country.toLowerCase());
      }
    }

    try {
      const response = await fetch(`${endpoint}?${params.toString()}`);
      const data: GNewsResponse = await response.json();
      this.apiRotator.recordUsage('gnews', apiKey);

      if (!response.ok || (data.errors && data.errors.length > 0)) {
        const errorMessage = data.errors ? data.errors.join(", ") : `GNews API error: Status ${response.status}`;
        console.error('GNews API request failed details:', errorMessage, data);
        if (errorMessage.toLowerCase().includes('api key') || errorMessage.toLowerCase().includes('token')) {
            throw new Error(`GNews API key issue: ${errorMessage}. Please check GNEWS_API_KEY or your API plan.`);
        }
        console.warn(`GNews returned non-key error, allowing fallback: ${errorMessage}`);
        return [];
      }

      if (!data.articles || data.articles.length === 0) {
        return [];
      }

      const articles = data.articles.slice(0, 21).map((article, index) => ({
        id: article.url || `${article.source.name}_${index}_${new Date().getTime()}`,
        title: article.title || 'No title available',
        summary: article.description || article.content || 'No summary available',
        imageUrl: article.image || `https://placehold.co/600x400.png`,
        source: article.source.name || 'Unknown source',
        category: queryParams.displayCategory,
        country: queryParams.displayCountry,
        publishedAt: article.publishedAt,
        url: article.url,
        aiHint: this.generateAiHint(queryParams.displayCategory, article.title || ""),
        originalProvider: 'gnews.io',
      }));
      // GNews can sort with `sortby=publishedAt`, but we sort again to be sure and consistent.
      return this.sortArticlesByDate(articles);
    } catch (error) {
      console.error('Exception during GNews fetch or processing:', error);
      if (error instanceof Error && error.message.includes("API key issue")) {
        throw error;
      }
      // Do not re-throw general errors here to allow fallback
      return []; // Return empty array to allow fallback
    }
  }


  private async tryGuardianApi(params: NewsQueryParams): Promise<Article[]> {
    const guardianSettings = apiConfig.news.guardian;
    if (!guardianSettings) {
        console.warn("Guardian API configuration missing.");
        return [];
    }
    const apiKey = this.apiRotator.getNextAvailableKey('guardian', guardianSettings.keys);
    if (!apiKey) {
      console.warn('No Guardian API key configured for tryGuardianApi. Add GUARDIAN_KEY_1 to .env');
      return [];
    }
    console.log('Attempting to fetch from The Guardian (stubbed)', params);
    // Actual implementation for The Guardian API would go here
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

