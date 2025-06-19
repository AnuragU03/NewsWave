
'use server';

import { NewsService, type Article, type NewsQueryParams } from '@/services/newsService';

// It's often better to instantiate services per request or use a singleton pattern carefully,
// especially if they hold request-specific state or manage resources like DB connections.
// For ApiRotator with in-memory state, a singleton instance might be fine for demo purposes.
// In a serverless environment, this instance would be recreated per invocation.
let newsServiceInstance: NewsService;

function getNewsServiceInstance() {
  if (!newsServiceInstance) {
    newsServiceInstance = new NewsService();
  }
  return newsServiceInstance;
}

export async function fetchNewsArticles(
  categoryQuery: string | null, // e.g., "technology", "sports", "general"
  countryQuery: string | null, // e.g., "us", "gb", or null for global
  displayCategory: string, // Category for UI display
  displayCountry: string // Country for UI display
): Promise<Article[]> {
  const service = getNewsServiceInstance();
  const params: NewsQueryParams = {
    category: categoryQuery,
    country: countryQuery,
    displayCategory,
    displayCountry,
  };
  return service.fetchNews(params);
}

// Example of another action, if needed in the future
// export async function searchNewsArticles(query: string): Promise<Article[]> {
//   const service = getNewsServiceInstance();
//   return service.searchNews(query);
// }
