
'use server';

import { NewsService, type Article, type NewsQueryParams } from '@/services/newsService';
import { prioritizeNews, type ArticleForAI, type PrioritizeNewsInput } from '@/ai/flows/prioritize-news-flow';

let newsServiceInstance: NewsService;

function getNewsServiceInstance() {
  if (!newsServiceInstance) {
    newsServiceInstance = new NewsService();
  }
  return newsServiceInstance;
}

export async function fetchNewsArticles(
  categoryQuery: string | null,
  countryQuery: string | null,
  displayCategory: string,
  displayCountry: string,
  userCategoryClicks?: Record<string, number> | null // Added user preferences
): Promise<Article[]> {
  const service = getNewsServiceInstance();
  const params: NewsQueryParams = {
    category: categoryQuery,
    country: countryQuery,
    displayCategory,
    displayCountry,
  };
  
  let fetchedArticles = await service.fetchNews(params);

  if (userCategoryClicks && fetchedArticles && fetchedArticles.length > 0 && Object.keys(userCategoryClicks).length > 0) {
    console.log("Attempting AI prioritization for news articles...");
    try {
      const articlesForAI: ArticleForAI[] = fetchedArticles.map(article => ({
        id: article.id,
        title: article.title,
        summary: article.summary,
        category: article.category, // Use the displayCategory which is more consistent for user profiling
        publishedAt: article.publishedAt,
      }));

      const aiInput: PrioritizeNewsInput = {
        articles: articlesForAI,
        userCategoryClicks: userCategoryClicks,
      };
      
      const prioritizationResult = await prioritizeNews(aiInput);
      
      if (prioritizationResult && prioritizationResult.prioritizedArticleIds && prioritizationResult.prioritizedArticleIds.length === fetchedArticles.length) {
        console.log("AI prioritization successful. Reasoning:", prioritizationResult.reasoning);
        const articleMap = new Map(fetchedArticles.map(article => [article.id, article]));
        const prioritizedArticles: Article[] = [];
        let allIdsFound = true;
        for (const id of prioritizationResult.prioritizedArticleIds) {
          const article = articleMap.get(id);
          if (article) {
            prioritizedArticles.push(article);
          } else {
            console.warn(`AI prioritization returned an ID not in original set: ${id}`);
            allIdsFound = false; // An ID from AI was not in the original list
            break; 
          }
        }
        if (allIdsFound && prioritizedArticles.length === fetchedArticles.length) {
            fetchedArticles = prioritizedArticles;
        } else {
            console.warn("AI prioritization result was incomplete or mismatched. Using original time-sorted articles.");
        }
      } else {
        console.warn("AI prioritization did not return a valid result. Using original time-sorted articles. Reasoning from AI:", prioritizationResult?.reasoning);
      }
    } catch (error) {
      console.error("Error during AI news prioritization:", error);
      // Fallback to time-sorted articles if AI prioritization fails
    }
  }

  return fetchedArticles;
}
