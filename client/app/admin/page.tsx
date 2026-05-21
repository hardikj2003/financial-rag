"use client";

import { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { getDashboardMetrics } from "@/services/admin/admin.service";
import MetricCard from "@/components/admin/MetricCard";
import { Users, MessageSquare, Files, Cpu, Server } from "lucide-react";

export default function AdminPage() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const token = await getToken();
        console.log(token)
        if (!token) return;
        const response = await getDashboardMetrics(token);
        setMetrics(response.metrics);
      } catch (err) {
        console.error("Dashboard metric resolution failed:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [getToken]);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Context Frame */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            System Performance
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time infrastructure logs, database indexes, and operational
            analytics profiles.
          </p>
        </div>
        <div className="text-xs font-mono text-slate-400 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs self-start sm:self-center">
          Session Token:{" "}
          <span className="text-slate-700 font-semibold">Active</span>
        </div>
      </div>

      {/* High-Fidelity Metrics Analytics Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <MetricCard
          title="Total Users"
          value={metrics?.totalUsers}
          loading={loading}
          icon={Users}
          description="Registered profiles"
        />
        <MetricCard
          title="Total Conversations"
          value={metrics?.totalChats}
          loading={loading}
          icon={Server}
          description="Active analytics streams"
        />
        <MetricCard
          title="Messages Relayed"
          value={metrics?.totalMessages}
          loading={loading}
          icon={MessageSquare}
          description="Tokens distributed logs"
        />
        <MetricCard
          title="Ingested Documents"
          value={metrics?.totalDocuments}
          loading={loading}
          icon={Files}
          description="Vector source files"
        />
        <MetricCard
          title="Knowledge Chunks"
          value={metrics?.totalChunks}
          loading={loading}
          icon={Cpu}
          description="Embedded embeddings"
          isHighlight={true}
        />
      </div>
    </div>
  );
}
