
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
  verified?: boolean; // Added for verified news feature
}

export interface NewsQueryParams {
  category?: string | null;
  country?: string | null;
  query?: string;
  page?: number; // For pagination if supported by API
  displayCategory: string; // For consistent UI display
  displayCountry: string;  // For consistent UI display
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

// The Guardian specific interfaces
interface GuardianArticle {
  id: string; // e.g., "technology/2023/oct/26/smartphones-apple-google-features"
  type: string; // e.g., "article"
  sectionId: string; // e.g., "technology"
  sectionName: string; // e.g., "Technology"
  webPublicationDate: string; // ISO date string e.g., "2023-10-26T10:00:00Z"
  webTitle: string;
  webUrl: string;
  apiUrl: string;
  fields?: {
    trailText?: string; // This is often the summary
    thumbnail?: string; // URL to an image
  };
  tags?: Array<{ id: string; type: string; webTitle: string; webUrl: string; apiUrl: string }>;
}

interface GuardianResponse {
  response: {
    status: string; // "ok" or "error"
    userTier: string;
    total: number;
    startIndex: number;
    pageSize: number;
    currentPage: number;
    pages: number;
    orderBy: string;
    results: GuardianArticle[];
    message?: string; // For errors
  };
}


// GNews specific interfaces
interface GNewsArticle {
  title: string;
  description: string;
  content: string;
  url: string;
  image: string | null;
  publishedAt: string; // ISO date string e.g. "2024-06-18T16:15:00Z"
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
  pubDate: string; // "2023-05-20 09:00:00"
  image_url: string | null;
  source_id: string;
  country: string[]; // countries article is relevant to
  category: string[]; // categories of the article
  language: string;
}

interface NewsDataIOResponse {
  status: string; // "success" or "error"
  totalResults?: number;
  results?: NewsDataIOResult[];
  nextPage?: string;
  // For errors:
  code?: string;
  message?: string;
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
      // Prioritize articles with valid dates
      const dateAValid = a.publishedAt && !isNaN(new Date(a.publishedAt).getTime());
      const dateBValid = b.publishedAt && !isNaN(new Date(b.publishedAt).getTime());

      if (dateAValid && !dateBValid) return -1; // a is valid, b is not, a comes first
      if (!dateAValid && dateBValid) return 1;  // b is valid, a is not, b comes first
      if (!dateAValid && !dateBValid) return 0; // neither is valid, order doesn't change relative to each other

      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });
  }

  async fetchNews(params: NewsQueryParams): Promise<Article[]> {
    try {
      const mediaStackArticles = await this.tryMediaStack(params);
      if (mediaStackArticles.length > 0) return mediaStackArticles;
    } catch (error) {
      console.error('Error fetching from Mediastack:', error);
      if (error instanceof Error && (error.message.includes('API key') || error.message.includes('access_key') || error.message.includes('configured or available'))) {
          throw error; // Rethrow critical API key errors
      }
    }

    try {
      const guardianArticles = await this.tryGuardianApi(params);
      if (guardianArticles.length > 0) return guardianArticles;
    } catch (error) {
      console.error('Error fetching from The Guardian:', error);
      if (error instanceof Error && (error.message.includes('API key') || error.message.includes('configured or available'))) {
          throw error;
      }
    }

    try {
      const gnewsArticles = await this.tryGNews(params);
      if (gnewsArticles.length > 0) return gnewsArticles;
    } catch (error) {
      console.error('Error fetching from GNews:', error);
       if (error instanceof Error && (error.message.includes('API key') || error.message.includes('token') || error.message.includes('configured or available'))) {
          throw error;
      }
    }
    
    try {
      const newsDataArticles = await this.tryNewsData(params);
      if (newsDataArticles.length > 0) return newsDataArticles;
    } catch (error) {
      console.error('Error fetching from Newsdata.io:', error);
      if (error instanceof Error && (error.message.includes('API key') || error.message.includes('apikey') || error.message.includes('configured or available'))) {
          throw error;
      }
    }

    console.warn('All news APIs (Mediastack, Guardian, GNews, Newsdata.io) failed or returned no articles.');
    return [];
  }

  private async tryMediaStack(queryParams: NewsQueryParams): Promise<Article[]> {
    const mediaStackSettings = apiConfig.news.mediastack;
    if (!mediaStackSettings) throw new Error("Mediastack API configuration missing.");
    
    const apiKey = this.apiRotator.getNextAvailableKey('mediastack', mediaStackSettings.keys);
    if (!apiKey) throw new Error('No Mediastack API key is configured or available. Please check MEDIASTACK_KEY_... in .env file.');

    const params = new URLSearchParams({
      access_key: apiKey,
      limit: '25', 
      languages: 'en', 
      sort: 'published_desc',
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
    
    const offset = queryParams.page && queryParams.page > 1 ? (queryParams.page - 1) * 25 : 0;
    if (offset > 0) {
        params.append('offset', offset.toString());
    }


    try {
      const response = await fetch(`${mediaStackSettings.baseUrl}/news?${params.toString()}`);
      const data: MediaStackResponse = await response.json();
      this.apiRotator.recordUsage('mediastack', apiKey);

      if (data.error) {
        const errorMsg = `Mediastack API error: ${data.error.code} - ${data.error.message}`;
        console.error(errorMsg, data.error.context);
        if (data.error.code.includes('api_key') || data.error.code.includes('access_key') || data.error.code.includes('subscription') || data.error.message.toLowerCase().includes('api key') || data.error.code === 'missing_access_key') {
             throw new Error(`Mediastack API key issue: ${data.error.message}. Please check your MEDIASTACK_KEY_... in .env or your API plan limits.`);
        }
        return []; 
      }

      if (!data.data || data.data.length === 0) return [];

      const articles: Article[] = data.data.slice(0, 21).map((article, index) => ({
        id: article.url || `${article.source}_${index}_${new Date().getTime()}`,
        title: article.title || 'No title available',
        summary: article.description || 'No summary available',
        imageUrl: article.image || `https://placehold.co/600x400.png`,
        source: article.source || 'Unknown Source',
        category: queryParams.displayCategory, 
        country: queryParams.displayCountry,  
        publishedAt: article.published_at,
        url: article.url,
        aiHint: this.generateAiHint(queryParams.displayCategory, article.title || ""),
        originalProvider: 'mediastack.com',
        verified: Math.random() < 0.3, // Simulate verification
      }));
      return this.sortArticlesByDate(articles);
    } catch (error) {
        console.error('Exception during Mediastack fetch or processing:', error);
        if (error instanceof Error && error.message.includes("API key issue")) {
            throw error; 
        }
        return []; 
    }
  }
  
  private guardianCategoryMap: { [key: string]: string } = {
    technology: "technology",
    business: "business",
    sports: "sport", 
    health: "lifeandstyle/health-and-wellbeing", 
    science: "science",
    entertainment: "film", 
    politics: "politics",
    general: "world", 
  };

  private async tryGuardianApi(queryParams: NewsQueryParams): Promise<Article[]> {
    const guardianSettings = apiConfig.news.guardian;
    if (!guardianSettings) throw new Error("The Guardian API configuration missing.");

    const apiKey = this.apiRotator.getNextAvailableKey('guardian', guardianSettings.keys);
    if (!apiKey) throw new Error('No The Guardian API key is configured or available. Please check GUARDIAN_KEY_1 in .env file.');

    const params = new URLSearchParams({
      'api-key': apiKey,
      'show-fields': 'trailText,thumbnail,publication', 
      'page-size': '25', 
      'order-by': 'newest',
    });

    if (queryParams.query) {
      params.append('q', queryParams.query);
    } else if (queryParams.category && queryParams.category.toLowerCase() !== 'all' && queryParams.category.toLowerCase() !== 'global') {
      const guardianSection = this.guardianCategoryMap[queryParams.category.toLowerCase()] || queryParams.category.toLowerCase();
      params.append('section', guardianSection);
    }
    
    if (queryParams.page && queryParams.page > 1) {
        params.append('page', queryParams.page.toString());
    }

    try {
      const response = await fetch(`${guardianSettings.baseUrl}/search?${params.toString()}`);
      const data: GuardianResponse = await response.json();
      this.apiRotator.recordUsage('guardian', apiKey);

      if (data.response.status !== 'ok' || !data.response.results) {
        const errorMsg = `The Guardian API error: ${data.response.message || data.response.status}`;
        console.error(errorMsg, data);
        if (data.response.message?.toLowerCase().includes('key')) {
             throw new Error(`The Guardian API key issue: ${data.response.message}. Please check GUARDIAN_KEY_1 or your API plan.`);
        }
        return [];
      }

      if (data.response.results.length === 0) return [];

      const articles: Article[] = data.response.results.slice(0, 21).map(article => ({
        id: article.id,
        title: article.webTitle || 'No title available',
        summary: article.fields?.trailText || 'No summary available',
        imageUrl: article.fields?.thumbnail || `https://placehold.co/600x400.png`,
        source: article.sectionName || 'The Guardian',
        category: queryParams.displayCategory,
        country: queryParams.displayCountry,
        publishedAt: article.webPublicationDate,
        url: article.webUrl,
        aiHint: this.generateAiHint(queryParams.displayCategory, article.webTitle || ""),
        originalProvider: 'theguardian.com',
        verified: Math.random() < 0.3, // Simulate verification
      }));
      return this.sortArticlesByDate(articles);
    } catch (error) {
        console.error('Exception during The Guardian fetch or processing:', error);
         if (error instanceof Error && error.message.includes("API key issue")) {
            throw error;
        }
        return [];
    }
  }


  private gnewsCategoryMap: { [key: string]: string } = {
    technology: "technology",
    business: "business",
    sports: "sports",
    health: "health",
    science: "science",
    entertainment: "entertainment",
    general: "general",
    politics: "nation", 
    food: "general",
    travel: "general",
  };

  private async tryGNews(queryParams: NewsQueryParams): Promise<Article[]> {
    const gnewsSettings = apiConfig.news.gnews;
    if (!gnewsSettings) throw new Error("GNews API configuration missing.");
    
    const apiKey = this.apiRotator.getNextAvailableKey('gnews', gnewsSettings.keys);
    if (!apiKey) throw new Error('No GNews API key is configured or available. Please add GNEWS_API_KEY to your .env file.');

    const params = new URLSearchParams({ token: apiKey, lang: 'en', max: '25', sortby: 'publishedAt' });

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
        if (errorMessage.toLowerCase().includes('api key') || errorMessage.toLowerCase().includes('token') || response.status === 401 || response.status === 403) {
            throw new Error(`GNews API key issue: ${errorMessage}. Please check GNEWS_API_KEY or your API plan.`);
        }
        return [];
      }

      if (!data.articles || data.articles.length === 0) return [];

      const articles: Article[] = data.articles.slice(0, 21).map((article, index) => ({
        id: article.url || `${article.source.name}_${index}_${new Date().getTime()}`,
        title: article.title || 'No title available',
        summary: article.description || article.content || 'No summary available',
        imageUrl: article.image || `https://placehold.co/600x400.png`,
        source: article.source.name || 'Unknown Source',
        category: queryParams.displayCategory,
        country: queryParams.displayCountry,
        publishedAt: article.publishedAt,
        url: article.url,
        aiHint: this.generateAiHint(queryParams.displayCategory, article.title || ""),
        originalProvider: 'gnews.io',
        verified: Math.random() < 0.3, // Simulate verification
      }));
      return this.sortArticlesByDate(articles);
    } catch (error) {
      console.error('Exception during GNews fetch or processing:', error);
       if (error instanceof Error && error.message.includes("API key issue")) {
            throw error;
        }
      return [];
    }
  }
  
  private async tryNewsData(queryParams: NewsQueryParams): Promise<Article[]> {
    const newsDataSettings = apiConfig.news.newsdata;
    if (!newsDataSettings) throw new Error("Newsdata.io API configuration missing.");
    
    const apiKey = this.apiRotator.getNextAvailableKey('newsdata', newsDataSettings.keys);
    if (!apiKey) throw new Error('No Newsdata.io API key is configured or available. Please add NEWSDATA_API_KEY to your .env file.');

    const params = new URLSearchParams({
      apikey: apiKey,
      image: '1', 
      language: 'en', 
    });
    
    let newsdataCategoryParam = queryParams.category?.toLowerCase();
    if (newsdataCategoryParam === 'general' || newsdataCategoryParam === 'all' || !newsdataCategoryParam ) {
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
        return [];
      }

      if (!data.results || data.results.length === 0) return [];

      const articles: Article[] = data.results.slice(0, 21).map((article) => ({
        id: article.article_id || article.link,
        title: article.title || 'No title available',
        summary: article.description || article.content || 'No summary available',
        imageUrl: article.image_url || `https://placehold.co/600x400.png`,
        source: article.source_id || 'Unknown Source',
        category: queryParams.displayCategory,
        country: queryParams.displayCountry,
        publishedAt: article.pubDate, 
        url: article.link,
        aiHint: this.generateAiHint(queryParams.displayCategory, article.title || ""),
        originalProvider: 'newsdata.io',
        verified: Math.random() < 0.3, // Simulate verification
      }));
      return this.sortArticlesByDate(articles);
    } catch (error) {
      console.error('Exception during Newsdata.io fetch or processing:', error);
      if (error instanceof Error && error.message.includes("API key issue")) {
            throw error;
      }
      return [];
    }
  }

  async fetchLocalNews(location: string): Promise<Article[]> {
    console.log('Fetching local news for:', location);
    return this.fetchNews({ displayCategory: `Local: ${location}`, displayCountry: location, query: `news in ${location}` });
  }

  async searchNews(query: string): Promise<Article[]> {
    console.log('Searching news for:', query);
    return this.fetchNews({ displayCategory: `Search: ${query.substring(0,15)}...`, displayCountry: 'Global', query });
  }

  async getNewsByCategory(category: string): Promise<Article[]> {
    console.log('Fetching news by category:', category);
    return this.fetchNews({ category, displayCategory: category, displayCountry: 'Global' });
  }
}
