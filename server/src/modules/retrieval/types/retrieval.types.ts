export interface RetrievedChunk {
  id?: string;
  text: string;
  documentName: string;
  chunkIndex: number;
  score: number;
  sectionTitle?: string;
  metadata?: Record<string, any>;
  parentId?: string;
  parentText?: string;
  companyName?: string;
}

export interface ParentSection {
  parentId: string;
  parentText: string;
}

export interface RetrievalMemory {
  recentTopics: string[];
  recentDocuments: string[];
  recentSections: string[];
  currentCompany?: string;
}
export interface RetrievedTable {
  id: string;
  tableName?: string;
  rows: any;
  score: number;
  documentId: string;
}