
// config/apiConfig.ts
export const apiConfig = {
  news: {
    newsdata: {
      keys: [
        process.env.NEWSDATA_API_KEY!,
      ].filter(key => key !== undefined && key !== "YOUR_NEWSDATA_API_KEY_HERE" && key.length > 20),
      baseUrl: 'https://newsdata.io/api/1',
      rateLimit: 500, // Example, adjust based on your plan (requests per day for free tier)
      priority: 1,
    },
    mediastack: {
      keys: [
        process.env.MEDIASTACK_KEY_1!,
        process.env.MEDIASTACK_KEY_2!,
        process.env.MEDIASTACK_KEY_3!,
      ].filter(key => key !== undefined && key !== "YOUR_MEDIASTACK_KEY_1" && key !== "YOUR_MEDIASTACK_KEY_2" && key !== "YOUR_MEDIASTACK_KEY_3"),
      baseUrl: 'https://api.mediastack.com/v1',
      rateLimit: 1000, // requests per month (check free tier, was 500/month)
      priority: 2,
    },
    guardian: { // Keeping Guardian as a potential future option or if you have a key
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
