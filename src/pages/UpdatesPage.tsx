import { useEffect, useState } from 'react';
import { supabase, Application } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  Upload, Plus, X, Loader2, Check, Copy, Tag,
  Zap, ArrowUpCircle, AlertTriangle, Clock, Download, Github, Link as LinkIcon
} from 'lucide-react';

interface AppVersion {
  id: string;
  app_id: string;
  version: string;
  download_url: string;
  changelog: string | null;
  is_latest: boolean;
  force_update: boolean;
  created_at: string;
}

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

export default function UpdatesPage() {
  const { session } = useAuth();
  const [apps, setApps] = useState<Application[]>([]);
  const [selectedApp, setSelectedApp] = useState<string>('');
  const [versions, setVersions] = useState<AppVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const [form, setForm] = useState({
    version: '',
    download_url: '',
    changelog: '',
    force_update: false,
  });

  useEffect(() => {
    supabase.from('applications').select('id, name').order('name').then(({ data }) => {
      setApps(data ?? []);
      if (data && data.length > 0) setSelectedApp(data[0].id);
    });
  }, []);

  useEffect(() => {
    if (!selectedApp) return;
    loadVersions();
  }, [selectedApp]);

  async function loadVersions() {
    setLoading(true);
    const { data } = await supabase
      .from('app_versions')
      .select('*')
      .eq('app_id', selectedApp)
      .order('created_at', { ascending: false });
    setVersions(data ?? []);
    setLoading(false);
  }

  async function copy(text: string, id: string) {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  async function createVersion() {
    if (!form.version.trim()) { setError('Version is required'); return; }
    if (!form.download_url.trim()) { setError('Download URL is required'); return; }
    setSaving(true); setError('');

    // If marking as latest, unset current latest first
    if (true) {
      await supabase
        .from('app_versions')
        .update({ is_latest: false })
        .eq('app_id', selectedApp)
        .eq('is_latest', true);
    }

    const { error } = await supabase.from('app_versions').insert({
      app_id: selectedApp,
      version: form.version.trim(),
      download_url: form.download_url.trim(),
      changelog: form.changelog.trim() || null,
      is_latest: true,
      force_update: form.force_update,
    });

    if (error) setError(error.message);
    else {
      setShowCreate(false);
      setForm({ version: '', download_url: '', changelog: '', force_update: false });
      loadVersions();
    }
    setSaving(false);
  }

  async function setLatest(id: string) {
    await supabase.from('app_versions').update({ is_latest: false }).eq('app_id', selectedApp);
    await supabase.from('app_versions').update({ is_latest: true }).eq('id', id);
    loadVersions();
  }

  async function deleteVersion(id: string) {
    await supabase.from('app_versions').delete().eq('id', id);
    loadVersions();
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const endpointUrl = selectedApp
    ? `${supabaseUrl}/functions/v1/latest-version?app_id=${selectedApp}`
    : '';

  const cppSnippet = selectedApp ? `// In your C++ loader — replace the host with your own server if needed
// This endpoint returns: { "version": "V1.9", "download_url": "...", "force_update": false }

const std::string CURRENT_VERSION = "V1.9";  // bump on every build

// Fetch latest version from SUPER NOVA KEYS
// GET ${endpointUrl}
//
// Compare response["version"] to CURRENT_VERSION.
// If different (and force_update == true), download response["download_url"].` : '';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Online Updates</h1>
          <p className="text-gray-400 mt-1">Manage version releases for your applications</p>
        </div>
        <button
          onClick={() => { setShowCreate(true); setError(''); }}
          disabled={!selectedApp}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium text-sm hover:from-cyan-400 hover:to-blue-500 disabled:opacity-40 transition-all shadow-lg shadow-cyan-500/20"
        >
          <Plus className="w-4 h-4" />
          New Release
        </button>
      </div>

      {/* App selector */}
      {apps.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {apps.map(a => (
            <button
              key={a.id}
              onClick={() => setSelectedApp(a.id)}
              className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                selectedApp === a.id
                  ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                  : 'border-gray-700 text-gray-400 hover:border-gray-600 hover:text-gray-200'
              }`}
            >
              {a.name}
            </button>
          ))}
        </div>
      )}

      {/* GitHub Info Card */}
      {selectedApp && (
        <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gray-800/80 border border-gray-700 flex items-center justify-center flex-shrink-0">
              <Github className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-semibold text-sm mb-1">Host DLL on GitHub</h3>
              <p className="text-gray-400 text-sm mb-3">
                Upload your DLL to a GitHub repository and use the raw URL for automatic updates
              </p>
              <div className="space-y-2 text-xs">
                <div className="flex items-start gap-2">
                  <span className="text-cyan-400 font-mono flex-shrink-0">1.</span>
                  <p className="text-gray-400">Push your DLL to GitHub: <code className="text-gray-300 bg-gray-800 px-1 py-0.5 rounded">git add file.dll && git push</code></p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-cyan-400 font-mono flex-shrink-0">2.</span>
                  <p className="text-gray-400">Get raw URL: <code className="text-gray-300 bg-gray-800 px-1 py-0.5 rounded">https://github.com/USER/REPO/raw/refs/heads/main/file.dll</code></p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-cyan-400 font-mono flex-shrink-0">3.</span>
                  <p className="text-gray-400">Paste URL below when creating a new release</p>
                </div>
              </div>
              <a 
                href="https://github.com/wg27b8s8kn-spec/ZIT/blob/main/SKUZA.dll" 
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-4 px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-xs font-medium transition-colors border border-gray-700"
              >
                <LinkIcon className="w-3.5 h-3.5" />
                View Example on GitHub
              </a>
            </div>
          </div>
        </div>
      )}

      {/* API endpoint card */}
      {endpointUrl && (
        <div className="bg-gray-900/60 border border-cyan-500/20 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-cyan-400" />
            <span className="text-white font-medium text-sm">Update Endpoint (GET)</span>
            <span className="ml-auto text-xs text-gray-500">Used by your C++ loader</span>
          </div>
          <div className="flex items-center gap-2 bg-gray-950/80 border border-gray-800 rounded-xl px-4 py-3">
            <code className="text-cyan-400 text-xs font-mono flex-1 break-all">{endpointUrl}</code>
            <button
              onClick={() => copy(endpointUrl, 'endpoint')}
              className="text-gray-400 hover:text-cyan-400 transition-colors flex-shrink-0"
            >
              {copied === 'endpoint' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-gray-500 text-xs mt-2">
            Response: <code className="text-gray-400">{"{ version, download_url, changelog, force_update, released_at }"}</code>
          </p>
        </div>
      )}

      {/* C++ hint */}
      {cppSnippet && (
        <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-white font-medium text-sm">C++ Integration Hint</span>
            <button
              onClick={() => copy(cppSnippet, 'cpp')}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-cyan-400 transition-colors border border-gray-700 hover:border-cyan-500/40 px-2 py-1 rounded-lg"
            >
              {copied === 'cpp' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              Copy
            </button>
          </div>
          <pre className="bg-gray-950/80 border border-gray-800 rounded-xl p-4 text-gray-400 text-xs font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap">
            {cppSnippet}
          </pre>
        </div>
      )}

      {/* Versions list */}
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-900/60 border border-gray-800 rounded-2xl animate-pulse" />
          ))
        ) : versions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-gray-900/40 border border-gray-800 rounded-2xl">
            <div className="w-14 h-14 rounded-2xl bg-gray-800/80 border border-gray-700 flex items-center justify-center mb-4">
              <Upload className="w-7 h-7 text-gray-600" />
            </div>
            <p className="text-gray-400 font-medium">No releases yet</p>
            <p className="text-gray-500 text-sm mt-1">Create your first release to enable auto-updates</p>
          </div>
        ) : versions.map(v => (
          <div
            key={v.id}
            className={`bg-gray-900/60 border rounded-2xl p-5 transition-colors ${
              v.is_latest ? 'border-cyan-500/30 shadow-sm shadow-cyan-500/10' : 'border-gray-800'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  v.is_latest
                    ? 'bg-gradient-to-br from-cyan-500/30 to-blue-600/30 border border-cyan-500/30'
                    : 'bg-gray-800/60 border border-gray-700'
                }`}>
                  <Tag className={`w-5 h-5 ${v.is_latest ? 'text-cyan-400' : 'text-gray-500'}`} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-white font-bold font-mono">{v.version}</span>
                    {v.is_latest && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-medium">
                        LATEST
                      </span>
                    )}
                    {v.force_update && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-medium flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> FORCE UPDATE
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Clock className="w-3 h-3 text-gray-500" />
                    <span className="text-gray-500 text-xs">{new Date(v.created_at).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {!v.is_latest && (
                  <button
                    onClick={() => setLatest(v.id)}
                    className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 transition-colors"
                  >
                    <ArrowUpCircle className="w-3.5 h-3.5" />
                    Set Latest
                  </button>
                )}
                <button
                  onClick={() => copy(v.download_url, `dl-${v.id}`)}
                  className="text-xs px-2.5 py-1.5 rounded-lg bg-gray-800/60 text-gray-400 border border-gray-700 hover:text-cyan-400 transition-colors flex items-center gap-1.5"
                >
                  {copied === `dl-${v.id}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Download className="w-3.5 h-3.5" />}
                  URL
                </button>
                {!v.is_latest && (
                  <button
                    onClick={() => deleteVersion(v.id)}
                    className="text-xs px-2.5 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {v.changelog && (
              <div className="mt-3 pt-3 border-t border-gray-800">
                <p className="text-gray-400 text-sm whitespace-pre-wrap">{v.changelog}</p>
              </div>
            )}

            <div className="mt-3 pt-3 border-t border-gray-800">
              <div className="flex items-center gap-2 bg-gray-950/60 rounded-xl px-3 py-2">
                <code className="text-gray-400 text-xs font-mono flex-1 truncate">{v.download_url}</code>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create modal */}
      {showCreate && (
        <Modal title="New Release" onClose={() => { setShowCreate(false); setError(''); }}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Version String *</label>
              <input
                type="text"
                value={form.version}
                onChange={e => setForm({ ...form, version: e.target.value })}
                placeholder="V2.0"
                className="w-full bg-gray-800/60 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors font-mono"
              />
              <p className="text-gray-600 text-xs mt-1">Must match <code>CURRENT_VERSION</code> in your C++ binary</p>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Download URL *</label>
              <input
                type="url"
                value={form.download_url}
                onChange={e => setForm({ ...form, download_url: e.target.value })}
                placeholder="https://github.com/user/repo/raw/refs/heads/main/file.dll"
                className="w-full bg-gray-800/60 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
              />
              <div className="mt-2 p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                <div className="flex items-start gap-2">
                  <Github className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-cyan-400">
                    <p className="font-semibold mb-1">GitHub Raw URL Format:</p>
                    <code className="text-cyan-300">
                      https://github.com/USER/REPO/raw/refs/heads/BRANCH/PATH/file.dll
                    </code>
                    <p className="mt-2 text-gray-400">
                      Example: <code className="text-gray-300">https://github.com/wg27b8s8kn-spec/ZIT/raw/refs/heads/main/SKUZA.dll</code>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Changelog</label>
              <textarea
                value={form.changelog}
                onChange={e => setForm({ ...form, changelog: e.target.value })}
                placeholder="- Fixed crash on startup&#10;- Improved performance"
                rows={4}
                className="w-full bg-gray-800/60 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors resize-none text-sm"
              />
            </div>

            <label className="flex items-center gap-3 cursor-pointer select-none group">
              <div
                onClick={() => setForm({ ...form, force_update: !form.force_update })}
                className={`w-10 h-5 rounded-full transition-all relative ${
                  form.force_update ? 'bg-amber-500' : 'bg-gray-700'
                }`}
              >
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${
                  form.force_update ? 'left-5' : 'left-0.5'
                }`} />
              </div>
              <div>
                <span className="text-white text-sm font-medium">Force Update</span>
                <p className="text-gray-500 text-xs">Clients on older versions must update before proceeding</p>
              </div>
            </label>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => { setShowCreate(false); setError(''); }}
                className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-400 hover:text-white transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={createVersion}
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium text-sm hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                Publish Release
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
