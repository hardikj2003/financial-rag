"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";

import DocumentCard from "./DocumentCard";
import Skeleton from "../../ui/Skeleton";

import { UploadedDocument } from "@/types/upload";
import { getDocuments } from "@/services/document/document.service";

interface Props {
  refreshKey?: number;
}

export default function DocumentList({ refreshKey }: Props) {
  const { getToken } = useAuth();
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setLoading(true);
        const token = await getToken();
        if (!token) {
          console.error("No auth token found");
          return;
        }
        const response = await getDocuments(token);
        setDocuments(response.documents || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchDocuments();
  }, [refreshKey, getToken]);

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
    <div className="animate-fade-in space-y-4">
      {documents.map((document) => (
        <DocumentCard
          key={document.id}
          document={document}
          onDeleted={(documentId) =>
            setDocuments((current) =>
              current.filter((document) => document.id !== documentId),
            )
          }
        />
      ))}
    </div>
  );
}
