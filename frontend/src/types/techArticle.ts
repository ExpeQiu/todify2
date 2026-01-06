export interface ArticleVersion {
  title: string;
  lead?: string;
  body: ArticleBody;
  conclusion?: string;
}

export interface ArticleBody {
  techBackground?: string;
  coreFeatures?: string;
  techAdvantages?: string;
  applicationScenarios?: string;
  marketSignificance?: string;
  data_support?: string;
  competitive_analysis?: string;
}

export interface SocialMediaVersion {
  title: string;
  highlights: string[];
  hashtags: string[];
}

export interface SourceReference {
  type: 'conversation' | 'output';
  id: string;
  pageType: string;
  title: string;
  summary: string;
}

export interface MultiVersionArticle {
  mediaRelease?: ArticleVersion;
  internalMemo?: ArticleVersion;
  socialMedia?: SocialMediaVersion;
  sourceReferences: SourceReference[];
  metadata: {
    generatedAt: string;
    workflowId?: string;
    tokenUsage?: {
      prompt: number;
      completion: number;
      total: number;
    };
  };
}

