export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
}

export interface Source {
  sourceId: number;
  documentName?: string;
  text: string;
  sectionTitle?: string;
}