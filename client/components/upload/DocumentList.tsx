"use client";

import { useEffect, useState } from "react";
import DocumentCard from "./DocumentCard";
import { UploadedDocument } from "@/types/upload";
import api from "@/services/api/api";
import Skeleton from "../ui/Skeleton";

interface Props {
  refreshKey?: number;
}
export default function DocumentList({ refreshKey }: Props) {
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDocuments();
  }, [refreshKey]);

  const fetchDocuments = async () => {
    try {
      const response = await api.get("/documents");

      setDocuments(response.data?.documents || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-3xl border border-slate-200 bg-white p-5"
          >
            <div className="flex gap-4">
              <Skeleton className="h-12 w-12 rounded-2xl" />

              <div className="flex flex-1 flex-col gap-3">
                <Skeleton className="h-4 w-2/3" />

                <Skeleton className="h-3 w-full" />

                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Empty State
  if (documents.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-white px-5 py-12 text-center">
        <p className="text-sm font-medium text-slate-700">
          No financial documents uploaded
        </p>

        <p className="mt-2 text-xs leading-6 text-slate-400">
          Upload annual reports, earnings calls, or filings to begin grounded
          analysis.
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {documents.map((document) => (
        <DocumentCard key={document.id} document={document} />
      ))}
    </div>
  );
}
