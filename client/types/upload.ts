export interface UploadedDocument {
  id: string;
  fileName: string;
  uploadedAt?: string;
  createdAt?: string;
  chunksStored: number;
}
