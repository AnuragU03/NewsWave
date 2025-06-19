
// config/apiConfig.ts
export const apiConfig = {
  news: {
    mediastack: {
      keys: [
        process.env.MEDIASTACK_KEY_1!,
        process.env.MEDIASTACK_KEY_2!,
        process.env.MEDIASTACK_KEY_3!,
      ].filter(key => key !== undefined && key !== "YOUR_MEDIASTACK_KEY_1" && key !== "YOUR_MEDIASTACK_KEY_2" && key !== "YOUR_MEDIASTACK_KEY_3"), // Filter out placeholder/undefined keys
      baseUrl: 'https://api.mediastack.com/v1',
      rateLimit: 1000, // requests per month
      priority: 1,
    },
    newsapi: {
      keys: [
        process.env.NEWSAPI_KEY_1!,
        process.env.NEWSAPI_KEY_2!,
      ].filter(key => key !== undefined && key !== "YOUR_NEWSAPI_KEY_1" && key !== "YOUR_NEWSAPI_KEY_2"),
      baseUrl: 'https://newsapi.org/v2',
      rateLimit: 500, // requests per day
      priority: 2,
    },
    guardian: {
      keys: [process.env.GUARDIAN_KEY_1!].filter(key => key !== undefined && key !== "YOUR_GUARDIAN_KEY_1"),
      baseUrl: 'https://content.guardianapis.com',
      rateLimit: 5000, // requests per day
      priority: 3,
    },
  },
  ai: {
    openai: {
      key: process.env.OPENAI_API_KEY!,
      model: 'gpt-4',
      maxTokens: 150,
    },
    anthropic: {
      key: process.env.ANTHROPIC_API_KEY!,
      model: 'claude-3-sonnet-20240229',
    },
  },
  search: {
    google: {
      key: process.env.GOOGLE_SEARCH_KEY!,
      cx: process.env.GOOGLE_SEARCH_CX!,
    },
    bing: {
      key: process.env.BING_SEARCH_KEY!,
    },
  },
  location: {
    google: {
      key: process.env.GOOGLE_PLACES_KEY!,
    },
  },
};
