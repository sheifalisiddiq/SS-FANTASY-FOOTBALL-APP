
import React, { useState, useEffect, useMemo } from 'react';
import { 
  getDatabase, 
  ref, 
  set, 
  get, 
  onValue 
} from 'firebase/database';
import { initializeApp } from 'firebase/app';
import Login from './components/Login';
import Gateway from './components/Gateway';
import AdminPanel from './components/AdminPanel';
import DraftView from './components/DraftView';
import FixturesView from './components/FixturesView';
import StatsCenter from './components/StatsCenter';
import PitchView from './components/PitchView';
import LeagueTable from './components/LeagueTableView';
import { Trophy, Users, Calendar, BarChart3, ShieldAlert, LogOut, Settings, User as UserIcon } from 'lucide-react';
import { User, TournamentData } from './types';

const firebaseConfig = {
  databaseURL: "https://mylocalfantasy-default-rtdb.asia-southeast1.firebasedatabase.app/"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [tournamentId, setTournamentId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState('pitch');
  const [loading, setLoading] = useState(true);
  const [tournamentData, setTournamentData] = useState<TournamentData | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('fantasy_user');
    const savedTid = localStorage.getItem('active_tournament_id');
    
    if (savedUser) setUser(JSON.parse(savedUser));
    if (savedTid) setTournamentId(savedTid);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (tournamentId && user) {
      const tRef = ref(db, `tournaments/${tournamentId}`);
      const unsubscribe = onValue(tRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val() as TournamentData;
          setTournamentData(data);
          
          // Multi-user logic: If the user doesn't exist in the tournament users map, initialize them
          if (!data.users || !data.users[user.username]) {
            const userInTournamentRef = ref(db, `tournaments/${tournamentId}/users/${user.username}`);
            const freshUser: User = {
              username: user.username,
              teamName: user.teamName || `${user.username}'s XI`,
              selectedPlayerIds: [],
              starterIds: [],
              isLocked: false
            };
            set(userInTournamentRef, freshUser);
          } else {
            // Sync local user state with tournament-specific user data
            const serverUser = data.users[user.username];
            setUser(serverUser);
            localStorage.setItem('fantasy_user', JSON.stringify(serverUser));
          }
        } else {
          localStorage.removeItem('active_tournament_id');
          setTournamentId(null);
        }
      });
      return () => unsubscribe();
    }
  }, [tournamentId, user?.username]);

  const handleLogout = () => {
    localStorage.removeItem('fantasy_user');
    setUser(null);
    setTournamentId(null);
    setTournamentData(null);
    setIsAdmin(false);
    setActiveTab('pitch');
  };

  const handleLeaveTournament = () => {
    localStorage.removeItem('active_tournament_id');
    setTournamentId(null);
    setTournamentData(null);
    setIsAdmin(false);
    setActiveTab('pitch');
  };

  const handleJoinConfirmed = (id: string) => {
    localStorage.setItem('active_tournament_id', id);
    setTournamentId(id);
  };

  const handleUpdateTeam = (playerIds: string[], starterIds: string[]) => {
    if (!user || !tournamentId || user.isLocked) return;
    const userRef = ref(db, `tournaments/${tournamentId}/users/${user.username}`);
    const updatedUserData = {
      ...user,
      selectedPlayerIds: playerIds,
      starterIds: starterIds
    };
    set(userRef, updatedUserData);
    setUser(updatedUserData);
    localStorage.setItem('fantasy_user', JSON.stringify(updatedUserData));
  };

  const handleToggleLock = (locked: boolean) => {
    if (!user || !tournamentId) return;
    const userRef = ref(db, `tournaments/${tournamentId}/users/${user.username}/isLocked`);
    set(userRef, locked);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pitch"></div>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={(u: any) => setUser(u)} db={db} />;
  }

  if (!tournamentId) {
    return <Gateway user={user} onJoinSuccess={handleJoinConfirmed} db={db} />;
  }

  return (
    <div className="min-h-screen bg-[#121212] text-white pb-20 font-sans">
      <header className="bg-[#1a1a1a] border-b border-white/10 p-4 sticky top-0 z-50 shadow-2xl">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-pitch p-1.5 rounded-lg shadow-lg shadow-pitch/20">
              <Trophy size={20} className="text-[#121212]" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight uppercase tracking-tighter">
                {tournamentData?.name || 'Loading...'}
              </h1>
              <p className="text-[10px] text-pitch font-mono tracking-widest uppercase">
                ID: #{tournamentId}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="hidden md:flex flex-col items-end mr-2">
              <span className="text-[10px] font-black uppercase text-zinc-500">Manager</span>
              <span className="text-xs font-bold text-white italic">{user.username}</span>
            </div>
            <button 
              onClick={() => setIsAdmin(!isAdmin)}
              className={`p-2 rounded-xl transition-all ${isAdmin ? 'bg-pitch text-black' : 'bg-zinc-800 text-white/60 hover:text-white'}`}
              title="Admin Panel"
            >
              <Settings size={20} />
            </button>
            <button 
              onClick={handleLogout}
              className="p-2 bg-zinc-800 rounded-xl text-white/60 hover:text-red-500 transition-all"
              title="Logout User"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 animate-in fade-in duration-500">
        {isAdmin && tournamentData ? (
          <AdminPanel 
            tournamentId={tournamentId} 
            tournamentData={tournamentData} 
            user={user}
            db={db} 
            onClose={() => setIsAdmin(false)} 
          />
        ) : (
          <>
            {activeTab === 'pitch' && <PitchView user={user} players={tournamentData?.players || []} onToggleLock={handleToggleLock} />}
            {activeTab === 'draft' && <DraftView user={user} players={tournamentData?.players || []} onUpdateTeam={handleUpdateTeam} standings={tournamentData?.standings || []} />}
            {activeTab === 'fixtures' && <FixturesView matches={tournamentData?.matches || []} standings={tournamentData?.standings || []} players={tournamentData?.players || []} />}
            {activeTab === 'leaderboard' && <LeagueTable standings={tournamentData?.standings || []} users={tournamentData?.users || {}} players={tournamentData?.players || []} />}
            {activeTab === 'stats' && <StatsCenter players={tournamentData?.players || []} users={tournamentData?.users || {}} standings={tournamentData?.standings || []} />}
          </>
        )}
      </main>

      {!isAdmin && (
        <nav className="fixed bottom-0 left-0 right-0 bg-[#1a1a1a]/95 backdrop-blur-md border-t border-white/10 z-50">
          <div className="max-w-xl mx-auto flex justify-around p-2">
            <NavButton active={activeTab === 'pitch'} icon={<Trophy size={22}/>} label="Squad" onClick={() => setActiveTab('pitch')} />
            <NavButton active={activeTab === 'draft'} icon={<Users size={22}/>} label="Draft" onClick={() => setActiveTab('draft')} />
            <NavButton active={activeTab === 'fixtures'} icon={<Calendar size={22}/>} label="Fix" onClick={() => setActiveTab('fixtures')} />
            <NavButton active={activeTab === 'leaderboard'} icon={<ShieldAlert size={22}/>} label="Table" onClick={() => setActiveTab('leaderboard')} />
            <NavButton active={activeTab === 'stats'} icon={<BarChart3 size={22}/>} label="Stats" onClick={() => setActiveTab('stats')} />
          </div>
        </nav>
      )}
    </div>
  );
}

function NavButton({ active, icon, label, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={`flex-1 flex flex-col items-center gap-1 p-2 transition-all ${active ? 'text-pitch scale-110' : 'text-white/40 hover:text-white/60'}`}
    >
      {icon}
      <span className="text-[10px] font-black uppercase tracking-tighter">{label}</span>
    </button>
  );
}
