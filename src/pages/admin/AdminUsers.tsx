import { useEffect, useState } from 'react';
import { db } from '../../lib/firebase';
import { collection, getDocs, doc, deleteDoc, query, orderBy, limit } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Search, 
  Trash2, 
  ShieldCheck, 
  Phone, 
  Mail, 
  Smartphone, 
  History, 
  UserCheck, 
  Filter, 
  ArrowLeft,
  RefreshCw,
  Terminal,
  Activity,
  Chrome
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'user' | 'admin';
  emailVerified?: boolean;
  phoneVerified?: boolean;
  authType?: 'google' | 'gmail_otp' | 'phone_otp' | 'email';
  avatarUrl?: string;
  lastLoginAt?: number;
  createdAt?: number;
}

interface LoginLog {
  id: string;
  userId: string;
  name: string;
  email?: string;
  phone?: string;
  authType: string;
  timestamp: number;
  device?: string;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [logs, setLogs] = useState<LoginLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'gmail' | 'phone' | 'google' | 'admin'>('all');
  const [activeTab, setActiveTab] = useState<'users' | 'history'>('users');
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  const loadData = async () => {
    setRefreshing(true);
    try {
      // Load Users
      const usersSnap = await getDocs(collection(db, 'users'));
      const usersList = usersSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as UserProfile));
      setUsers(usersList);

      // Load Login History
      const logsSnap = await getDocs(query(collection(db, 'loginHistory'), orderBy('timestamp', 'desc'), limit(100)));
      const logsList = logsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as LoginLog));
      setLogs(logsList);
    } catch (err) {
      console.error("Error loading administrative data:", err);
      toast.error("Could not fetch administrative dataset. Confirm security rules.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDeleteUser = async (userId: string, name: string) => {
    if (!window.confirm(`Are you absolutely sure you want to delete profile for ${name}? This action is permanent.`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'users', userId));
      setUsers(prev => prev.filter(u => u.id !== userId));
      toast.success(`Profile for ${name} deleted successfully.`);
    } catch (err) {
      toast.error("Failed to delete user profile. Access restricted.");
    }
  };

  // Filtering calculations
  const filteredUsers = users.filter(user => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = 
      user.name?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query) ||
      user.phone?.includes(query);

    if (!matchesSearch) return false;

    if (filterType === 'gmail') return user.emailVerified === true || user.authType === 'gmail_otp';
    if (filterType === 'phone') return user.phoneVerified === true || user.authType === 'phone_otp';
    if (filterType === 'google') return user.authType === 'google';
    if (filterType === 'admin') return user.role === 'admin';
    return true;
  });

  const totalGmailVerified = users.filter(u => u.emailVerified || u.authType === 'gmail_otp').length;
  const totalPhoneVerified = users.filter(u => u.phoneVerified || u.authType === 'phone_otp').length;

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 p-6 md:p-10 font-sans">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <button 
            onClick={() => navigate('/admin')}
            className="flex items-center gap-1.5 text-stone-400 hover:text-white text-xs uppercase tracking-widest font-bold mb-3 transition-colors"
          >
            <ArrowLeft size={13} />
            <span>Dashboard</span>
          </button>
          
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-serif font-black tracking-tight text-white">Security & Registry</h1>
            <span className="bg-stone-800 text-[10px] text-stone-300 font-mono font-bold px-2 py-0.5 rounded border border-stone-700 uppercase">
              Admin Suite
            </span>
          </div>
          <p className="text-stone-400 text-sm font-light mt-1.5 max-w-xl">
            Real-time telemetry audit, user collections registration, and database security rules inspector.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={loadData}
            disabled={refreshing}
            className="flex items-center gap-2 bg-stone-900 hover:bg-stone-850 text-stone-200 border border-stone-800 hover:border-stone-700 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all cursor-pointer"
          >
            <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
            <span>Refreshed Data</span>
          </button>
        </div>
      </div>

      {/* Stats Bento Grid Header */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-stone-900 border border-stone-800 p-5 rounded-2xl">
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase tracking-widest font-bold text-stone-400">Total Curators</span>
            <Users size={16} className="text-teal-400" />
          </div>
          <p className="text-3xl font-serif font-black mt-2 text-white">{users.length}</p>
          <div className="h-1 bg-stone-800 rounded-full mt-3 overflow-hidden">
            <div className="bg-teal-400 h-full" style={{ width: '100%' }}></div>
          </div>
        </div>

        <div className="bg-stone-900 border border-stone-800 p-5 rounded-2xl">
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase tracking-widest font-bold text-stone-400">Gmail Secured</span>
            <Mail size={16} className="text-red-400" />
          </div>
          <p className="text-3xl font-serif font-black mt-2 text-white">{totalGmailVerified}</p>
          <div className="h-1 bg-stone-800 rounded-full mt-3 overflow-hidden">
            <div 
              className="bg-red-400 h-full" 
              style={{ width: `${users.length > 0 ? (totalGmailVerified / users.length) * 100 : 0}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-stone-900 border border-stone-800 p-5 rounded-2xl">
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase tracking-widest font-bold text-stone-400">SMS Secured</span>
            <Smartphone size={16} className="text-amber-400" />
          </div>
          <p className="text-3xl font-serif font-black mt-2 text-white">{totalPhoneVerified}</p>
          <div className="h-1 bg-stone-800 rounded-full mt-3 overflow-hidden">
            <div 
              className="bg-amber-400 h-full" 
              style={{ width: `${users.length > 0 ? (totalPhoneVerified / users.length) * 100 : 0}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-stone-900 border border-stone-800 p-5 rounded-2xl">
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase tracking-widest font-bold text-stone-400">System Logins</span>
            <History size={16} className="text-purple-400" />
          </div>
          <p className="text-3xl font-serif font-black mt-2 text-white">{logs.length}</p>
          <div className="h-1 bg-stone-800 rounded-full mt-3 overflow-hidden">
            <div className="bg-purple-400 h-full" style={{ width: '100%' }}></div>
          </div>
        </div>
      </div>

      {/* Segment Switcher */}
      <div className="flex gap-2 border-b border-stone-800 mb-6 pb-px">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-widest border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'users' 
              ? 'border-white text-white font-extrabold' 
              : 'border-transparent text-stone-400 hover:text-stone-200'
          }`}
        >
          <UserCheck size={13} />
          <span>Registered Profiles</span>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-widest border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'history' 
              ? 'border-white text-white font-extrabold' 
              : 'border-transparent text-stone-400 hover:text-stone-200'
          }`}
        >
          <Activity size={13} />
          <span>Active Login Logs</span>
        </button>
      </div>

      {activeTab === 'users' ? (
        <div className="space-y-4">
          {/* Controls Panel */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-stone-900 border border-stone-800 p-4 rounded-xl">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500" />
              <input
                type="text"
                placeholder="Search name, phone, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-stone-950 border border-stone-800 focus:border-stone-700 outline-none rounded-lg pl-9 pr-4 py-2 text-xs font-mono text-stone-100 transition-all placeholder:text-stone-600"
              />
            </div>

            {/* Filter Pill List */}
            <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
              <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider flex items-center gap-1 mr-2">
                <Filter size={11} /> Filters
              </span>
              {[
                { id: 'all', label: 'All Curators' },
                { id: 'gmail', label: 'Gmail Only' },
                { id: 'phone', label: 'SMS Only' },
                { id: 'google', label: 'Google Auth' },
                { id: 'admin', label: 'Administrators' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setFilterType(f.id as any)}
                  className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md border transition-all cursor-pointer ${
                    filterType === f.id 
                      ? 'bg-white text-stone-950 border-white font-extrabold' 
                      : 'bg-stone-950 text-stone-400 border-stone-800 hover:border-stone-700'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* User Table Card */}
          <div className="bg-stone-900 border border-stone-800 rounded-xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-stone-800 text-[10px] uppercase tracking-widest text-stone-400 bg-stone-900/50">
                    <th className="p-4 font-bold">Curator Profile</th>
                    <th className="p-4 font-bold">Registry Channel</th>
                    <th className="p-4 font-bold">Verification Shields</th>
                    <th className="p-4 font-bold">System Role</th>
                    <th className="p-4 font-bold">Last Activity</th>
                    <th className="p-4 font-bold text-right">Acquisition Clearance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/60">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="text-center p-12 text-stone-600 flex justify-center">
                        <RefreshCw size={24} className="animate-spin text-stone-500" />
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center p-12 text-stone-500 font-serif italic text-sm">
                        No curator indices match the filter query selectors.
                      </td>
                    </tr>
                  ) : filteredUsers.map(user => (
                    <tr key={user.id} className="hover:bg-stone-850/40 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {user.avatarUrl ? (
                            <img 
                              src={user.avatarUrl} 
                              alt="Avatar" 
                              referrerPolicy="no-referrer"
                              className="h-10 w-10 rounded-full object-cover border border-stone-700" 
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-stone-800 border border-stone-700 flex items-center justify-center text-stone-300 font-bold uppercase text-xs">
                              {user.name ? user.name.slice(0, 2) : 'EV'}
                            </div>
                          )}
                          <div>
                            <p className="font-serif text-sm font-bold text-white">{user.name || 'Anonymous Collector'}</p>
                            <p className="text-[10px] text-stone-500 font-light mt-0.5 font-mono">{user.email || 'No email registered'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-mono text-xs uppercase text-stone-300 font-medium">
                        <div className="flex items-center gap-2">
                          {user.authType === 'google' && <Chrome size={12} className="text-red-400" />}
                          {user.authType === 'gmail_otp' && <Mail size={12} className="text-red-400" />}
                          {user.authType === 'phone_otp' && <Smartphone size={12} className="text-amber-400" />}
                          {user.authType === 'email' && <Terminal size={12} className="text-stone-400" />}
                          <span>{user.authType ? user.authType.replace('_', ' ') : 'Legacy'}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          {user.emailVerified || user.authType === 'google' || user.authType === 'gmail_otp' ? (
                            <span className="inline-flex items-center gap-1.5 bg-emerald-950/40 text-emerald-400 text-[9px] font-bold tracking-widest uppercase px-2 py-1 rounded border border-emerald-900">
                              <ShieldCheck size={10} /> Gmail Verified
                            </span>
                          ) : null}

                          {user.phoneVerified || user.authType === 'phone_otp' || user.phone ? (
                            <span className="inline-flex items-center gap-1.5 bg-amber-950/40 text-amber-500 text-[9px] font-bold tracking-widest uppercase px-2 py-1 rounded border border-amber-900">
                              <Smartphone size={10} /> SMS Active
                            </span>
                          ) : null}

                          {!user.emailVerified && !user.phoneVerified && !user.authType && (
                            <span className="text-[9px] font-bold text-stone-500 uppercase tracking-widest">
                              None
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider border ${
                          user.role === 'admin' 
                            ? 'bg-red-950/40 text-red-400 border-red-900' 
                            : 'bg-stone-950 text-stone-400 border-stone-800'
                        }`}>
                          {user.role?.toUpperCase() || 'USER'}
                        </span>
                      </td>
                      <td className="p-4 text-[10.5px] font-mono text-stone-400">
                        {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('en-US', { hour12: false }) : 'N/A'}
                      </td>
                      <td className="p-4 text-right">
                        {user.role !== 'admin' ? (
                          <button
                            onClick={() => handleDeleteUser(user.id, user.name)}
                            className="bg-stone-950 hover:bg-red-950/40 text-stone-500 hover:text-red-400 border border-stone-800 hover:border-red-900 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer"
                          >
                            <Trash2 size={12} className="inline mr-1" /> Revoke access
                          </button>
                        ) : (
                          <span className="text-stone-500 font-serif italic text-xs">Immutable Principal</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-stone-900 border border-stone-800 rounded-xl overflow-hidden shadow-xl">
          <div className="p-4 bg-stone-900/60 border-b border-stone-850 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-widest text-stone-400 flex items-center gap-2">
              <History size={14} className="text-purple-400" />
              <span>Login Activity Log Auditing</span>
            </span>
            <span className="text-[10px] font-mono text-stone-500">Showing last 100 entries</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-800 text-[10px] uppercase tracking-widest text-stone-400 bg-stone-900/50">
                  <th className="p-4 font-bold">Timestamp</th>
                  <th className="p-4 font-bold">User Identity</th>
                  <th className="p-4 font-bold">Authentication Channel</th>
                  <th className="p-4 font-bold">Client User Agent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="text-center p-12 text-stone-600">
                      <RefreshCw size={24} className="animate-spin text-stone-500" />
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center p-12 text-stone-500 font-serif italic text-sm">
                      No security logins logged in database audits yet.
                    </td>
                  </tr>
                ) : logs.map(log => (
                  <tr key={log.id} className="hover:bg-stone-850/40 text-stone-300 transition-colors">
                    <td className="p-4 font-mono text-xs font-semibold text-purple-400 select-all">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="p-4">
                      <p className="font-serif text-sm font-bold text-white mb-0.5">{log.name || 'Unknown User'}</p>
                      <p className="text-[10px] font-mono text-stone-500">{log.email || log.phone || `UID: ${log.userId.slice(-8)}`}</p>
                    </td>
                    <td className="p-4 font-mono text-xs text-stone-300">
                      <span className="inline-flex items-center gap-1.5 uppercase tracking-wider bg-stone-950 px-2.5 py-1 rounded text-[10px] font-bold text-stone-300 border border-stone-800/80">
                        {log.authType === 'google' && <Chrome size={11} className="text-red-400" />}
                        {log.authType === 'gmail_otp' && <Mail size={11} className="text-red-400" />}
                        {log.authType === 'phone_otp' && <Smartphone size={11} className="text-amber-400" />}
                        {log.authType === 'email' && <Terminal size={11} className="text-stone-400" />}
                        {log.authType}
                      </span>
                    </td>
                    <td className="p-4 text-[10.5px] font-mono text-stone-500 select-all truncate max-w-xs" title={log.device}>
                      {log.device || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
