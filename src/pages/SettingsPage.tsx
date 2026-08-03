import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { User, Key, Copy, Check, Loader2, Code, BookOpen, Camera, Upload as UploadIcon } from 'lucide-react';

export default function SettingsPage() {
  const { user, profile, refreshProfile } = useAuth();
  const [username, setUsername] = useState(profile?.username ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const [tab, setTab] = useState<'profile' | 'sdk'>('profile');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  async function saveProfile() {
    if (!username.trim()) return;
    setSaving(true); setError('');
    const { error } = await supabase
      .from('profiles')
      .update({ username: username.trim() })
      .eq('id', user!.id);
    if (error) setError(error.message);
    else { setSaved(true); refreshProfile(); setTimeout(() => setSaved(false), 2000); }
    setSaving(false);
  }

  async function copy(text: string, id: string) {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  async function uploadAvatar(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      setUploading(true);
      setUploadError('');

      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      const file = event.target.files[0];
      const fileSize = file.size / 1024 / 1024; // MB

      // Validate file size (max 2MB)
      if (fileSize > 2) {
        setUploadError('File size must be less than 2MB');
        setUploading(false);
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setUploadError('File must be an image');
        setUploading(false);
        return;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${user!.id}/${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update profile with avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user!.id);

      if (updateError) {
        throw updateError;
      }

      refreshProfile();
    } catch (error: any) {
      setUploadError(error.message || 'Error uploading avatar');
    } finally {
      setUploading(false);
    }
  }

  async function removeAvatar() {
    try {
      setUploading(true);
      setUploadError('');

      // Update profile to remove avatar URL
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', user!.id);

      if (error) throw error;

      refreshProfile();
    } catch (error: any) {
      setUploadError(error.message || 'Error removing avatar');
    } finally {
      setUploading(false);
    }
  }

  const sdkCode = `// SUPER NOVA KEYS — Client SDK
// Usage: validate a license key from your application

const SUPERNOVA_URL = "${import.meta.env.VITE_SUPABASE_URL}/functions/v1/validate-license";

async function validateLicense(licenseKey, appId, hwid = null) {
  const response = await fetch(SUPERNOVA_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ license_key: licenseKey, app_id: appId, hwid })
  });
  
  const data = await response.json();
  return data; // { valid: bool, message: string, license_type?, expires_at? }
}

// Example usage:
const result = await validateLicense(
  "XXXX-XXXX-XXXX-XXXX",  // License key
  "your-app-id",           // App ID from dashboard
  "HWID-12345"             // Optional: hardware fingerprint
);

if (result.valid) {
  console.log("License valid!", result.license_type);
} else {
  console.error("License invalid:", result.message);
  process.exit(1);
}`;

  const pythonCode = `# SUPER NOVA KEYS — Python SDK
import requests

SUPERNOVA_URL = "${import.meta.env.VITE_SUPABASE_URL}/functions/v1/validate-license"

def validate_license(license_key: str, app_id: str, hwid: str = None) -> dict:
    payload = {"license_key": license_key, "app_id": app_id}
    if hwid:
        payload["hwid"] = hwid
    
    resp = requests.post(SUPERNOVA_URL, json=payload)
    return resp.json()

# Example usage:
result = validate_license(
    license_key="XXXX-XXXX-XXXX-XXXX",
    app_id="your-app-id",
    hwid="HWID-12345"  # optional
)

if result["valid"]:
    print(f"License valid! Type: {result['license_type']}")
else:
    print(f"License invalid: {result['message']}")
    exit(1)`;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-gray-400 mt-1">Account settings and SDK documentation</p>
      </div>

      <div className="flex gap-1 bg-gray-900/60 border border-gray-800 rounded-xl p-1 w-fit">
        {(['profile', 'sdk'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {t === 'profile' ? 'Profile' : 'SDK Docs'}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6 space-y-6">
          {/* Avatar Upload Section */}
          <div className="flex items-start gap-6">
            <div className="relative group">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Profile"
                  className="w-24 h-24 rounded-2xl object-cover border-2 border-gray-700 group-hover:border-cyan-500 transition-colors"
                />
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border-2 border-gray-700 group-hover:border-cyan-500 flex items-center justify-center transition-colors">
                  <User className="w-12 h-12 text-cyan-400" />
                </div>
              )}
              
              {/* Upload overlay */}
              <label className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={uploadAvatar}
                  disabled={uploading}
                  className="hidden"
                />
                {uploading ? (
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                ) : (
                  <Camera className="w-6 h-6 text-white" />
                )}
              </label>
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-white font-semibold">Profile Picture</h3>
                {profile?.avatar_url && (
                  <button
                    onClick={removeAvatar}
                    disabled={uploading}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                  >
                    Remove
                  </button>
                )}
              </div>
              <p className="text-gray-400 text-sm mb-2">
                Upload a profile picture. Max 2MB. JPG, PNG or GIF.
              </p>
              {uploadError && (
                <p className="text-red-400 text-sm mt-2">{uploadError}</p>
              )}
              <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-800 text-gray-300 hover:bg-gray-700 text-sm font-medium cursor-pointer transition-colors mt-3 border border-gray-700">
                <input
                  type="file"
                  accept="image/*"
                  onChange={uploadAvatar}
                  disabled={uploading}
                  className="hidden"
                />
                <UploadIcon className="w-4 h-4" />
                {uploading ? 'Uploading...' : 'Choose Image'}
              </label>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/20 flex items-center justify-center">
                <User className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <h2 className="text-white font-semibold">Account Info</h2>
                <p className="text-gray-500 text-sm">{user?.email}</p>
              </div>
            </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full bg-gray-800/60 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm text-gray-400">User ID</label>
            <div className="flex items-center gap-2 bg-gray-800/60 border border-gray-700 rounded-xl px-4 py-3">
              <code className="text-gray-300 text-sm font-mono flex-1 truncate">{user?.id}</code>
              <button onClick={() => copy(user?.id ?? '', 'uid')} className="text-gray-400 hover:text-cyan-400 transition-colors">
                {copied === 'uid' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            onClick={saveProfile}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium text-sm hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 transition-all shadow-lg shadow-cyan-500/20"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : null}
            {saved ? 'Saved!' : 'Save Changes'}
          </button>
        </div>
      )}

      {tab === 'sdk' && (
        <div className="space-y-4">
          <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Code className="w-5 h-5 text-cyan-400" />
              <h2 className="text-white font-semibold">JavaScript / Node.js</h2>
            </div>
            <div className="relative">
              <pre className="bg-gray-950 border border-gray-800 rounded-xl p-4 text-gray-300 text-xs font-mono overflow-x-auto leading-relaxed">
                {sdkCode}
              </pre>
              <button
                onClick={() => copy(sdkCode, 'js')}
                className="absolute top-3 right-3 p-2 rounded-lg bg-gray-800/80 text-gray-400 hover:text-cyan-400 transition-colors border border-gray-700"
              >
                {copied === 'js' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Code className="w-5 h-5 text-cyan-400" />
              <h2 className="text-white font-semibold">Python</h2>
            </div>
            <div className="relative">
              <pre className="bg-gray-950 border border-gray-800 rounded-xl p-4 text-gray-300 text-xs font-mono overflow-x-auto leading-relaxed">
                {pythonCode}
              </pre>
              <button
                onClick={() => copy(pythonCode, 'py')}
                className="absolute top-3 right-3 p-2 rounded-lg bg-gray-800/80 text-gray-400 hover:text-cyan-400 transition-colors border border-gray-700"
              >
                {copied === 'py' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <BookOpen className="w-5 h-5 text-cyan-400" />
              <h2 className="text-white font-semibold">API Reference</h2>
            </div>
            <div className="space-y-4 text-sm">
              <div className="bg-gray-950/80 rounded-xl p-4 border border-gray-800">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-xs font-mono font-bold">POST</span>
                  <code className="text-cyan-400 font-mono text-xs">/functions/v1/validate-license</code>
                </div>
                <p className="text-gray-400 text-xs mb-3">Validate a license key. No authentication required.</p>
                <div className="space-y-1 text-xs">
                  <p className="text-gray-500">Body:</p>
                  <p className="text-gray-300 font-mono ml-2">license_key <span className="text-amber-400">string*</span></p>
                  <p className="text-gray-300 font-mono ml-2">app_id <span className="text-amber-400">string*</span></p>
                  <p className="text-gray-300 font-mono ml-2">hwid <span className="text-gray-500">string (optional)</span></p>
                </div>
              </div>

              <div className="bg-gray-950/80 rounded-xl p-4 border border-gray-800">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-xs font-mono font-bold">POST</span>
                  <code className="text-cyan-400 font-mono text-xs">/functions/v1/reset-hwid</code>
                </div>
                <p className="text-gray-400 text-xs mb-3">Reset HWID binding. Requires Bearer JWT. 30-day cooldown for non-admins.</p>
                <div className="space-y-1 text-xs">
                  <p className="text-gray-500">Body:</p>
                  <p className="text-gray-300 font-mono ml-2">license_id <span className="text-amber-400">string*</span></p>
                </div>
              </div>

              <div className="bg-gray-950/80 rounded-xl p-4 border border-gray-800">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-xs font-mono font-bold">POST</span>
                  <code className="text-cyan-400 font-mono text-xs">/functions/v1/admin-licenses/generate</code>
                </div>
                <p className="text-gray-400 text-xs mb-3">Bulk generate license keys. Requires Bearer JWT (app owner or admin).</p>
                <div className="space-y-1 text-xs">
                  <p className="text-gray-500">Body:</p>
                  <p className="text-gray-300 font-mono ml-2">app_id <span className="text-amber-400">string*</span></p>
                  <p className="text-gray-300 font-mono ml-2">license_type <span className="text-amber-400">"daily"|"monthly"|"lifetime"*</span></p>
                  <p className="text-gray-300 font-mono ml-2">count <span className="text-gray-500">number (1-100, default 1)</span></p>
                  <p className="text-gray-300 font-mono ml-2">note <span className="text-gray-500">string (optional)</span></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
