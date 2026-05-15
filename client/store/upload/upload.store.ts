import { create } from "zustand";
import { UploadedDocument } from "@/types/upload";

interface UploadStore {
  documents: UploadedDocument[];
  loading: boolean;
  setDocuments: (docs: UploadedDocument[]) => void;
  addDocument: (doc: UploadedDocument) => void;
  setLoading: (value: boolean) => void;
}

export const useUploadStore = create<UploadStore>((set) => ({
  documents: [],
  loading: false,

  setDocuments: (docs) =>
    set({
      documents: docs,
    }),

  addDocument: (doc) =>
    set((state) => ({
      documents: [doc, ...state.documents],
    })),

  setLoading: (value) =>
    set({
      loading: value,
    }),
}));
