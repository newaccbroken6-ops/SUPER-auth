import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  Key, AppWindow, Activity, TrendingUp,
  CheckCircle2, XCircle, Clock, Ban
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

interface Stats {
  totalLicenses: number;
  activeLicenses: number;
  expiredLicenses: number;
  bannedLicenses: number;
  totalApps: number;
  totalLogs: number;
  recentLogs: { date: string; count: number }[];
  statusBreakdown: { name: string; value: number; color: string }[];
}

const STATUS_COLORS = {
  active: '#06b6d4',
  suspended: '#f59e0b',
  expired: '#6b7280',
  banned: '#ef4444',
};

export default function DashboardPage() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [
        { count: totalLicenses },
        { count: activeLicenses },
        { count: expiredLicenses },
        { count: bannedLicenses },
        { count: totalApps },
        { count: totalLogs },
        { data: recentData },
      ] = await Promise.all([
        supabase.from('licenses').select('*', { count: 'exact', head: true }),
        supabase.from('licenses').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('licenses').select('*', { count: 'exact', head: true }).eq('status', 'expired'),
        supabase.from('licenses').select('*', { count: 'exact', head: true }).eq('status', 'banned'),
        supabase.from('applications').select('*', { count: 'exact', head: true }),
        supabase.from('activity_logs').select('*', { count: 'exact', head: true }),
        supabase
          .from('activity_logs')
          .select('created_at')
          .order('created_at', { ascending: false })
          .limit(200),
      ]);

      // Group logs by day (last 7 days)
      const days: Record<string, number> = {};
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days[d.toISOString().slice(0, 10)] = 0;
      }
      (recentData ?? []).forEach(log => {
        const day = log.created_at.slice(0, 10);
        if (day in days) days[day]++;
      });

      setStats({
        totalLicenses: totalLicenses ?? 0,
        activeLicenses: activeLicenses ?? 0,
        expiredLicenses: expiredLicenses ?? 0,
        bannedLicenses: bannedLicenses ?? 0,
        totalApps: totalApps ?? 0,
        totalLogs: totalLogs ?? 0,
        recentLogs: Object.entries(days).map(([date, count]) => ({
          date: date.slice(5),
          count,
        })),
        statusBreakdown: [
          { name: 'Active', value: activeLicenses ?? 0, color: STATUS_COLORS.active },
          { name: 'Expired', value: expiredLicenses ?? 0, color: STATUS_COLORS.expired },
          { name: 'Banned', value: bannedLicenses ?? 0, color: STATUS_COLORS.banned },
          { name: 'Suspended', value: (totalLicenses ?? 0) - (activeLicenses ?? 0) - (expiredLicenses ?? 0) - (bannedLicenses ?? 0), color: STATUS_COLORS.suspended },
        ].filter(s => s.value > 0),
      });
      setLoading(false);
    }
    load();
  }, []);

  const statCards = stats ? [
    { label: 'Total Licenses', value: stats.totalLicenses, icon: Key, color: 'cyan', sub: 'All time' },
    { label: 'Active', value: stats.activeLicenses, icon: CheckCircle2, color: 'emerald', sub: 'Currently valid' },
    { label: 'Expired', value: stats.expiredLicenses, icon: Clock, color: 'gray', sub: 'Past due' },
    { label: 'Applications', value: stats.totalApps, icon: AppWindow, color: 'blue', sub: 'Registered apps' },
    { label: 'Banned', value: stats.bannedLicenses, icon: Ban, color: 'red', sub: 'Revoked' },
    { label: 'API Calls', value: stats.totalLogs, icon: Activity, color: 'violet', sub: 'Total events' },
  ] : [];

  const colorMap: Record<string, string> = {
    cyan: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
    emerald: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    gray: 'text-gray-400 bg-gray-400/10 border-gray-400/20',
    blue: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    red: 'text-red-400 bg-red-400/10 border-red-400/20',
    violet: 'text-violet-400 bg-violet-400/10 border-violet-400/20',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">
          Welcome back, {profile?.username ?? 'User'}
        </h1>
        <p className="text-gray-400 mt-1">Here's what's happening with your licenses</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-gray-900/60 border border-gray-800 rounded-2xl p-5 animate-pulse h-28" />
            ))
          : statCards.map(card => {
              const Icon = card.icon;
              const cls = colorMap[card.color];
              return (
                <div key={card.label} className="bg-gray-900/60 border border-gray-800 rounded-2xl p-5 hover:border-gray-700 transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">{card.label}</p>
                      <p className="text-3xl font-bold text-white mt-1">{card.value.toLocaleString()}</p>
                      <p className="text-gray-500 text-xs mt-1">{card.sub}</p>
                    </div>
                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${cls}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              );
            })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Area chart */}
        <div className="lg:col-span-2 bg-gray-900/60 border border-gray-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
            <h2 className="text-white font-semibold">API Activity (Last 7 Days)</h2>
          </div>
          {loading ? (
            <div className="h-48 animate-pulse bg-gray-800/50 rounded-xl" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={stats?.recentLogs ?? []}>
                <defs>
                  <linearGradient id="actGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="date" stroke="#4b5563" tick={{ fill: '#6b7280', fontSize: 12 }} />
                <YAxis stroke="#4b5563" tick={{ fill: '#6b7280', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 12, color: '#f9fafb' }}
                  labelStyle={{ color: '#9ca3af' }}
                />
                <Area type="monotone" dataKey="count" stroke="#06b6d4" fill="url(#actGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie chart */}
        <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <Key className="w-5 h-5 text-cyan-400" />
            <h2 className="text-white font-semibold">License Status</h2>
          </div>
          {loading ? (
            <div className="h-48 animate-pulse bg-gray-800/50 rounded-xl" />
          ) : stats?.statusBreakdown.length ? (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie
                    data={stats.statusBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    dataKey="value"
                    strokeWidth={2}
                    stroke="#111827"
                  >
                    {stats.statusBreakdown.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 12, color: '#f9fafb' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-4">
                {stats.statusBreakdown.map(s => (
                  <div key={s.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
                      <span className="text-gray-400">{s.name}</span>
                    </div>
                    <span className="text-white font-medium">{s.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-500 text-sm">
              No license data yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
