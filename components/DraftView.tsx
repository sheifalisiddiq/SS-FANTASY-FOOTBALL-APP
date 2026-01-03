
import React, { useState, useMemo, useCallback } from 'react';
import { Player, User, Position, TeamStanding } from '../types';
import { MAX_BUDGET, MAX_PLAYERS } from '../constants';
import { Search, Info, Plus, Minus, CreditCard, Users, Star, Lock } from 'lucide-react';

interface Props {
  user?: User;
  players: Player[];
  standings?: TeamStanding[];
  onUpdateTeam: (playerIds: string[], starterIds: string[]) => void;
}

const DraftView: React.FC<Props> = ({ user, players, onUpdateTeam, standings = [] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<Position | 'ALL'>('ALL');

  const selectedPlayerIds = user?.selectedPlayerIds || [];
  const starterIds = user?.starterIds || [];
  const isLocked = user?.isLocked || false;

  const getTeamName = (teamId: string) => {
    return standings.find(s => s.id === teamId)?.team || "FA";
  };

  const selectedPlayers = useMemo(() => {
    return players.filter(p => selectedPlayerIds.includes(p.id));
  }, [players, selectedPlayerIds]);

  const spent = useMemo(() => {
    return selectedPlayers.reduce((sum, p) => sum + p.price, 0);
  }, [selectedPlayers]);

  const filteredPlayers = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return players.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(term);
      const matchesFilter = activeFilter === 'ALL' || p.position === activeFilter;
      return matchesSearch && matchesFilter;
    }).slice(0, 50);
  }, [players, searchTerm, activeFilter]);

  const handleTogglePlayer = useCallback((player: Player) => {
    if (!user || isLocked) return;
    const isSelected = selectedPlayerIds.includes(player.id);
    if (isSelected) {
      const newIds = selectedPlayerIds.filter(id => id !== player.id);
      const newStarterIds = starterIds.filter(id => id !== player.id);
      onUpdateTeam(newIds, newStarterIds);
    } else {
      if (selectedPlayerIds.length >= MAX_PLAYERS) {
        alert("Squad Full (9/9)");
        return;
      }
      if (spent + player.price > MAX_BUDGET) {
        alert("Insufficient Credits!");
        return;
      }
      const newIds = [...selectedPlayerIds, player.id];
      const newStarterIds = starterIds.length < 6 ? [...starterIds, player.id] : starterIds;
      onUpdateTeam(newIds, newStarterIds);
    }
  }, [user, isLocked, selectedPlayerIds, starterIds, spent, onUpdateTeam]);

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {isLocked && (
        <div className="bg-yellow-500 p-4 rounded-2xl flex items-center justify-between shadow-2xl shadow-yellow-500/10 animate-in slide-in-from-top-4 duration-500">
           <div className="flex items-center gap-3">
              <div className="bg-black/20 p-2 rounded-xl">
                 <Lock className="text-black" size={20} />
              </div>
              <div>
                 <h3 className="text-black font-black uppercase italic text-sm tracking-tight leading-none">Market Closed</h3>
                 <p className="text-black/60 text-[10px] font-bold uppercase tracking-widest mt-1">Draft Locked by Manager</p>
              </div>
           </div>
           <span className="text-black/30 font-black italic text-xl tracking-tighter uppercase select-none opacity-50">Locked</span>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<CreditCard className="text-pitch" size={16}/>} label="Credits Left" value={`${MAX_BUDGET - spent}`} subText={`Spent: ${spent}`} />
        <StatCard icon={<Users className="text-pitch" size={16}/>} label="Squad" value={`${selectedPlayerIds.length}/9`} subText="Total Count" />
        <StatCard icon={<Star className="text-pitch" size={16}/>} label="Score" value={selectedPlayers.reduce((sum, p) => sum + p.points, 0).toString()} subText="Season Points" />
        <StatCard icon={<Info className="text-pitch" size={16}/>} label="Team" value={user.teamName} subText="Club Identity" />
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 space-y-6">
          <div className="flex flex-col sm:flex-row items-center gap-4 bg-zincSub p-4 rounded-2xl border border-zinc-800 shadow-xl sticky top-20 z-40 backdrop-blur-sm bg-zincSub/90">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
              <input type="text" placeholder="Search player pool..." className="w-full bg-zinc-900 border border-zinc-700 rounded-xl py-2 pl-10 pr-4 text-sm outline-none focus:border-pitch" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <div className="flex gap-1 overflow-x-auto w-full sm:w-auto no-scrollbar">
              {['ALL', ...Object.values(Position)].map(pos => (
                <button key={pos} onClick={() => setActiveFilter(pos as any)} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all whitespace-nowrap ${activeFilter === pos ? 'bg-pitch text-black' : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'}`}>{pos}</button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {filteredPlayers.map(p => (
              <PlayerListItem 
                key={p.id} 
                player={p} 
                teamName={getTeamName(p.teamId)}
                isSelected={selectedPlayerIds.includes(p.id)}
                onToggle={() => handleTogglePlayer(p)}
                disabled={isLocked || (!selectedPlayerIds.includes(p.id) && (selectedPlayerIds.length >= MAX_PLAYERS || spent + p.price > MAX_BUDGET))}
                marketLocked={isLocked}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const PlayerListItem: React.FC<{ player: Player, teamName: string, isSelected: boolean, onToggle: () => void, disabled: boolean, marketLocked?: boolean }> = ({ player, teamName, isSelected, onToggle, disabled, marketLocked }) => (
  <div className={`relative bg-zincSub border transition-all rounded-xl p-3 flex items-center justify-between group ${isSelected ? 'border-pitch bg-pitch/5' : 'border-zinc-800'} ${disabled && !isSelected ? 'opacity-30' : 'hover:border-zinc-700'}`}>
    <div className="flex items-center gap-3">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-black text-[10px] ${isSelected ? 'bg-pitch text-black' : 'bg-zinc-800 text-zinc-500'}`}>{player.position}</div>
      <div>
        <h4 className="font-bold text-xs uppercase italic truncate max-w-[140px]">{player.name} <span className="text-[9px] text-zinc-600 font-bold ml-1">({teamName})</span></h4>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] font-mono text-zinc-500">{player.price} CR</span>
          <span className="text-[10px] font-black text-pitch">{player.points} PTS</span>
        </div>
      </div>
    </div>
    <button 
      onClick={onToggle} 
      disabled={disabled} 
      className={`p-1.5 rounded-lg transition-all ${marketLocked ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed' : isSelected ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-pitch/10 text-pitch group-hover:bg-pitch group-hover:text-black'}`}
    >
      {marketLocked ? <Lock size={18}/> : isSelected ? <Minus size={18}/> : <Plus size={18}/>}
    </button>
  </div>
);

const StatCard: React.FC<{ icon: any, label: string, value: string, subText: string }> = ({ icon, label, value, subText }) => (
  <div className="bg-zincSub border border-zinc-800 p-4 rounded-2xl shadow-xl hover:border-zinc-700 transition-all">
    <div className="flex items-center gap-2 text-zinc-500 text-[9px] font-black uppercase tracking-widest mb-1">{icon} {label}</div>
    <div className="text-xl font-black italic">{value}</div>
    <div className="text-[9px] text-zinc-500 uppercase font-bold mt-0.5 tracking-tight">{subText}</div>
  </div>
);

export default DraftView;
