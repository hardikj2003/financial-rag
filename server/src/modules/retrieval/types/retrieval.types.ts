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
}

export interface ParentSection {
  parentId: string;
  parentText: string;
}
