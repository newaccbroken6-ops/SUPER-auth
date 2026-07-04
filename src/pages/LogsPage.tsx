import { useEffect, useState } from 'react';
import { supabase, ActivityLog } from '../lib/supabase';
import { Activity, Search, RefreshCw, AlertTriangle, CheckCircle2, XCircle, Key, Cpu, Shield } from 'lucide-react';

const EVENT_CONFIG: Record<string, { label: string; color: string; icon: typeof Activity }> = {
  validate_success: { label: 'Validated', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: CheckCircle2 },
  invalid_key: { label: 'Invalid Key', color: 'text-red-400 bg-red-500/10 border-red-500/20', icon: XCircle },
  expired: { label: 'Expired', color: 'text-gray-400 bg-gray-500/10 border-gray-500/20', icon: XCircle },
  hwid_mismatch: { label: 'HWID Mismatch', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', icon: Cpu },
  hwid_reset: { label: 'HWID Reset', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', icon: Cpu },
  rate_limited: { label: 'Rate Limited', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20', icon: AlertTriangle },
  license_banned: { label: 'License Banned', color: 'text-red-400 bg-red-500/10 border-red-500/20', icon: Shield },
  license_suspended: { label: 'Suspended', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', icon: XCircle },
  license_active: { label: 'Activated', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: CheckCircle2 },
  bulk_generate: { label: 'Bulk Generated', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20', icon: Key },
  user_banned: { label: 'User Banned', color: 'text-red-400 bg-red-500/10 border-red-500/20', icon: Shield },
  user_unbanned: { label: 'User Unbanned', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: Shield },
  status_suspended: { label: 'Status: Suspended', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', icon: XCircle },
  status_banned: { label: 'Status: Banned', color: 'text-red-400 bg-red-500/10 border-red-500/20', icon: XCircle },
  status_expired: { label: 'Status: Expired', color: 'text-gray-400 bg-gray-500/10 border-gray-500/20', icon: Clock },
};

function Clock(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

export default function LogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [eventFilter, setEventFilter] = useState('all');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 50;

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
    setLogs(data ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [page]);

  const filtered = logs.filter(l => {
    const matchEvent = eventFilter === 'all' || l.event_type === eventFilter;
    const matchSearch =
      (l.ip_address ?? '').includes(search) ||
      (l.hwid ?? '').includes(search) ||
      l.event_type.includes(search);
    return matchEvent && matchSearch;
  });

  const uniqueEvents = [...new Set(logs.map(l => l.event_type))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Activity Logs</h1>
          <p className="text-gray-400 mt-1">Audit trail of all license events</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-gray-700 text-gray-300 hover:text-white hover:border-gray-600 text-sm transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search IP, HWID, event..."
            className="w-full bg-gray-900/60 border border-gray-800 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors text-sm"
          />
        </div>
        <select
          value={eventFilter}
          onChange={e => setEventFilter(e.target.value)}
          className="bg-gray-900/60 border border-gray-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500 transition-colors text-sm"
        >
          <option value="all">All Events</option>
          {uniqueEvents.map(e => <option key={e} value={e}>{EVENT_CONFIG[e]?.label ?? e}</option>)}
        </select>
      </div>

      <div className="bg-gray-900/60 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">HWID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={5} className="px-4 py-3">
                      <div className="h-5 bg-gray-800/60 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center">
                    <Activity className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                    <p className="text-gray-500">No activity logs yet</p>
                  </td>
                </tr>
              ) : filtered.map(log => {
                const cfg = EVENT_CONFIG[log.event_type] ?? { label: log.event_type, color: 'text-gray-400 bg-gray-500/10 border-gray-500/20', icon: Activity };
                const Icon = cfg.icon;
                return (
                  <tr key={log.id} className="hover:bg-gray-800/20 transition-colors">
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg border font-medium ${cfg.color}`}>
                        <Icon className="w-3 h-3" />
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-sm font-mono">
                      {log.ip_address ?? <span className="text-gray-600">—</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs font-mono max-w-32 truncate">
                      {log.hwid ?? <span className="text-gray-600">—</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs font-mono max-w-40 truncate">
                      {Object.keys(log.metadata ?? {}).length > 0
                        ? JSON.stringify(log.metadata).slice(0, 60)
                        : <span className="text-gray-600">—</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800">
          <p className="text-gray-500 text-sm">Page {page + 1}</p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1.5 rounded-lg border border-gray-700 text-gray-400 hover:text-white disabled:opacity-40 text-sm transition-colors"
            >
              Prev
            </button>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={logs.length < PAGE_SIZE}
              className="px-3 py-1.5 rounded-lg border border-gray-700 text-gray-400 hover:text-white disabled:opacity-40 text-sm transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
