// Placeholder for pageToolConfigService
// All actual page tool config logic has been removed as part of project slimming.
// This file exists to prevent compilation errors from other modules that still import it.

export interface PageToolConfig {
  id: string;
  pageType: string;
  [key: string]: any;
}

export const pageToolConfigService = {
  getByPageType: async (pageType: string): Promise<PageToolConfig | null> => {
    console.warn('pageToolConfigService.getByPageType called, but page tool config functionality is removed.', { pageType });
    return null;
  },
};

export default pageToolConfigService;

