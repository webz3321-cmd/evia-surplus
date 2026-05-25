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
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-stone-200 dark:border-white/5 pb-8">
        <div>
          <button 
            onClick={() => navigate('/admin.evia.3321')}
            className="flex items-center gap-2 text-[#A38A5F] text-[10px] uppercase tracking-[0.25em] font-black mb-3 hover:opacity-70 transition-all cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Operational Hub</span>
          </button>
          
          <div className="flex items-center gap-4">
            <h1 className="text-4xl font-serif font-black tracking-tight text-foreground lowercase">identity<span className="text-[#A38A5F]">.</span>registry</h1>
          </div>
          <p className="text-stone-400 text-[10px] font-black uppercase tracking-[0.3em] mt-2">Global Access Control & User Telemetry</p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={loadData}
            disabled={refreshing}
            className="flex items-center gap-3 bg-[#1A1A1A] dark:bg-[#FAF8F5] text-white dark:text-black px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-xl cursor-pointer"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            <span>Synchronize Registry</span>
          </button>
        </div>
      </div>

      {/* Stats Bento Grid Header */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Registry', value: users.length, icon: Users, color: 'text-[#A38A5F]', bg: 'bg-[#A38A5F]/5' },
          { label: 'SSO Secured', value: totalGmailVerified, icon: Mail, color: 'text-stone-600 dark:text-stone-400', bg: 'bg-stone-50 dark:bg-white/5' },
          { label: 'Verified SMS', value: totalPhoneVerified, icon: Smartphone, color: 'text-stone-600 dark:text-stone-400', bg: 'bg-stone-50 dark:bg-white/5' },
          { label: 'Security Logs', value: logs.length, icon: Activity, color: 'text-stone-600 dark:text-stone-400', bg: 'bg-stone-50 dark:bg-white/5' },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-[#0D0D0D] p-8 rounded-[32px] shadow-sm border border-stone-200 dark:border-white/5">
            <div className="flex justify-between items-start mb-6">
              <span className="text-[10px] uppercase tracking-[0.25em] font-black text-stone-400">{stat.label}</span>
              <stat.icon size={18} className={stat.color} />
            </div>
            <p className="text-3xl font-serif font-black text-foreground">{stat.value}</p>
            <div className="h-1 bg-stone-100 dark:bg-white/5 rounded-full mt-4 overflow-hidden">
              <div className={`${stat.color.replace('text-', 'bg-')} h-full opacity-60`} style={{ width: '100%' }}></div>
            </div>
          </div>
        ))}
      </div>

      {/* Segment Switcher */}
      <div className="flex gap-1 bg-stone-100/50 dark:bg-white/5 p-1.5 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-6 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'users' 
              ? 'bg-white dark:bg-black text-foreground shadow-sm' 
              : 'text-stone-400 hover:text-foreground'
          }`}
        >
          <UserCheck size={14} />
          <span>Curator Index</span>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-6 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'history' 
              ? 'bg-white dark:bg-black text-foreground shadow-sm' 
              : 'text-stone-400 hover:text-foreground'
          }`}
        >
          <Activity size={14} />
          <span>Activity Stream</span>
        </button>
      </div>

      {activeTab === 'users' ? (
        <div className="space-y-6">
          {/* Controls Panel */}
          <div className="flex flex-col lg:flex-row gap-6 items-center justify-between bg-white dark:bg-[#0D0D0D] border border-stone-200 dark:border-white/5 p-6 rounded-[32px] shadow-sm">
            <div className="relative w-full lg:w-96">
              <Search size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-[#A38A5F]" />
              <input
                type="text"
                placeholder="Search Identity Coordinates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-stone-50 dark:bg-black border border-stone-100 dark:border-white/5 focus:border-[#A38A5F] outline-none rounded-2xl pl-14 pr-6 py-4 text-xs font-bold text-foreground transition-all placeholder:text-stone-400 uppercase tracking-widest"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
              {[
                { id: 'all', label: 'All' },
                { id: 'gmail', label: 'SSO' },
                { id: 'phone', label: 'SMS' },
                { id: 'google', label: 'Google' },
                { id: 'admin', label: 'Admins' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setFilterType(f.id as any)}
                  className={`px-5 py-2.5 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer border ${
                    filterType === f.id 
                      ? 'bg-[#1A1A1A] dark:bg-[#FAF8F5] text-white dark:text-black border-transparent shadow-lg' 
                      : 'bg-transparent text-stone-400 border-stone-100 dark:border-white/5 hover:border-[#A38A5F]/40'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* User Table Card */}
          <div className="bg-white dark:bg-[#0D0D0D] border border-stone-200 dark:border-white/5 rounded-[40px] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-stone-100 dark:border-white/5 text-[9px] font-black uppercase tracking-[0.25em] text-[#A38A5F] bg-stone-50/30 dark:bg-black/20">
                    <th className="p-8">Entity Profile</th>
                    <th className="p-8">Auth Channel</th>
                    <th className="p-8">Clearance Level</th>
                    <th className="p-8">Activity Pulse</th>
                    <th className="p-8 text-right">Access Control</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50 dark:divide-white/5">
                  {loading ? (
                    <tr><td colSpan={5} className="p-20 text-center uppercase text-[10px] font-black tracking-widest text-[#A38A5F] animate-pulse">Syncing...</td></tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr><td colSpan={5} className="p-20 text-center font-serif italic text-stone-400">No registry entries found in the current sector.</td></tr>
                  ) : filteredUsers.map(user => (
                    <tr key={user.id} className="hover:bg-stone-50 dark:hover:bg-white/5 transition-colors group">
                      <td className="p-8">
                        <div className="flex items-center gap-5">
                          <div className="h-14 w-14 rounded-2xl bg-stone-100 dark:bg-black border border-stone-200 dark:border-white/5 flex items-center justify-center overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
                            {user.avatarUrl ? (
                              <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <span className="font-serif font-black text-xl text-[#A38A5F]">{user.name?.slice(0, 1) || 'E'}</span>
                            )}
                          </div>
                          <div className="space-y-1">
                            <p className="font-serif text-lg font-black text-foreground">{user.name || 'Incognito Collector'}</p>
                            <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">{user.email || 'coordinates hidden'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-8">
                        <div className="flex items-center gap-3">
                           {user.authType === 'google' && <Chrome size={14} className="text-[#A38A5F]" />}
                           <span className="text-[10px] font-black uppercase tracking-widest text-stone-500">{user.authType?.replace('_', ' ') || 'LEGACY'}</span>
                        </div>
                      </td>
                      <td className="p-8">
                        <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border ${
                          user.role === 'admin' 
                            ? 'bg-[#A38A5F]/10 text-[#A38A5F] border-[#A38A5F]/20' 
                            : 'bg-stone-50 dark:bg-black text-stone-400 border-stone-100 dark:border-white/5'
                        }`}>
                          {user.role || 'USER'}
                        </span>
                      </td>
                      <td className="p-8 text-[11px] font-black text-stone-400 uppercase tracking-widest">
                        {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="p-8 text-right">
                        {user.role !== 'admin' ? (
                          <button
                            onClick={() => handleDeleteUser(user.id, user.name)}
                            className="h-10 px-6 rounded-xl bg-rose-50/50 dark:bg-rose-950/10 text-rose-600 hover:bg-rose-50 text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer border border-rose-100 dark:border-rose-950/30"
                          >
                            Revoke
                          </button>
                        ) : (
                          <span className="text-stone-300 dark:text-stone-700 font-serif italic text-sm">Protected</span>
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
        <div className="bg-white dark:bg-[#0D0D0D] border border-stone-200 dark:border-white/5 rounded-[40px] overflow-hidden shadow-sm">
          <div className="p-8 border-b border-stone-100 dark:border-white/5 flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="font-serif font-black text-xl flex items-center gap-3 text-foreground">
                <History size={20} className="text-[#A38A5F]" />
                Acquisition Activity
              </h3>
              <p className="text-[9px] font-black uppercase tracking-widest text-stone-400">Real-time Session Monitoring</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-100 dark:border-white/5 text-[9px] font-black uppercase tracking-[0.25em] text-[#A38A5F] bg-stone-50/30 dark:bg-black/20">
                  <th className="p-8">Timestamp Coordinates</th>
                  <th className="p-8">Entity Identity</th>
                  <th className="p-8">Entry Channel</th>
                  <th className="p-8">Telemetry Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50 dark:divide-white/5">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-stone-50 dark:hover:bg-white/5 transition-colors">
                    <td className="p-8 font-black text-[11px] text-[#A38A5F] uppercase tracking-widest">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="p-8">
                      <p className="font-serif text-base font-black text-foreground mb-1">{log.name || 'Unknown'}</p>
                      <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest truncate max-w-[150px]">{log.email || 'No email'}</p>
                    </td>
                    <td className="p-8">
                      <span className="text-[10px] font-black uppercase tracking-widest text-stone-500 bg-stone-50 dark:bg-black px-3 py-1.5 rounded-lg border border-stone-100 dark:border-white/5">{log.authType}</span>
                    </td>
                    <td className="p-8 text-[10px] font-black text-stone-400 uppercase tracking-widest truncate max-w-xs" title={log.device}>
                      {log.device}
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
