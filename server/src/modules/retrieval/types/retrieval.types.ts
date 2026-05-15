export interface RetrievedChunk {
  id?: string;
  text: string;
  documentName: string;
  chunkIndex: number;
  score: number;
  metadata?: Record<string, any>;
}
