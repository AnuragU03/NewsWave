
// config/apiConfig.ts
export const apiConfig = {
  news: {
    mediastack: {
      keys: [
        process.env.MEDIASTACK_KEY_1,
        process.env.MEDIASTACK_KEY_2,
        process.env.MEDIASTACK_KEY_3,
      ].filter(key => key && key !== "YOUR_MEDIASTACK_KEY_1" && key !== "YOUR_MEDIASTACK_KEY_2" && key !== "YOUR_MEDIASTACK_KEY_3") as string[],
      baseUrl: 'https://api.mediastack.com/v1',
      rateLimit: 1000, 
      priority: 1, 
    },
    guardian: {
      keys: [process.env.GUARDIAN_KEY_1].filter(key => key && key !== "YOUR_GUARDIAN_KEY_1") as string[],
      baseUrl: 'https://content.guardianapis.com',
      rateLimit: 5000, 
      priority: 2, 
    },
    gnews: {
      keys: [process.env.GNEWS_API_KEY].filter(key => key && key !== "YOUR_GNEWS_API_KEY") as string[],
      baseUrl: 'https://gnews.io/api/v4',
      rateLimit: 100, 
      priority: 3, 
    },
    newsdata: {
      keys: [process.env.NEWSDATA_API_KEY].filter(key => key && key !== "YOUR_NEWSDATA_API_KEY_HERE") as string[],
      baseUrl: 'https://newsdata.io/api/1',
      rateLimit: 500, 
      priority: 4, 
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
