
import React, { useMemo, useState } from 'react';
import { Player, User, TeamStanding } from '../types';
import { Target, Star, Flame, User as UserIcon, Medal, Award, TrendingUp } from 'lucide-react';

interface Props {
  players: Player[];
  users: Record<string, User>;
  standings?: TeamStanding[];
}

const StatsCenter: React.FC<Props> = ({ players, users, standings = [] }) => {
  const [activeTab, setActiveTab] = useState<'SCORERS' | 'ASSISTS' | 'FANTASY' | 'CARDS'>('SCORERS');

  const getTeamName = (teamId: string) => {
    return standings.find(s => s.id === teamId)?.team || "FA";
  };

  const topScorers = useMemo(() => {
    return [...(players || [])]
      .filter(p => (p.goals || 0) > 0)
      .sort((a, b) => (b.goals || 0) - (a.goals || 0))
      .slice(0, 10);
  }, [players]);

  const topAssists = useMemo(() => {
    return [...(players || [])]
      .filter(p => (p.assists || 0) > 0)
      .sort((a, b) => (b.assists || 0) - (a.assists || 0))
      .slice(0, 10);
  }, [players]);

  const fantasyBoard = useMemo(() => {
    return Object.values(users || {}).map((u: User) => {
      const selectedIds = u.selectedPlayerIds || [];
      const teamPlayers = players.filter(p => selectedIds.includes(p.id));
      const totalPoints = teamPlayers.reduce((sum, p) => sum + (p.points || 0), 0);
      return { ...u, totalPoints, selectedPlayerIds: selectedIds };
    }).sort((a, b) => b.totalPoints - a.totalPoints);
  }, [users, players]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-10 pb-24">
      <div className="text-center space-y-2">
        <h2 className="text-4xl font-black italic tracking-tighter uppercase">Stats <span className="text-pitch">Center</span></h2>
        <p className="text-zinc-500 text-sm font-bold tracking-widest uppercase">Analytical Intelligence Dashboard</p>
      </div>

      <div className="flex bg-zinc-900 p-1.5 rounded-2xl border border-zinc-800 overflow-x-auto no-scrollbar">
        <StatTab active={activeTab === 'SCORERS'} onClick={() => setActiveTab('SCORERS')} icon={<Target size={14}/>} label="Top Scorers" />
        <StatTab active={activeTab === 'ASSISTS'} onClick={() => setActiveTab('ASSISTS'} icon={<Award size={14}/>} label="Top Assists" />
        <StatTab active={activeTab === 'FANTASY'} onClick={() => setActiveTab('FANTASY')} icon={<TrendingUp size={14}/>} label="Fantasy Board" />
        <StatTab active={activeTab === 'CARDS'} onClick={() => setActiveTab('CARDS')} icon={<Flame size={14}/>} label="Discipline" />
      </div>

      <div className="bg-zincSub rounded-3xl border border-zinc-800 shadow-2xl overflow-hidden min-h-[500px]">
        {activeTab === 'SCORERS' && (
          <StatsTable items={topScorers} valueKey="goals" label="Goals" icon={<Target className="text-pitch" size={16}/>} getTeamName={getTeamName} />
        )}
        {activeTab === 'ASSISTS' && (
          <StatsTable items={topAssists} valueKey="assists" label="Assists" icon={<Award className="text-blue-500" size={16}/>} getTeamName={getTeamName} />
        )}
        {activeTab === 'CARDS' && (
          <StatsTable items={(players || []).filter(p => (p.yellowCards || 0) > 0 || (p.redCards || 0) > 0)} valueKey="yellowCards" label="Yellows" secondaryValueKey="redCards" secondaryLabel="Reds" getTeamName={getTeamName} />
        )}
        {activeTab === 'FANTASY' && (
          <div className="p-8">
             <table className="w-full text-left">
               <thead>
                 <tr className="text-[10px] uppercase font-black text-zinc-500 tracking-widest border-b border-zinc-800">
                    <th className="px-4 py-4">Manager / Squad</th>
                    <th className="px-4 py-4 text-right">Season Points</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-zinc-800">
                  {fantasyBoard.map((u, i) => (
                    <tr key={u.username} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="px-4 py-5 flex items-center gap-4">
                        <span className="text-zinc-700 font-black italic w-6 text-lg">#{i+1}</span>
                        <div>
                          <div className="font-black text-sm uppercase italic text-white tracking-tight">{u.teamName}</div>
                          <div className="text-[10px] text-zinc-500 font-bold">@{u.username}</div>
                        </div>
                      </td>
                      <td className="px-4 py-5 text-right font-black text-pitch text-2xl italic tracking-tighter">{u.totalPoints}</td>
                    </tr>
                  ))}
               </tbody>
             </table>
          </div>
        )}
      </div>
    </div>
  );
};

const StatsTable: React.FC<{items: any[], valueKey: string, label: string, icon?: React.ReactNode, secondaryValueKey?: string, secondaryLabel?: string, getTeamName: (id: string) => string}> = ({items, valueKey, label, icon, secondaryValueKey, secondaryLabel, getTeamName}) => (
  <div className="p-8">
     <table className="w-full text-left">
        <thead>
          <tr className="text-[10px] uppercase font-black text-zinc-500 tracking-widest border-b border-zinc-800">
            <th className="px-4 py-4">Player Performance</th>
            <th className="px-4 py-4 text-center">{label}</th>
            {secondaryLabel && <th className="px-4 py-4 text-center">{secondaryLabel}</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800">
          {items.map((p, i) => (
            <tr key={p.id} className="hover:bg-zinc-800/30 transition-colors">
              <td className="px-4 py-5 flex items-center gap-4">
                 <span className="text-zinc-700 font-black italic w-6 text-lg">#{i+1}</span>
                 <div>
                    <div className="font-black text-sm uppercase italic text-white tracking-tight">
                      {p.name} <span className="text-zinc-500 font-bold ml-1 text-[10px]">({getTeamName(p.teamId)})</span>
                    </div>
                    <div className="text-[10px] text-zinc-500 font-bold uppercase">{p.position}</div>
                 </div>
              </td>
              <td className="px-4 py-5 text-center font-black text-xl italic text-white flex items-center justify-center gap-2">
                {p[valueKey] || 0} {icon}
              </td>
              {secondaryValueKey && <td className="px-4 py-5 text-center font-black text-xl italic text-red-500">{p[secondaryValueKey] || 0}</td>}
            </tr>
          ))}
        </tbody>
     </table>
  </div>
);

const StatTab: React.FC<{active: boolean, onClick: () => void, label: string, icon: React.ReactNode}> = ({active, onClick, label, icon}) => (
  <button 
    onClick={onClick}
    className={`flex-1 flex items-center justify-center gap-2 py-4 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${active ? 'bg-zinc-800 text-pitch shadow-inner' : 'text-zinc-600 hover:text-zinc-300'}`}
  >
    {icon} {label}
  </button>
);

export default StatsCenter;