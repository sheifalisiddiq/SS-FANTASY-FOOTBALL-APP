
import React, { useState } from 'react';
import { Match, TeamStanding, Player } from '../types';
import { Trophy, ChevronDown, ChevronUp, Users, Info, Star, Goal } from 'lucide-react';

interface Props {
  matches: Match[];
  standings: TeamStanding[];
  players?: Player[]; 
}

const FixturesView: React.FC<Props> = ({ matches, standings, players = [] }) => {
  const [expandedMatch, setExpandedMatch] = useState<string | null>(null);
  
  const gameweeks = Array.from(new Set((matches || []).map(m => m.gameweek))).sort((a: number, b: number) => a - b);

  const getPlayerData = (id: string) => players.find(p => p.id === id);

  const groupScorers = (scorers: { playerId: string; count: number }[], teamId: string) => {
    // We group by playerId to ensure clean display even if saved multiple times
    const grouped: Record<string, number> = {};
    scorers.forEach(s => {
      const player = getPlayerData(s.playerId);
      // Filter by team. Note: if player changed teams later, we rely on the player's teamId or match metadata if available.
      // In this setup, players are tied to teams in the main database.
      if (player && player.teamId === teamId) {
        grouped[s.playerId] = (grouped[s.playerId] || 0) + (s.count || 1);
      }
    });

    return Object.entries(grouped).map(([id, count]) => ({
      name: getPlayerData(id)?.name || 'Unknown',
      count
    }));
  };

  const getDiscipline = (playerIds: string[], teamId: string, type: 'Y' | 'R') => {
    return (playerIds || [])
      .map(id => getPlayerData(id))
      .filter(p => p && p.teamId === teamId)
      .map(p => ({ name: p!.name, type }));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-12 pb-24">
      <div className="text-center space-y-2">
        <h2 className="text-4xl font-black italic tracking-tighter uppercase">Match <span className="text-pitch">Reports</span></h2>
        <p className="text-zinc-500 text-sm font-bold tracking-widest uppercase">Live Fixtures & Historical Data</p>
      </div>

      <div className="space-y-12">
        {gameweeks.length === 0 ? (
          <div className="bg-zincSub border-2 border-dashed border-zinc-800 rounded-3xl p-16 text-center">
            <div className="flex justify-center mb-4">
              <Info className="text-zinc-700" size={48} />
            </div>
            <h3 className="text-xl font-bold text-zinc-500">Empty Schedule</h3>
            <p className="text-zinc-600 text-sm">Waiting for admin to announce fixtures.</p>
          </div>
        ) : (
          gameweeks.map(gw => (
            <section key={gw} className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-zinc-800" />
                <h3 className="text-xs font-black uppercase text-zinc-500 tracking-[0.2em]">Gameweek {gw}</h3>
                <div className="h-px flex-1 bg-zinc-800" />
              </div>
              
              <div className="grid gap-4">
                {(matches || []).filter(m => m.gameweek === gw).map(m => {
                  const teamA = standings.find(s => s.id === m.teamAId);
                  const teamB = standings.find(s => s.id === m.teamBId);
                  const isExpanded = expandedMatch === m.id;

                  const scorersA = groupScorers(m.scorers || [], m.teamAId);
                  const scorersB = groupScorers(m.scorers || [], m.teamBId);
                  const yellowsA = getDiscipline(m.yellowCardPlayerIds || [], m.teamAId, 'Y');
                  const yellowsB = getDiscipline(m.yellowCardPlayerIds || [], m.teamBId, 'Y');
                  const redsA = getDiscipline(m.redCardPlayerIds || [], m.teamAId, 'R');
                  const redsB = getDiscipline(m.redCardPlayerIds || [], m.teamBId, 'R');

                  return (
                    <div key={m.id} className="bg-zincSub border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-700 transition-all shadow-xl">
                      <div 
                        className={`p-6 flex flex-col sm:flex-row items-center justify-between gap-4 cursor-pointer ${m.isPlayed ? 'hover:bg-zinc-800/50' : ''}`}
                        onClick={() => m.isPlayed ? setExpandedMatch(isExpanded ? null : m.id) : null}
                      >
                        <div className="flex-1 text-center sm:text-right font-black uppercase text-sm tracking-tight text-white">{teamA?.team || "TBD"}</div>
                        
                        <div className="flex flex-col items-center gap-1 min-w-[140px]">
                          <div className={`px-6 py-2 rounded-xl border flex items-center justify-center min-w-[100px] transition-all ${m.isPlayed ? 'bg-pitch/10 border-pitch/30 text-pitch' : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}>
                            {m.isPlayed ? (
                              <span className="text-2xl font-black italic tracking-widest">{m.scoreA} - {m.scoreB}</span>
                            ) : (
                              <span className="text-xs font-black uppercase tracking-widest">VS</span>
                            )}
                          </div>
                          <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mt-1">{m.date}</div>
                        </div>

                        <div className="flex-1 text-center sm:text-left font-black uppercase text-sm tracking-tight text-white">{teamB?.team || "TBD"}</div>
                        
                        {m.isPlayed && (
                          <div className="hidden sm:block">
                            {isExpanded ? <ChevronUp className="text-zinc-600" size={20} /> : <ChevronDown className="text-zinc-600" size={20} />}
                          </div>
                        )}
                      </div>

                      {isExpanded && m.isPlayed && (
                        <div className="bg-zinc-900/50 border-t border-zinc-800 p-6 animate-in slide-in-from-top-2 duration-300 space-y-6">
                          <div className="grid grid-cols-2 gap-8 text-xs">
                             <div className="space-y-4">
                               <div>
                                 <h5 className="font-black uppercase text-pitch border-b border-zinc-800 pb-1 mb-2 flex items-center gap-2"><Goal size={12}/> {teamA?.team} Goals</h5>
                                 {scorersA.length > 0 ? scorersA.map((s,i)=>(
                                   <div key={i} className="flex justify-between items-center text-zinc-400 py-0.5">
                                     <span className="font-bold">{s.name}</span>
                                     <span className="text-pitch font-black">{s.count > 1 ? `x${s.count}` : ''}</span>
                                   </div>
                                 )) : <div className="text-zinc-600 italic py-1">No scorers recorded</div>}
                               </div>

                               {(yellowsA.length > 0 || redsA.length > 0) && (
                                 <div>
                                   <h5 className="font-black uppercase text-zinc-500 border-b border-zinc-800 pb-1 mb-2 flex items-center gap-2">Cards</h5>
                                   {yellowsA.map((c, i) => <div key={`y-${i}`} className="text-yellow-500 font-bold italic py-0.5">{c.name} (Y)</div>)}
                                   {redsA.map((c, i) => <div key={`r-${i}`} className="text-red-500 font-bold italic py-0.5">{c.name} (R)</div>)}
                                 </div>
                               )}
                             </div>

                             <div className="space-y-4 text-right">
                               <div>
                                 <h5 className="font-black uppercase text-zinc-400 border-b border-zinc-800 pb-1 mb-2 flex items-center gap-2 justify-end">{teamB?.team} Goals <Goal size={12}/></h5>
                                 {scorersB.length > 0 ? scorersB.map((s,i)=>(
                                   <div key={i} className="flex justify-between items-center text-zinc-400 py-0.5">
                                     <span className="text-zinc-400 font-black">{s.count > 1 ? `x${s.count}` : ''}</span>
                                     <span className="font-bold">{s.name}</span>
                                   </div>
                                 )) : <div className="text-zinc-600 italic py-1">No scorers recorded</div>}
                               </div>

                               {(yellowsB.length > 0 || redsB.length > 0) && (
                                 <div>
                                   <h5 className="font-black uppercase text-zinc-500 border-b border-zinc-800 pb-1 mb-2 flex items-center gap-2 justify-end">Cards</h5>
                                   {yellowsB.map((c, i) => <div key={`y-${i}`} className="text-yellow-500 font-bold italic py-0.5">{c.name} (Y)</div>)}
                                   {redsB.map((c, i) => <div key={`r-${i}`} className="text-red-500 font-bold italic py-0.5">{c.name} (R)</div>)}
                                 </div>
                               )}
                             </div>
                          </div>

                          {m.motmPlayerId && (
                            <div className="mt-4 pt-4 border-t border-zinc-800 flex items-center justify-center gap-3">
                              <Star size={16} className="text-pitch" />
                              <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Man of the Match:</span>
                              <span className="text-sm font-black italic uppercase text-pitch">{getPlayerData(m.motmPlayerId)?.name}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
};

export default FixturesView;
