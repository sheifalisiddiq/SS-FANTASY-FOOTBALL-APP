
import React, { useState, useMemo, useEffect } from 'react';
import { Player, TeamStanding, Position, Match, ScoringRules, TournamentData, User } from '../types';
import { Shield, Save, Plus, Trash2, Users, Sword, Calendar, AlertTriangle, Edit3, Settings, PlusCircle, Search, Star, UserPlus, SlidersHorizontal, Lock, CheckCircle2, X, UserPlus2, Unlock, UserRoundCheck } from 'lucide-react';
import { ref, set } from 'firebase/database';

interface Props {
  tournamentId: string;
  tournamentData: TournamentData;
  user: any;
  db: any;
  onClose: () => void;
}

const AdminPanel: React.FC<Props> = ({ 
  tournamentId, tournamentData, user, db, onClose 
}) => {
  const [password, setPassword] = useState('');
  const [authenticatedByPass, setAuthenticatedByPass] = useState(false);
  const [activeTab, setActiveTab] = useState<'REPORT' | 'ROSTER' | 'TEAMS' | 'FIXTURES' | 'RULES'>('REPORT');
  
  // New Player Form State
  const [showAddPlayer] = useState(false);
  const [newPlayer, setNewPlayer] = useState({
    name: '',
    position: Position.MID,
    price: 7,
    teamId: ''
  });

  // Match Finalizer States
  const [selectedMatchId, setSelectedMatchId] = useState('');
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [scorersA, setScorersA] = useState<string[]>([]);
  const [scorersB, setScorersB] = useState<string[]>([]);
  const [assistersA, setAssistersA] = useState<string[]>([]);
  const [assistersB, setAssistersB] = useState<string[]>([]);
  const [yellowsA, setYellowsA] = useState<string[]>([]);
  const [yellowsB, setYellowsB] = useState<string[]>([]);
  const [redsA, setRedsA] = useState<string[]>([]);
  const [redsB, setRedsB] = useState<string[]>([]);
  const [motmId, setMotmId] = useState('');

  const players = tournamentData?.players || [];
  const standings = tournamentData?.standings || [];
  const matches = tournamentData?.matches || [];
  const tournamentUsers = tournamentData?.users || {};
  const scoringRules = tournamentData?.scoringRules;
  const adminPassword = tournamentData?.adminPassword || "";

  const onUpdatePlayers = (newPlayers: Player[]) => set(ref(db, `tournaments/${tournamentId}/players`), newPlayers);
  const onUpdateStandings = (newStandings: TeamStanding[]) => set(ref(db, `tournaments/${tournamentId}/standings`), newStandings);
  const onUpdateMatches = (newMatches: Match[]) => set(ref(db, `tournaments/${tournamentId}/matches`), newMatches);
  const onUpdateRules = (newRules: ScoringRules) => set(ref(db, `tournaments/${tournamentId}/scoringRules`), newRules);

  const isAuthenticated = authenticatedByPass || tournamentData?.createdBy === user?.username;

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === adminPassword) setAuthenticatedByPass(true);
    else alert("Invalid Admin Security PIN.");
  };

  const currentMatch = useMemo(() => matches.find(m => m.id === selectedMatchId), [selectedMatchId, matches]);
  const teamAPlayers = useMemo(() => players.filter(p => p.teamId === currentMatch?.teamAId), [players, currentMatch]);
  const teamBPlayers = useMemo(() => players.filter(p => p.teamId === currentMatch?.teamBId), [players, currentMatch]);
  const allEligiblePlayers = [...teamAPlayers, ...teamBPlayers];

  // Clean IDs for saving
  const getCleanIds = (ids: string[]) => ids.filter(id => id && id.length > 0);

  const handleAddPlayer = () => {
    if (!newPlayer.name.trim()) {
      alert("Please enter a player name.");
      return;
    }

    const playerObj: Player = {
      id: `p-${Date.now()}-${newPlayer.name.toLowerCase().replace(/\s/g, '-')}`,
      name: newPlayer.name.trim(),
      position: newPlayer.position,
      price: newPlayer.price,
      points: 0,
      batch: "Season 2024",
      teamId: newPlayer.teamId,
      goals: 0,
      assists: 0,
      yellowCards: 0,
      redCards: 0
    };

    onUpdatePlayers([...players, playerObj]);
    setNewPlayer({ name: '', position: Position.MID, price: 7, teamId: '' });
    alert(`${playerObj.name} added to Registry.`);
  };

  const handleUnlockUser = (username: string) => {
    if (confirm(`Unlock draft for ${username}? This allows them to edit their roster again.`)) {
      set(ref(db, `tournaments/${tournamentId}/users/${username}/isLocked`), false);
    }
  };

  const finalizeMatch = () => {
    if (!currentMatch || !scoringRules) return;

    const validScorersA = getCleanIds(scorersA);
    const validScorersB = getCleanIds(scorersB);
    const validAssistsA = getCleanIds(assistersA);
    const validAssistsB = getCleanIds(assistersB);
    const validYellowsA = getCleanIds(yellowsA);
    const validYellowsB = getCleanIds(yellowsB);
    const validRedsA = getCleanIds(redsA);
    const validRedsB = getCleanIds(redsB);

    const updatedPlayers = players.map(p => {
      let pts = p.points;
      let pGoals = p.goals || 0;
      let pAssists = p.assists || 0;
      let pYellows = p.yellowCards || 0;
      let pReds = p.redCards || 0;

      const isA = p.teamId === currentMatch.teamAId;
      const isB = p.teamId === currentMatch.teamBId;
      if (!isA && !isB) return p;

      // Win Points
      if ((isA && scoreA > scoreB) || (isB && scoreB > scoreA)) pts += (scoringRules.win || 0);
      
      // MOTM
      if (p.id === motmId) pts += (scoringRules.motm || 0);

      // Goals & Assists
      const gCount = (isA ? validScorersA : validScorersB).filter(id => id === p.id).length;
      const aCount = (isA ? validAssistsA : validAssistsB).filter(id => id === p.id).length;
      pts += (gCount * (scoringRules.goal || 4)) + (aCount * (scoringRules.assist || 2));
      pGoals += gCount;
      pAssists += aCount;

      // Discipline
      const yCount = (isA ? validYellowsA : validYellowsB).filter(id => id === p.id).length;
      const rCount = (isA ? validRedsA : validRedsB).filter(id => id === p.id).length;
      pts += (yCount * (scoringRules.yellowCard || -1)) + (rCount * (scoringRules.redCard || -3));
      pYellows += yCount;
      pReds += rCount;

      // Clean Sheet (GK only)
      if (p.position === Position.GK) {
        if ((isA && scoreB === 0) || (isB && scoreA === 0)) pts += (scoringRules.cleanSheet || 3);
      }

      return { ...p, points: pts, goals: pGoals, assists: pAssists, yellowCards: pYellows, redCards: pReds };
    });

    const updatedStandings = standings.map(s => {
      if (s.id !== currentMatch.teamAId && s.id !== currentMatch.teamBId) return s;
      const isA = s.id === currentMatch.teamAId;
      const gf = isA ? scoreA : scoreB;
      const ga = isA ? scoreB : scoreA;
      return {
        ...s,
        played: s.played + 1,
        goalsFor: s.goalsFor + gf,
        goalsAgainst: s.goalsAgainst + ga,
        won: s.won + (gf > ga ? 1 : 0),
        drawn: s.drawn + (gf === ga ? 1 : 0),
        lost: s.lost + (gf < ga ? 1 : 0),
        points: s.points + (gf > ga ? 3 : gf === ga ? 1 : 0)
      };
    });

    // Aggregate counts for storage
    const aggregateScorers = (ids: string[]) => {
      const counts: Record<string, number> = {};
      ids.forEach(id => counts[id] = (counts[id] || 0) + 1);
      return Object.entries(counts).map(([playerId, count]) => ({ playerId, count }));
    };

    const matchUpdate: Match = {
      ...currentMatch,
      isPlayed: true,
      scoreA, scoreB,
      motmPlayerId: motmId,
      scorers: [
        ...aggregateScorers(validScorersA),
        ...aggregateScorers(validScorersB)
      ],
      assisters: [
        ...aggregateScorers(validAssistsA),
        ...aggregateScorers(validAssistsB)
      ],
      yellowCardPlayerIds: [...validYellowsA, ...validYellowsB],
      redCardPlayerIds: [...validRedsA, ...validRedsB]
    };

    onUpdatePlayers(updatedPlayers);
    onUpdateStandings(updatedStandings);
    onUpdateMatches(matches.map(m => m.id === selectedMatchId ? matchUpdate : m));

    alert("Match Finalized & Records Updated!");
    setSelectedMatchId('');
    resetFinalizer();
  };

  const resetFinalizer = () => {
    setScoreA(0); setScoreB(0);
    setScorersA([]); setScorersB([]);
    setAssistersA([]); setAssistersB([]);
    setYellowsA([]); setYellowsB([]);
    setRedsA([]); setRedsB([]);
    setMotmId('');
  };

  const getTeamName = (id: string) => standings.find(s => s.id === id)?.team || "Team";

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto py-20 px-4">
        <div className="bg-[#1a1a1a] border border-zinc-800 p-8 rounded-3xl shadow-2xl space-y-6 text-center">
          <Lock size={48} className="text-pitch mx-auto" />
          <h2 className="text-2xl font-black italic uppercase">Commissioner Security</h2>
          <form onSubmit={handleAuth} className="space-y-4">
            <input type="password" placeholder="Admin PIN" className="w-full bg-zinc-900 border border-zinc-700 rounded-xl py-4 px-4 focus:outline-none focus:border-pitch text-center font-bold tracking-widest" value={password} onChange={e => setPassword(e.target.value)} autoFocus />
            <button className="w-full bg-pitch text-black font-black py-4 rounded-xl uppercase shadow-lg shadow-pitch/20">Verify Access</button>
          </form>
          <button onClick={onClose} className="text-zinc-500 text-xs font-bold uppercase hover:text-white">Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 pb-32">
      <div className="flex bg-zinc-900 p-1.5 rounded-2xl border border-zinc-800 overflow-x-auto no-scrollbar">
        <TabButton active={activeTab === 'REPORT'} onClick={() => setActiveTab('REPORT')} icon={<Sword size={16}/>} label="Finalizer" />
        <TabButton active={activeTab === 'ROSTER'} onClick={() => setActiveTab('ROSTER')} icon={<Users size={16}/>} label="Registry" />
        <TabButton active={activeTab === 'TEAMS'} onClick={() => setActiveTab('TEAMS')} icon={<Shield size={16}/>} label="Teams" />
        <TabButton active={activeTab === 'FIXTURES'} onClick={() => setActiveTab('FIXTURES')} icon={<Calendar size={16}/>} label="Schedule" />
        <TabButton active={activeTab === 'RULES'} onClick={() => setActiveTab('RULES')} icon={<Settings size={16}/>} label="Rules" />
      </div>

      <div className="bg-[#1a1a1a] rounded-3xl border border-zinc-800 shadow-2xl p-6 md:p-10 min-h-[500px]">
        {activeTab === 'REPORT' && (
          <div className="space-y-10 max-w-5xl mx-auto">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest ml-1">Select Pending Match</label>
              <select className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 px-6 font-black uppercase italic text-xl focus:border-pitch outline-none" value={selectedMatchId} onChange={e => { setSelectedMatchId(e.target.value); resetFinalizer(); }}>
                <option value="">-- Choose Fixture --</option>
                {matches.filter(m => !m.isPlayed).map(m => (
                  <option key={m.id} value={m.id}>GW{m.gameweek}: {getTeamName(m.teamAId)} vs {getTeamName(m.teamBId)}</option>
                ))}
              </select>
            </div>

            {selectedMatchId && currentMatch && (
              <div className="space-y-10 animate-in slide-in-from-top-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:block z-10">
                    <div className="bg-zinc-800 border border-zinc-700 w-12 h-12 rounded-full flex items-center justify-center font-black italic text-zinc-500">VS</div>
                  </div>

                  {/* Team A Column */}
                  <div className="space-y-8 bg-zinc-900/30 p-6 rounded-3xl border border-zinc-800">
                    <div className="text-center space-y-4">
                      <h4 className="text-lg font-black uppercase text-pitch truncate">{getTeamName(currentMatch.teamAId)}</h4>
                      <div className="flex flex-col items-center">
                        <label className="text-[10px] font-black text-zinc-600 uppercase mb-2">Goals</label>
                        <input type="number" value={scoreA} onChange={e => setScoreA(Math.max(0, parseInt(e.target.value) || 0))} className="w-20 h-20 bg-black rounded-2xl text-4xl font-black text-center border-2 border-zinc-800 focus:border-pitch outline-none" />
                      </div>
                    </div>

                    <div className="space-y-4">
                      {Array.from({ length: scoreA }).map((_, i) => (
                        <div key={i} className="grid grid-cols-2 gap-2">
                          <TeamPlayerSelect players={teamAPlayers} label={`Goal ${i+1}`} value={scorersA[i] || ''} onChange={val => { const next = [...scorersA]; next[i] = val; setScorersA(next); }} />
                          <TeamPlayerSelect players={teamAPlayers} label={`Assist ${i+1}`} value={assistersA[i] || ''} onChange={val => { const next = [...assistersA]; next[i] = val; setAssistersA(next); }} />
                        </div>
                      ))}
                      <div className="grid grid-cols-2 gap-2 pt-4 border-t border-zinc-800/50">
                        <TeamPlayerSelect players={teamAPlayers} label="Yellow Card" onChange={val => setYellowsA([...yellowsA, val])} value="" isSearch />
                        <TeamPlayerSelect players={teamAPlayers} label="Red Card" onChange={val => setRedsA([...redsA, val])} value="" isSearch />
                      </div>
                      <div className="flex flex-wrap gap-2">
                         {yellowsA.filter(id => id).map((id, i) => <DisciplineBadge key={i} name={players.find(p=>p.id===id)?.name} color="yellow" onRemove={()=>setYellowsA(yellowsA.filter((_,idx)=>idx!==i))} />)}
                         {redsA.filter(id => id).map((id, i) => <DisciplineBadge key={i} name={players.find(p=>p.id===id)?.name} color="red" onRemove={()=>setRedsA(redsA.filter((_,idx)=>idx!==i))} />)}
                      </div>
                    </div>
                  </div>

                  {/* Team B Column */}
                  <div className="space-y-8 bg-zinc-900/30 p-6 rounded-3xl border border-zinc-800">
                    <div className="text-center space-y-4">
                      <h4 className="text-lg font-black uppercase text-zinc-400 truncate">{getTeamName(currentMatch.teamBId)}</h4>
                      <div className="flex flex-col items-center">
                        <label className="text-[10px] font-black text-zinc-600 uppercase mb-2">Goals</label>
                        <input type="number" value={scoreB} onChange={e => setScoreB(Math.max(0, parseInt(e.target.value) || 0))} className="w-20 h-20 bg-black rounded-2xl text-4xl font-black text-center border-2 border-zinc-800 focus:border-pitch outline-none" />
                      </div>
                    </div>

                    <div className="space-y-4">
                      {Array.from({ length: scoreB }).map((_, i) => (
                        <div key={i} className="grid grid-cols-2 gap-2">
                          <TeamPlayerSelect players={teamBPlayers} label={`Goal ${i+1}`} value={scorersB[i] || ''} onChange={val => { const next = [...scorersB]; next[i] = val; setScorersB(next); }} />
                          <TeamPlayerSelect players={teamBPlayers} label={`Assist ${i+1}`} value={assistersB[i] || ''} onChange={val => { const next = [...assistersB]; next[i] = val; setAssistersB(next); }} />
                        </div>
                      ))}
                      <div className="grid grid-cols-2 gap-2 pt-4 border-t border-zinc-800/50">
                        <TeamPlayerSelect players={teamBPlayers} label="Yellow Card" onChange={val => setYellowsB([...yellowsB, val])} value="" isSearch />
                        <TeamPlayerSelect players={teamBPlayers} label="Red Card" onChange={val => setRedsB([...redsB, val])} value="" isSearch />
                      </div>
                      <div className="flex flex-wrap gap-2">
                         {yellowsB.filter(id => id).map((id, i) => <DisciplineBadge key={i} name={players.find(p=>p.id===id)?.name} color="yellow" onRemove={()=>setYellowsB(yellowsB.filter((_,idx)=>idx!==i))} />)}
                         {redsB.filter(id => id).map((id, i) => <DisciplineBadge key={i} name={players.find(p=>p.id===id)?.name} color="red" onRemove={()=>setRedsB(redsB.filter((_,idx)=>idx!==i))} />)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 max-w-xl mx-auto space-y-4">
                  <h5 className="text-xs font-black uppercase text-center text-pitch border-b border-zinc-800 pb-4">Tournament Match Verdict</h5>
                  <TeamPlayerSelect players={allEligiblePlayers} label="Man of the Match" value={motmId} onChange={setMotmId} />
                  <button onClick={finalizeMatch} className="w-full bg-pitch text-black font-black py-6 rounded-2xl uppercase shadow-2xl shadow-pitch/20 text-xl italic tracking-tighter">Submit Final Report</button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'ROSTER' && (
          <div className="space-y-8">
             {/* Manager Management Section */}
             <div className="bg-zincSub p-6 rounded-3xl border border-zinc-800 space-y-6">
                <div className="flex items-center gap-2 border-b border-zinc-800 pb-4">
                   <Users size={18} className="text-pitch" />
                   <h4 className="text-sm font-black uppercase italic tracking-tight">Manager Management</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {Object.values(tournamentUsers).sort((a,b) => a.username.localeCompare(b.username)).map((u: User) => (
                     <div key={u.username} className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 flex items-center justify-between">
                        <div>
                           <div className="flex items-center gap-2">
                              <span className="font-black uppercase italic text-sm">{u.teamName}</span>
                              {u.isLocked ? (
                                <span className="text-[8px] bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-1.5 py-0.5 rounded font-black uppercase">Locked</span>
                              ) : (
                                <span className="text-[8px] bg-pitch/10 text-pitch border border-pitch/20 px-1.5 py-0.5 rounded font-black uppercase">Open</span>
                              )}
                           </div>
                           <div className="text-[10px] text-zinc-500 font-bold tracking-widest">@{u.username} | {u.selectedPlayerIds.length}/9 Squad</div>
                        </div>
                        {u.isLocked && (
                          <button 
                            onClick={() => handleUnlockUser(u.username)}
                            className="p-2 bg-yellow-500/10 text-yellow-500 rounded-xl border border-yellow-500/20 hover:bg-yellow-500 hover:text-black transition-all"
                            title="Unlock Manager Draft"
                          >
                            <Unlock size={16} />
                          </button>
                        )}
                     </div>
                   ))}
                </div>
             </div>

             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h3 className="text-xs font-black uppercase text-zinc-500 tracking-[0.2em] ml-1 flex items-center gap-2">
                  <Star size={16} /> Player Pool Registry
                </h3>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[700px] overflow-y-auto no-scrollbar pr-2 pb-20">
                {players.sort((a,b) => a.name.localeCompare(b.name)).map(p => (
                  <div key={p.id} className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl space-y-5 hover:border-zinc-700 transition-all group shadow-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center font-black text-xs text-zinc-500">{p.position}</div>
                        <div>
                          <div className="font-bold text-sm uppercase italic">{p.name}</div>
                          <div className="text-[9px] text-zinc-600 font-black uppercase">Season Stats: {p.points} Pts</div>
                        </div>
                      </div>
                      <button onClick={() => {
                        if(confirm(`Are you sure you want to remove ${p.name}?`)) {
                          onUpdatePlayers(players.filter(x => x.id !== p.id));
                        }
                      }} className="text-zinc-700 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                    </div>

                    <div className="space-y-3 pt-3 border-t border-zinc-800/50">
                       <div className="space-y-1">
                         <label className="text-[8px] font-black uppercase text-zinc-500 tracking-widest">Assign to Team</label>
                         <select className="w-full bg-black border border-zinc-800 text-[10px] p-2.5 rounded-xl outline-none focus:border-pitch" value={p.teamId} onChange={(e) => onUpdatePlayers(players.map(pl => pl.id === p.id ? { ...pl, teamId: e.target.value } : pl))}>
                           <option value="">No Team (FA)</option>
                           {standings.map(s => <option key={s.id} value={s.id}>{s.team}</option>)}
                         </select>
                       </div>
                       <div className="space-y-1">
                         <label className="text-[8px] font-black uppercase text-zinc-500 tracking-widest">Market Value Adjust</label>
                         <div className="flex gap-2">
                            <input type="number" className="flex-1 bg-black border border-zinc-800 text-[10px] p-2.5 rounded-xl outline-none focus:border-pitch" defaultValue={p.price} id={`pr-${p.id}`} />
                            <button onClick={() => { const val = parseInt((document.getElementById(`pr-${p.id}`) as HTMLInputElement).value); onUpdatePlayers(players.map(pl => pl.id === p.id ? { ...pl, price: val } : pl)); alert('Price saved'); }} className="bg-zinc-800 px-4 rounded-xl text-[9px] font-black uppercase hover:bg-zinc-700">Update</button>
                         </div>
                       </div>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        )}

        {activeTab === 'TEAMS' && <TeamsManagement standings={standings} onUpdate={onUpdateStandings} players={players} />}
        {activeTab === 'FIXTURES' && <FixturesManagement matches={matches} onUpdate={onUpdateMatches} standings={standings} />}
        {activeTab === 'RULES' && scoringRules && <RulesManagement rules={scoringRules} onUpdate={onUpdateRules} />}
      </div>
    </div>
  );
};

// UI Components
const TeamPlayerSelect: React.FC<{ players: Player[], label: string, value?: string, onChange: (val: string) => void, isSearch?: boolean }> = ({ players, label, value, onChange, isSearch }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const filtered = players.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="relative space-y-1">
      <label className="text-[9px] font-black uppercase text-zinc-600 tracking-widest block ml-1">{label}</label>
      <div onClick={() => setIsOpen(!isOpen)} className="w-full bg-black border border-zinc-800 rounded-xl p-2.5 text-[10px] font-bold cursor-pointer hover:border-zinc-700 truncate">
        {players.find(p => p.id === value)?.name || (isSearch ? "Add..." : "Select...")}
      </div>
      {isOpen && (
        <div className="absolute z-[100] left-0 right-0 mt-1 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl max-h-48 overflow-y-auto no-scrollbar overflow-hidden">
          <input type="text" className="w-full bg-black border-b border-zinc-800 p-2 text-[10px] outline-none sticky top-0" placeholder="Filter..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} autoFocus onClick={e => e.stopPropagation()} />
          {filtered.map(p => (
            <button key={p.id} className="w-full text-left px-3 py-2 hover:bg-zinc-800 text-[10px] font-bold border-b border-zinc-800/50 last:border-0" onClick={(e) => { e.stopPropagation(); onChange(p.id); setIsOpen(false); setSearchTerm(''); }}>{p.name}</button>
          ))}
          {filtered.length === 0 && <div className="p-3 text-[10px] text-zinc-600 italic">No matches.</div>}
        </div>
      )}
    </div>
  );
};

const DisciplineBadge: React.FC<{ name?: string, color: 'yellow' | 'red', onRemove: () => void }> = ({ name, color, onRemove }) => (
  <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[9px] font-black uppercase ${color === 'yellow' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
    {name || 'Unknown'}
    <button onClick={onRemove}><X size={10} /></button>
  </div>
);

// Tab Subcomponents
const TeamsManagement: React.FC<{standings: TeamStanding[], onUpdate: (s: TeamStanding[]) => void, players: Player[]}> = ({standings, onUpdate, players}) => {
  const [name, setName] = useState('');
  
  const handleAssignCaptain = (teamId: string, playerId: string) => {
    onUpdate(standings.map(s => s.id === teamId ? { ...s, captainPlayerId: playerId } : s));
  };

  return (
    <div className="space-y-8">
      <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 max-w-lg mx-auto flex gap-3">
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="Official Club Name" className="flex-1 bg-black border border-zinc-800 rounded-xl px-4 text-xs font-bold" />
        <button onClick={()=>{ if(!name) return; onUpdate([...standings, { id: `t-${Date.now()}`, team: name, played:0, won:0, drawn:0, lost:0, goalsFor:0, goalsAgainst:0, points:0 }]); setName(''); }} className="bg-pitch text-black font-black px-6 rounded-xl uppercase text-[10px]">Add</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {standings.map(s => {
          const teamPlayers = players.filter(p => p.teamId === s.id);
          return (
            <div key={s.id} className="bg-zincSub border border-zinc-800 p-6 rounded-2xl space-y-4 hover:border-zinc-700 transition-all shadow-lg group relative">
              <div className="flex justify-between items-start">
                <div>
                   <div className="font-black italic uppercase text-lg text-white leading-tight">{s.team}</div>
                   <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{teamPlayers.length} Members</div>
                </div>
                <button onClick={()=>onUpdate(standings.filter(x=>x.id!==s.id))} className="text-zinc-800 hover:text-red-500 p-1"><Trash2 size={16}/></button>
              </div>

              <div className="pt-2 space-y-2">
                <label className="text-[9px] font-black uppercase text-zinc-500 tracking-widest flex items-center gap-1.5">
                  <UserRoundCheck size={12} className="text-pitch" /> Team Captain
                </label>
                <select 
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-[10px] font-black uppercase outline-none focus:border-pitch text-white"
                  value={s.captainPlayerId || ''}
                  onChange={(e) => handleAssignCaptain(s.id, e.target.value)}
                >
                  <option value="">No Captain Assigned</option>
                  {teamPlayers.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                {s.captainPlayerId && (
                   <div className="flex items-center gap-2 mt-1">
                      <div className="w-2 h-2 rounded-full bg-pitch animate-pulse" />
                      <span className="text-[8px] font-black text-pitch uppercase tracking-widest">Active Leadership</span>
                   </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const FixturesManagement: React.FC<{matches: Match[], onUpdate: (m: Match[]) => void, standings: TeamStanding[]}> = ({matches, onUpdate, standings}) => {
  const [f, setF] = useState({ tA: '', tB: '', gw: 1, date: '' });
  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 space-y-4 shadow-xl">
        <div className="grid grid-cols-2 gap-4">
           <select className="bg-black border border-zinc-800 rounded-xl p-3 text-xs font-bold" onChange={e=>setF({...f, tA: e.target.value})}>
             <option value="">Home Team</option>
             {standings.map(s=><option key={s.id} value={s.id}>{s.team}</option>)}
           </select>
           <select className="bg-black border border-zinc-800 rounded-xl p-3 text-xs font-bold" onChange={e=>setF({...f, tB: e.target.value})}>
             <option value="">Away Team</option>
             {standings.map(s=><option key={s.id} value={s.id}>{s.team}</option>)}
           </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
           <input type="date" className="bg-black border border-zinc-800 rounded-xl p-3 text-xs font-bold" onChange={e=>setF({...f, date: e.target.value})} />
           <input type="number" className="bg-black border border-zinc-800 rounded-xl p-3 text-xs font-bold" placeholder="GW" onChange={e=>setF({...f, gw: parseInt(e.target.value) || 1})} />
        </div>
        <button onClick={()=>{ if(!f.tA||!f.tB) return; onUpdate([...matches, { id: `m-${Date.now()}`, gameweek: f.gw, date: f.date, teamAId: f.tA, teamBId: f.tB, scoreA:0, scoreB:0, isPlayed: false, scorers:[], assisters:[], yellowCardPlayerIds:[], redCardPlayerIds:[] }]); alert('Scheduled'); }} className="w-full bg-pitch text-black font-black py-4 rounded-xl uppercase tracking-tighter shadow-lg shadow-pitch/10">Launch Fixture</button>
      </div>
      <div className="space-y-2">
         {matches.filter(m=>!m.isPlayed).map(m=>(
           <div key={m.id} className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex justify-between items-center group">
              <span className="text-[10px] font-black bg-zinc-800 px-2 py-1 rounded text-zinc-500 tracking-tighter">GW {m.gameweek}</span>
              <span className="font-bold uppercase italic text-sm text-zinc-300">{standings.find(s=>s.id===m.teamAId)?.team} vs {standings.find(s=>s.id===m.teamBId)?.team}</span>
              <button onClick={()=>onUpdate(matches.filter(x=>x.id!==m.id))} className="text-zinc-800 group-hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16}/></button>
           </div>
         ))}
      </div>
    </div>
  );
};

const RulesManagement: React.FC<{rules: ScoringRules, onUpdate: (r: ScoringRules) => void}> = ({rules, onUpdate}) => (
  <div className="max-w-xl mx-auto space-y-4">
     {Object.entries(rules).map(([key, val]) => (
       <div key={key} className="flex items-center justify-between p-4 bg-zinc-900 rounded-2xl border border-zinc-800 hover:border-pitch/30 transition-all">
          <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">{key.replace(/([A-Z])/g, ' $1')}</span>
          <div className="flex items-center gap-4">
            <button onClick={()=>onUpdate({...rules, [key]: (val as number) - 1})} className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-zinc-500 hover:text-white">-</button>
            <span className="font-black text-xl italic text-white w-6 text-center">{val}</span>
            <button onClick={()=>onUpdate({...rules, [key]: (val as number) + 1})} className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-pitch hover:brightness-110">+</button>
          </div>
       </div>
     ))}
  </div>
);

const TabButton: React.FC<{ active: boolean, onClick: () => void, label: string, icon: any }> = ({ active, onClick, label, icon }) => (
  <button onClick={onClick} className={`flex-1 flex items-center justify-center gap-2 py-4 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${active ? 'bg-zinc-800 text-pitch shadow-inner' : 'text-zinc-600 hover:text-zinc-300'}`}>
    {icon} {label}
  </button>
);

export default AdminPanel;
