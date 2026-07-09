import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  Monitor, Activity, Wifi, WifiOff, Clock, Key, AlertCircle,
  TrendingUp, Users, Globe, RefreshCw, Eye, Shield, Zap
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar
} from 'recharts';

interface AppActivity {
  app_id: string;
  app_name: string;
  owner: string;
  total_licenses: number;
  active_licenses: number;
  api_calls_today: number;
  api_calls_week: number;
  last_activity: string | null;
  is_active: boolean;
  unique_ips: number;
  unique_hwids: number;
}

interface LiveActivity {
  id: string;
  app_name: string;
  event_type: string;
  ip_address: string | null;
  hwid: string | null;
  created_at: string;
}

export default function MonitorPage() {
  const { profile } = useAuth();
  const [apps, setApps] = useState<AppActivity[]>([]);
  const [liveActivity, setLiveActivity] = useState<LiveActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedApp, setSelectedApp] = useState<string | null>(null);

  async function loadData() {
    try {
      // Get all applications with their activity
      const { data: appsData } = await supabase
        .from('applications')
        .select('id, name, owner_id, is_active, profiles!inner(username, email)')
        .order('name');

      if (!appsData) {
        setLoading(false);
        return;
      }

      // Get activity data for each app
      const appsWithActivity = await Promise.all(
        appsData.map(async (app: any) => {
          const [
            { count: totalLicenses },
            { count: activeLicenses },
            { data: todayLogs },
            { data: weekLogs },
            { data: lastLog },
            { data: uniqueIPs },
            { data: uniqueHWIDs },
          ] = await Promise.all([
            supabase.from('licenses').select('*', { count: 'exact', head: true }).eq('app_id', app.id),
            supabase.from('licenses').select('*', { count: 'exact', head: true }).eq('app_id', app.id).eq('status', 'active'),
            supabase
              .from('activity_logs')
              .select('id')
              .eq('app_id', app.id)
              .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
            supabase
              .from('activity_logs')
              .select('id')
              .eq('app_id', app.id)
              .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
            supabase
              .from('activity_logs')
              .select('created_at')
              .eq('app_id', app.id)
              .order('created_at', { ascending: false })
              .limit(1),
            supabase
              .from('activity_logs')
              .select('ip_address')
              .eq('app_id', app.id)
              .not('ip_address', 'is', null)
              .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
            supabase
              .from('activity_logs')
              .select('hwid')
              .eq('app_id', app.id)
              .not('hwid', 'is', null)
              .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
          ]);

          const uniqueIPsCount = new Set((uniqueIPs ?? []).map((log: any) => log.ip_address)).size;
          const uniqueHWIDsCount = new Set((uniqueHWIDs ?? []).map((log: any) => log.hwid)).size;

          return {
            app_id: app.id,
            app_name: app.name,
            owner: app.profiles?.username || app.profiles?.email || 'Unknown',
            total_licenses: totalLicenses ?? 0,
            active_licenses: activeLicenses ?? 0,
            api_calls_today: (todayLogs ?? []).length,
            api_calls_week: (weekLogs ?? []).length,
            last_activity: lastLog?.[0]?.created_at || null,
            is_active: app.is_active,
            unique_ips: uniqueIPsCount,
            unique_hwids: uniqueHWIDsCount,
          };
        })
      );

      setApps(appsWithActivity);

      // Get recent live activity (last 50 events)
      const { data: recentLogs } = await supabase
        .from('activity_logs')
        .select('id, app_id, event_type, ip_address, hwid, created_at, applications!inner(name)')
        .order('created_at', { ascending: false })
        .limit(50);

      const formattedLogs = (recentLogs ?? []).map((log: any) => ({
        id: log.id,
        app_name: log.applications?.name || 'Unknown',
        event_type: log.event_type,
        ip_address: log.ip_address,
        hwid: log.hwid,
        created_at: log.created_at,
      }));

      setLiveActivity(formattedLogs);
    } catch (error) {
      console.error('Failed to load monitoring data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    if (profile?.role === 'admin') {
      loadData();
      // Auto-refresh every 30 seconds
      const interval = setInterval(loadData, 30000);
      return () => clearInterval(interval);
    }
  }, [profile]);

  async function handleRefresh() {
    setRefreshing(true);
    await loadData();
  }

  if (profile?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
        <p className="text-gray-400">This page is only accessible to administrators.</p>
      </div>
    );
  }

  const filteredActivity = selectedApp
    ? liveActivity.filter((log) => log.app_name === apps.find((a) => a.app_id === selectedApp)?.app_name)
    : liveActivity;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500">
            Connected Apps Monitor
          </h1>
          <p className="text-gray-400 mt-1">Real-time monitoring of all connected applications</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 text-sm font-medium">Live</span>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 transition-all shadow-lg"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6 animate-pulse h-48" />
          ))}
        </div>
      ) : (
        <>
          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <div className="bg-gray-900/40 backdrop-blur-sm border border-gray-800 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                  <Monitor className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Total Apps</p>
                  <p className="text-2xl font-bold text-white">{apps.length}</p>
                </div>
              </div>
              <p className="text-emerald-400 text-xs flex items-center gap-1">
                <Wifi className="w-3 h-3" />
                {apps.filter((a) => a.is_active).length} active
              </p>
            </div>

            <div className="bg-gray-900/40 backdrop-blur-sm border border-gray-800 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-gray-400 text-xs">API Calls</p>
                  <p className="text-2xl font-bold text-white">
                    {apps.reduce((sum, a) => sum + a.api_calls_today, 0)}
                  </p>
                </div>
              </div>
              <p className="text-gray-500 text-xs">Today</p>
            </div>

            <div className="bg-gray-900/40 backdrop-blur-sm border border-gray-800 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                  <Key className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Active Licenses</p>
                  <p className="text-2xl font-bold text-white">
                    {apps.reduce((sum, a) => sum + a.active_licenses, 0)}
                  </p>
                </div>
              </div>
              <p className="text-gray-500 text-xs">
                of {apps.reduce((sum, a) => sum + a.total_licenses, 0)} total
              </p>
            </div>

            <div className="bg-gray-900/40 backdrop-blur-sm border border-gray-800 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Unique IPs</p>
                  <p className="text-2xl font-bold text-white">
                    {apps.reduce((sum, a) => sum + a.unique_ips, 0)}
                  </p>
                </div>
              </div>
              <p className="text-gray-500 text-xs">Last 24h</p>
            </div>
          </div>

          {/* Applications List */}
          <div className="bg-gray-900/40 backdrop-blur-sm border border-gray-800 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                <Monitor className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">Connected Applications</h3>
                <p className="text-gray-500 text-xs">Real-time status and metrics</p>
              </div>
            </div>

            <div className="space-y-3">
              {apps.length === 0 ? (
                <div className="text-center py-12">
                  <Monitor className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                  <p className="text-gray-500">No applications connected yet</p>
                </div>
              ) : (
                apps.map((app) => (
                  <div
                    key={app.app_id}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      selectedApp === app.app_id
                        ? 'bg-cyan-500/10 border-cyan-500/30'
                        : 'bg-gray-800/40 border-gray-700/50 hover:border-gray-700'
                    }`}
                    onClick={() => setSelectedApp(selectedApp === app.app_id ? null : app.app_id)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          app.is_active
                            ? 'bg-emerald-500/20 border border-emerald-500/30'
                            : 'bg-gray-700/50 border border-gray-700'
                        }`}>
                          {app.is_active ? (
                            <Wifi className="w-5 h-5 text-emerald-400" />
                          ) : (
                            <WifiOff className="w-5 h-5 text-gray-500" />
                          )}
                        </div>
                        <div>
                          <h4 className="text-white font-semibold">{app.app_name}</h4>
                          <p className="text-gray-500 text-xs flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {app.owner}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {selectedApp === app.app_id && (
                          <Eye className="w-4 h-4 text-cyan-400" />
                        )}
                        {app.last_activity && (
                          <span className="text-gray-500 text-xs flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(app.last_activity).toLocaleTimeString()}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div className="text-center p-2 rounded-lg bg-gray-900/60">
                        <p className="text-gray-400 text-xs mb-1">Licenses</p>
                        <p className="text-white font-bold">
                          {app.active_licenses}/{app.total_licenses}
                        </p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-gray-900/60">
                        <p className="text-gray-400 text-xs mb-1">Calls Today</p>
                        <p className="text-cyan-400 font-bold">{app.api_calls_today}</p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-gray-900/60">
                        <p className="text-gray-400 text-xs mb-1">Calls Week</p>
                        <p className="text-purple-400 font-bold">{app.api_calls_week}</p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-gray-900/60">
                        <p className="text-gray-400 text-xs mb-1">Unique IPs</p>
                        <p className="text-emerald-400 font-bold">{app.unique_ips}</p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-gray-900/60">
                        <p className="text-gray-400 text-xs mb-1">Unique HWIDs</p>
                        <p className="text-yellow-400 font-bold">{app.unique_hwids}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Live Activity Feed */}
          <div className="bg-gray-900/40 backdrop-blur-sm border border-gray-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">Live Activity Feed</h3>
                  <p className="text-gray-500 text-xs">
                    {selectedApp ? 'Filtered by selected app' : 'All applications'}
                  </p>
                </div>
              </div>
              {selectedApp && (
                <button
                  onClick={() => setSelectedApp(null)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-gray-800 text-gray-400 hover:text-white transition-colors"
                >
                  Show All
                </button>
              )}
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredActivity.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="w-10 h-10 text-gray-700 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">No recent activity</p>
                </div>
              ) : (
                filteredActivity.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-800/40 hover:bg-gray-800/60 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                        <Zap className="w-4 h-4 text-cyan-400" />
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">{log.app_name}</p>
                        <p className="text-gray-500 text-xs">{log.event_type}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      {log.ip_address && (
                        <span className="flex items-center gap-1">
                          <Globe className="w-3 h-3" />
                          {log.ip_address}
                        </span>
                      )}
                      {log.hwid && (
                        <span className="flex items-center gap-1">
                          <Shield className="w-3 h-3" />
                          {log.hwid.substring(0, 8)}...
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(log.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
