export interface RetrievedChunk {
  id: string;
  documentId?: string;
  text: string;
  documentName: string;
  chunkIndex: number;
  score: number;
  sectionTitle?: string;
  parentId?: string;
  parentText?: string;
  companyName?: string;
}

export interface RetrievalMemory {
  recentTopics: string[];
  currentCompany?: string;
}

export interface RetrievedTable {
  id: string;
  tableName: string;
  rows: unknown;
  score: number;
  documentId: string;
  documentName: string;
}
