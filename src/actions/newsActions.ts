
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
  queryOrCategory: string | null, // Can be a search query or a category
  countryQuery: string | null,
  displayCategory: string,
  displayCountry: string,
  userCategoryClicks?: Record<string, number> | null,
  isSearchQuery: boolean = false // Flag to distinguish search query from category
): Promise<Article[]> {
  const service = getNewsServiceInstance();
  
  const params: NewsQueryParams = {
    category: isSearchQuery ? null : queryOrCategory, // If it's a search, category might be null or derived differently
    query: isSearchQuery ? queryOrCategory : undefined, // If it's a search, this is the query term
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
        category: article.category,
        publishedAt: article.publishedAt,
      }));

      const aiInput: PrioritizeNewsInput = {
        articles: articlesForAI,
        userCategoryClicks: userCategoryClicks,
      };
      
      const prioritizationResult = await prioritizeNews(aiInput);
      
      if (prioritizationResult && prioritizationResult.prioritizedArticleIds && prioritizationResult.prioritizedArticleIds.length > 0) {
        console.log("AI prioritization successful. Reasoning:", prioritizationResult.reasoning);
        const articleMap = new Map(fetchedArticles.map(article => [article.id, article]));
        const prioritizedArticles: Article[] = [];
        let allIdsFound = true;

        for (const id of prioritizationResult.prioritizedArticleIds) {
          const article = articleMap.get(id);
          if (article) {
            prioritizedArticles.push(article);
          } else {
            // ID from AI not in original set, might happen if AI hallucinates or list changed
            // Add remaining original articles that weren't in AI's list to the end
            console.warn(`AI prioritization returned an ID not in original set: ${id}`);
          }
        }
        
        // Add any articles that were in the original fetch but not in AI's (valid) response
        // This ensures no articles are lost if AI returns a partial or mismatched list
        const aiReturnedIds = new Set(prioritizedArticles.map(a => a.id));
        fetchedArticles.forEach(originalArticle => {
            if (!aiReturnedIds.has(originalArticle.id)) {
                prioritizedArticles.push(originalArticle);
            }
        });


        if (prioritizedArticles.length === fetchedArticles.length) {
            fetchedArticles = prioritizedArticles;
        } else {
             console.warn("AI prioritization result length mismatched. Using original time-sorted articles and appending any missing if possible.");
             // Fallback to original, or if prioritizedArticles has some, use that and append missing ones
             // This logic ensures we don't lose articles if AI output is imperfect
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
