import { useEffect, useState } from 'react';
import { supabase, License, Application } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  Plus, Key, Copy, Check, Search, X, Loader2,
  CheckCircle2, XCircle, Clock, Ban, RefreshCw, Cpu, Trash2, AlertTriangle
} from 'lucide-react';

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg shadow-2xl shadow-black/50">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h3 className="text-white font-semibold">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

const STATUS_CONFIG = {
  active: { label: 'Active', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: CheckCircle2 },
  suspended: { label: 'Suspended', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', icon: XCircle },
  expired: { label: 'Expired', color: 'text-gray-400 bg-gray-500/10 border-gray-500/20', icon: Clock },
  banned: { label: 'Banned', color: 'text-red-400 bg-red-500/10 border-red-500/20', icon: Ban },
};

const TYPE_CONFIG = {
  daily: { label: 'Daily', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  monthly: { label: 'Monthly', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
  lifetime: { label: 'Lifetime', color: 'text-violet-400 bg-violet-500/10 border-violet-500/20' },
};

function FormFields({ 
  f, 
  setF, 
  apps 
}: { 
  f: { app_id: string; license_type: string; note: string; custom_name: string }; 
  setF: (v: { app_id: string; license_type: string; note: string; custom_name: string }) => void;
  apps: Application[];
}) {
  return (
    <>
      <div>
        <label className="block text-sm text-gray-400 mb-1.5">Application *</label>
        <select
          value={f.app_id}
          onChange={e => setF({ ...f, app_id: e.target.value })}
          className="w-full bg-gray-800/60 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors"
        >
          <option value="">Select application...</option>
          {apps.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-1.5">License Type</label>
        <div className="grid grid-cols-3 gap-2">
          {(['daily', 'monthly', 'lifetime'] as const).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setF({ ...f, license_type: t })}
              className={`py-2.5 rounded-xl border text-sm font-medium transition-all ${
                f.license_type === t
                  ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                  : 'border-gray-700 text-gray-400 hover:border-gray-600'
              }`}
            >
              {TYPE_CONFIG[t].label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-1.5">Custom Name (optional)</label>
        <input
          type="text"
          value={f.custom_name}
          onChange={e => setF({ ...f, custom_name: e.target.value })}
          placeholder="e.g., JOHN-DOE or PREMIUM-USER"
          className="w-full bg-gray-800/60 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
        />
        <p className="text-xs text-gray-500 mt-1">Format: SUPER-NOVA-{'{CUSTOM-NAME}'}</p>
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-1.5">Note (optional)</label>
        <input
          type="text"
          value={f.note}
          onChange={e => setF({ ...f, note: e.target.value })}
          placeholder="Customer name, order ID..."
          className="w-full bg-gray-800/60 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
        />
      </div>
    </>
  );
}

export default function LicensesPage() {
  const { user, session, profile } = useAuth();
  const [licenses, setLicenses] = useState<License[]>([]);
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [form, setForm] = useState({ app_id: '', license_type: 'monthly', note: '', custom_name: '' });
  const [bulkForm, setBulkForm] = useState({ app_id: '', license_type: 'monthly', count: 5, note: '', custom_name: '' });
  const [bulkResult, setBulkResult] = useState<License[] | null>(null);
  const [showDeleteAll, setShowDeleteAll] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  async function load() {
    const [{ data: lics }, { data: appsData }] = await Promise.all([
      supabase.from('licenses').select('*').order('created_at', { ascending: false }).limit(200),
      supabase.from('applications').select('id, name').order('name'),
    ]);
    setLicenses(lics ?? []);
    setApps(appsData ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const filtered = licenses.filter(l => {
    const matchSearch = l.license_key.toLowerCase().includes(search.toLowerCase()) ||
      (l.note ?? '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || l.status === statusFilter;
    return matchSearch && matchStatus;
  });

  async function copyKey(key: string) {
    await navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  }

  async function updateStatus(id: string, status: License['status']) {
    await supabase.from('licenses').update({ status }).eq('id', id);
    load();
  }

  async function generateLicense() {
    if (!form.app_id) { setError('Select an application'); return; }
    setSaving(true); setError('');
    const resp = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-licenses/generate`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ 
          app_id: form.app_id, 
          license_type: form.license_type, 
          count: 1, 
          note: form.note || null,
          custom_name: form.custom_name || null
        }),
      }
    );
    const data = await resp.json();
    if (!resp.ok || data.error) setError(data.error ?? 'Failed');
    else { setShowCreate(false); setForm({ app_id: '', license_type: 'monthly', note: '', custom_name: '' }); load(); }
    setSaving(false);
  }

  async function bulkGenerate() {
    if (!bulkForm.app_id) { setError('Select an application'); return; }
    setSaving(true); setError('');
    const resp = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-licenses/generate`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ 
          ...bulkForm, 
          note: bulkForm.note || null,
          custom_name: bulkForm.custom_name || null
        }),
      }
    );
    const data = await resp.json();
    if (!resp.ok || data.error) setError(data.error ?? 'Failed');
    else setBulkResult(data.licenses);
    setSaving(false);
  }

  async function resetHwid(licenseId: string) {
    const resp = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reset-hwid`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ license_id: licenseId }),
      }
    );
    const data = await resp.json();
    alert(data.message);
  }

  async function deleteAllLicenses() {
    if (deleteConfirmText !== 'DELETE ALL') {
      setError('Please type "DELETE ALL" to confirm');
      return;
    }

    setDeleting(true);
    setError('');

    try {
      const { error: deleteError } = await supabase
        .from('licenses')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all (using a condition that's always true)

      if (deleteError) {
        setError('Failed to delete licenses: ' + deleteError.message);
      } else {
        setShowDeleteAll(false);
        setDeleteConfirmText('');
        load();
        alert(`Successfully deleted all licenses!`);
      }
    } catch (err) {
      setError('An error occurred while deleting licenses');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Licenses</h1>
          <p className="text-gray-400 mt-1">{licenses.length} total licenses</p>
        </div>
        <div className="flex gap-2">
          {profile?.role === 'admin' && licenses.length > 0 && (
            <button
              onClick={() => setShowDeleteAll(true)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-red-700 text-red-400 hover:text-red-300 hover:border-red-600 hover:bg-red-500/10 text-sm transition-all"
            >
              <Trash2 className="w-4 h-4" />
              Delete All
            </button>
          )}
          <button
            onClick={() => setShowBulk(true)}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-gray-700 text-gray-300 hover:text-white hover:border-gray-600 text-sm transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Bulk Generate
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium text-sm hover:from-cyan-400 hover:to-blue-500 transition-all shadow-lg shadow-cyan-500/20"
          >
            <Plus className="w-4 h-4" />
            New License
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by key or note..."
            className="w-full bg-gray-900/60 border border-gray-800 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="bg-gray-900/60 border border-gray-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500 transition-colors text-sm"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="expired">Expired</option>
          <option value="banned">Banned</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-gray-900/60 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">License Key</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expires</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Note</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-4 py-4">
                      <div className="h-5 bg-gray-800/60 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <Key className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                    <p className="text-gray-500">No licenses found</p>
                  </td>
                </tr>
              ) : filtered.map(license => {
                const statusCfg = STATUS_CONFIG[license.status];
                const typeCfg = TYPE_CONFIG[license.license_type];
                const StatusIcon = statusCfg.icon;
                return (
                  <tr key={license.id} className="hover:bg-gray-800/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <code className="text-cyan-400 font-mono text-sm">{license.license_key}</code>
                        <button
                          onClick={() => copyKey(license.license_key)}
                          className="text-gray-500 hover:text-cyan-400 transition-colors"
                        >
                          {copiedKey === license.license_key ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-lg border font-medium ${typeCfg.color}`}>
                        {typeCfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg border font-medium ${statusCfg.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusCfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-sm">
                      {license.expires_at
                        ? new Date(license.expires_at).toLocaleDateString()
                        : <span className="text-violet-400 text-xs">Lifetime</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-sm max-w-32 truncate">
                      {license.note ?? <span className="text-gray-600">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        {license.status === 'active' ? (
                          <button
                            onClick={() => updateStatus(license.id, 'suspended')}
                            className="text-xs px-2 py-1 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors border border-amber-500/20"
                          >
                            Suspend
                          </button>
                        ) : license.status === 'suspended' ? (
                          <button
                            onClick={() => updateStatus(license.id, 'active')}
                            className="text-xs px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors border border-emerald-500/20"
                          >
                            Activate
                          </button>
                        ) : null}
                        {license.status !== 'banned' && (
                          <button
                            onClick={() => updateStatus(license.id, 'banned')}
                            className="text-xs px-2 py-1 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors border border-red-500/20"
                          >
                            Ban
                          </button>
                        )}
                        <button
                          onClick={() => resetHwid(license.id)}
                          className="p-1.5 rounded-lg bg-gray-800/60 text-gray-400 hover:text-cyan-400 transition-colors border border-gray-700"
                          title="Reset HWID"
                        >
                          <Cpu className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create modal */}
      {showCreate && (
        <Modal title="Generate License" onClose={() => { setShowCreate(false); setError(''); }}>
          <div className="space-y-4">
            <FormFields f={form} setF={setForm} apps={apps} />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <div className="flex gap-3">
              <button onClick={() => setShowCreate(false)} className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-400 hover:text-white transition-colors text-sm">Cancel</button>
              <button onClick={generateLicense} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium text-sm hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Generate
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Bulk modal */}
      {showBulk && (
        <Modal title="Bulk Generate Licenses" onClose={() => { setShowBulk(false); setError(''); setBulkResult(null); }}>
          {bulkResult ? (
            <div className="space-y-4">
              <p className="text-emerald-400 font-medium">{bulkResult.length} licenses generated!</p>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {bulkResult.map(l => (
                  <div key={l.id} className="flex items-center justify-between bg-gray-800/60 rounded-xl px-3 py-2">
                    <code className="text-cyan-400 font-mono text-sm">{l.license_key}</code>
                    <button onClick={() => copyKey(l.license_key)} className="text-gray-400 hover:text-cyan-400 transition-colors">
                      {copiedKey === l.license_key ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                ))}
              </div>
              <button onClick={() => { setShowBulk(false); setBulkResult(null); load(); }} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium text-sm transition-all">
                Done
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <FormFields f={bulkForm as typeof form} setF={f => setBulkForm({ ...bulkForm, ...f })} apps={apps} />
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Count (max 100)</label>
                <input
                  type="number"
                  min={1} max={100}
                  value={bulkForm.count}
                  onChange={e => setBulkForm({ ...bulkForm, count: parseInt(e.target.value) || 1 })}
                  className="w-full bg-gray-800/60 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <div className="flex gap-3">
                <button onClick={() => setShowBulk(false)} className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-400 hover:text-white transition-colors text-sm">Cancel</button>
                <button onClick={bulkGenerate} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium text-sm hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Generate
                </button>
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* Delete All Confirmation Modal */}
      {showDeleteAll && (
        <Modal title="⚠️ Delete ALL Licenses" onClose={() => { setShowDeleteAll(false); setDeleteConfirmText(''); setError(''); }}>
          <div className="space-y-4">
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-400 font-semibold mb-2">DANGER ZONE</p>
                <p className="text-gray-300 text-sm">
                  This action will <strong className="text-red-400">permanently delete ALL {licenses.length} licenses</strong> from the database.
                </p>
                <p className="text-gray-400 text-sm mt-2">
                  This action <strong>CANNOT be undone!</strong>
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Type <code className="text-red-400 font-bold">DELETE ALL</code> to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={e => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE ALL"
                className="w-full bg-gray-800/60 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/30 transition-colors font-mono"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button 
                onClick={() => { setShowDeleteAll(false); setDeleteConfirmText(''); setError(''); }} 
                className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-400 hover:text-white hover:border-gray-600 transition-colors text-sm"
              >
                Cancel
              </button>
              <button 
                onClick={deleteAllLicenses} 
                disabled={deleting || deleteConfirmText !== 'DELETE ALL'}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white font-medium text-sm hover:from-red-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete All Licenses
                  </>
                )}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
