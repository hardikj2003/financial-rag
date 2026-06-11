"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import {
  AdminDocument,
  getDocuments,
  deleteDocument,
} from "@/services/admin/admin.service";
import {
  FileText,
  Trash2,
  Cpu,
  RefreshCcw,
  HardDrive,
  Search,
  Layers,
  Database,
} from "lucide-react";
import UploadBox from "@/components/admin/upload/UploadBox";

export default function DocumentsPage() {
  const { getToken } = useAuth();
  const [documents, setDocuments] = useState<AdminDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchDocuments = useCallback(async () => {
    const token = await getToken();
    if (!token) return [];
    const response = await getDocuments(token);
    return response.documents || [];
  }, [getToken]);

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    try {
      setDocuments(await fetchDocuments());
    } catch (error) {
      console.error("Failed to resolve vector documents:", error);
    } finally {
      setLoading(false);
    }
  }, [fetchDocuments]);

  useEffect(() => {
    let isMounted = true;

    const loadInitialDocuments = async () => {
      try {
        const nextDocuments = await fetchDocuments();
        if (isMounted) {
          setDocuments(nextDocuments);
        }
      } catch (error) {
        console.error("Failed to resolve vector documents:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadInitialDocuments();

    return () => {
      isMounted = false;
    };
  }, [fetchDocuments]);

  const handleDelete = async (documentId: string) => {
    if (
      !confirm(
        "Are you sure you want to completely drop this document from the vector store? This cannot be undone.",
      )
    )
      return;

    try {
      const token = await getToken();
      if (!token) return;
      await deleteDocument(documentId, token);
      await loadDocuments();
    } catch (error) {
      console.error("Deindexing error:", error);
    }
  };

  const filteredDocuments = useMemo(
    () =>
      documents.filter((doc) =>
        doc.fileName.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [documents, searchQuery],
  );

  // Compute live micro-stats for top navigation ribbon tracking
  const totalChunks = useMemo(
    () => documents.reduce((acc, curr) => acc + (curr.chunksStored || 0), 0),
    [documents],
  );

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* Structural Page Header Context */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-5 border-b border-slate-200/60">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            Knowledge Cluster{" "}
            <span className="text-xs font-mono font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md border border-blue-100">
              RAG Engine
            </span>
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Ingest financial dossiers, inspect generated node weights, and
            control live vector indexing.
          </p>
        </div>

        <button
          onClick={loadDocuments}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-2xs hover:bg-slate-50 active:scale-98 transition-all self-start md:self-center"
        >
          <RefreshCcw
            size={13}
            className={loading ? "animate-spin text-blue-600" : ""}
          />
          Re-index Sync
        </button>
      </div>

      {/* Two-Column Management Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Interactive Zone: Document Uploading and Real-time Counter Stats */}
        <div className="lg:col-span-1 space-y-4">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs">
            <div className="mb-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Data Ingestion Channel
              </h2>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                Load corporate PDF source files directly into active neural
                embedding models.
              </p>
            </div>
            <UploadBox onUploadSuccess={loadDocuments} />
          </div>

          {/* Micro Telemetry Overview Widgets */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-xl flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg border border-slate-200 text-slate-500">
                <Database size={14} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Source Files
                </p>
                <p className="text-base font-bold font-mono text-slate-800">
                  {documents.length}
                </p>
              </div>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-xl flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg border border-slate-200 text-slate-500">
                <Layers size={14} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Total Chunks
                </p>
                <p className="text-base font-bold font-mono text-slate-800">
                  {totalChunks}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Active Matrix Ledger Zone */}
        <div className="lg:col-span-2 space-y-4">
          {/* Internal Filtering Row Controls */}
          <div className="flex items-center gap-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-2xs focus-within:border-slate-400 focus-within:ring-2 focus-within:ring-slate-900/5 transition-all">
            <Search size={15} className="text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Query structural index by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-xs outline-none placeholder:text-slate-400 text-slate-700"
            />
          </div>

          {/* Primary Render Conditionals Gate */}
          {loading ? (
            <div className="space-y-2.5">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="h-18.5 w-full animate-pulse rounded-xl border border-slate-200 bg-white"
                />
              ))}
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-20 rounded-2xl border border-dashed border-slate-200 bg-white shadow-2xs">
              <div className="h-11 w-11 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 mb-3.5 shadow-2xs">
                <HardDrive size={16} />
              </div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Index Matrix Empty
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xs px-4">
                {searchQuery
                  ? "No vectorized targets match your current filtering parameter configurations."
                  : "No nodes currently exist inside this workspace pipeline."}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5 max-h-[calc(100vh-240px)] overflow-y-auto no-scrollbar pr-1">
              {filteredDocuments.map((document) => (
                <div
                  key={document.id}
                  className="group flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs hover:shadow-xs hover:border-slate-300/90 transition-all duration-200"
                >
                  {/* Document Identity Cluster */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 border border-slate-100 text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all duration-300 shadow-2xs">
                      <FileText size={16} />
                    </div>
                    <div className="min-w-0 space-y-0.5">
                      <h3 className="text-xs font-bold text-slate-800 truncate pr-4 group-hover:text-slate-900 transition-colors">
                        {document.fileName}
                      </h3>
                      <div className="flex items-center gap-2.5 flex-wrap text-[11px] font-medium text-slate-400">
                        <span className="flex items-center gap-1 font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200/40">
                          <Cpu size={10} className="text-slate-400" />
                          {document.chunksStored ?? 0} blocks
                        </span>
                        <div className="h-2 w-px bg-slate-200" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                          Live Array
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Clean Destructive Row Controls Action Trigger */}
                  <div className="flex items-center justify-end shrink-0 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                      onClick={() => handleDelete(document.id)}
                      className="flex items-center gap-1 rounded-lg border border-transparent bg-slate-50 hover:bg-red-50 hover:border-red-100 hover:text-red-600 text-slate-400 px-2.5 py-1.5 text-[11px] font-semibold tracking-tight transition-all duration-150"
                    >
                      <Trash2 size={12} />
                      <span>Purge Node</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
