const serviceConfig = {
    gemini: {
      'gemini-flash-1.5': {
        // Gemini-specific configuration for gemini-flash-1.5
        apiUrl: 'https://api.gemini.com/flash-1.5',
      },
      // Add other Gemini models here
    },
    azure: {
      'gpt-4o': {
        // Azure-specific configuration for gpt-4o
        apiUrl: 'https://api.azure.com/gpt-4o',
      },
      // Add other Azure models here
    },
  };
  
  export default serviceConfig;
  