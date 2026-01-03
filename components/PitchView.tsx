
import React, { useMemo, useState } from 'react';
import { User, Player, Position } from '../types';
import { MAX_BUDGET, MAX_PLAYERS } from '../constants';
import { AlertCircle, User as UserIcon, Lock, CheckCircle2, ShieldCheck } from 'lucide-react';

interface Props {
  user?: User;
  players: Player[];
  onToggleLock?: (locked: boolean) => void;
}

const PitchView: React.FC<Props> = ({ user, players, onToggleLock }) => {
  const [isConfirming, setIsConfirming] = useState(false);
  const selectedPlayerIds = user?.selectedPlayerIds || [];
  const starterIds = user?.starterIds || [];

  const squad = useMemo(() => {
    return players.filter(p => selectedPlayerIds.includes(p.id));
  }, [players, selectedPlayerIds]);

  const spent = useMemo(() => {
    return squad.reduce((sum, p) => sum + p.price, 0);
  }, [squad]);

  const starters = squad.filter(p => starterIds.includes(p.id)).slice(0, 6);
  const subs = squad.filter(p => !starterIds.includes(p.id));

  const sortedStarters = useMemo(() => {
    const order = [Position.FWD, Position.FLEX, Position.MID, Position.DEF, Position.GK];
    return [...starters].sort((a, b) => order.indexOf(a.position) - order.indexOf(b.position));
  }, [starters]);

  const canConfirm = selectedPlayerIds.length === MAX_PLAYERS && spent <= MAX_BUDGET;

  const handleConfirm = () => {
    if (!canConfirm) return;
    setIsConfirming(true);
    // Simulate slight delay for effect
    setTimeout(() => {
      onToggleLock?.(true);
      setIsConfirming(false);
    }, 1200);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-pulse text-zinc-500 font-bold uppercase tracking-widest">Loading Pitch...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col items-center">
        <div className="flex items-center gap-3 mb-2">
          <h2 className={`text-2xl font-black italic uppercase tracking-tighter ${user.isLocked ? 'text-yellow-500' : 'text-white'}`}>
            Squad <span className={user.isLocked ? 'text-white' : 'text-pitch'}>Center</span>
          </h2>
          {user.isLocked && <ShieldCheck className="text-yellow-500 animate-pulse" size={24} />}
        </div>
        <p className="text-zinc-500 text-[10px] mb-6 uppercase tracking-[0.2em] font-black">{user.teamName}</p>
        
        {/* The Pitch with Gold border logic */}
        <div className={`relative w-full aspect-[4/5] bg-pitch rounded-[2.5rem] shadow-2xl overflow-hidden border-[8px] transition-all duration-700 ${user.isLocked ? 'border-yellow-500 ring-4 ring-yellow-500/20' : 'border-white/10'}`}>
          {/* Pitch Markings */}
          <div className="absolute inset-4 border-2 border-white/20 rounded-[2rem] pointer-events-none" />
          <div className="absolute left-1/2 top-0 -translate-x-1/2 w-3/4 h-28 border-b-2 border-x-2 border-white/20" />
          <div className="absolute left-1/2 bottom-0 -translate-x-1/2 w-3/4 h-28 border-t-2 border-x-2 border-white/20" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-white/20 rounded-full" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white/20 rounded-full" />
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-white/20" />

          {/* Player Grid */}
          <div className="absolute inset-0 flex flex-col justify-around py-16 px-8">
             {starters.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-full text-black/20 font-black uppercase italic tracking-widest text-lg text-center">
                 Market Active<br/>Construct your Squad
               </div>
             ) : (
               <>
                 <div className="flex justify-around items-center">
                    {sortedStarters.filter(p => p.position === Position.FWD || p.position === Position.FLEX).map(p => (
                      <PitchPlayer key={p.id} player={p} locked={user.isLocked} />
                    ))}
                 </div>
                 <div className="flex justify-around items-center">
                    {sortedStarters.filter(p => p.position === Position.MID).map(p => (
                      <PitchPlayer key={p.id} player={p} locked={user.isLocked} />
                    ))}
                 </div>
                 <div className="flex justify-around items-center">
                    {sortedStarters.filter(p => p.position === Position.DEF).map(p => (
                      <PitchPlayer key={p.id} player={p} locked={user.isLocked} />
                    ))}
                 </div>
                 <div className="flex justify-around items-center">
                    {sortedStarters.filter(p => p.position === Position.GK).map(p => (
                      <PitchPlayer key={p.id} player={p} locked={user.isLocked} />
                    ))}
                 </div>
               </>
             )}
          </div>

          {/* Locked Overlay with Motion */}
          {user.isLocked && (
            <div className="absolute inset-0 bg-black/5 backdrop-blur-[1px] flex items-center justify-center pointer-events-none z-10">
               <div className="bg-black/80 p-5 rounded-full border-2 border-yellow-500 shadow-[0_0_50px_rgba(241,196,15,0.3)] scale-150 animate-in zoom-in duration-500">
                  <Lock className="text-yellow-500" size={32} />
               </div>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {!user.isLocked ? (
          <div className="bg-zincSub border border-zinc-800 p-8 rounded-[2rem] shadow-2xl flex flex-col items-center gap-6">
            <div className="text-center space-y-2">
              <h3 className="text-xl font-black uppercase italic tracking-tight">Finalize Selection</h3>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest leading-relaxed">
                Confirm your 9-player roster. <br/> Credits: <span className={spent > MAX_BUDGET ? 'text-red-500' : 'text-pitch'}>{spent}/{MAX_BUDGET}</span>
              </p>
            </div>
            
            <button 
              onClick={handleConfirm}
              disabled={!canConfirm || isConfirming}
              className={`w-full max-w-sm py-5 rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-3 ${canConfirm ? 'bg-pitch text-black shadow-lg shadow-pitch/20 hover:scale-105 active:scale-95' : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'}`}
            >
              {isConfirming ? (
                <div className="h-5 w-5 border-2 border-black/30 border-t-black animate-spin rounded-full" />
              ) : (
                <>Lock Roster & Ready Up</>
              )}
            </button>
          </div>
        ) : (
          <div className="bg-yellow-500/10 border border-yellow-500/30 p-8 rounded-[2rem] shadow-2xl flex flex-col items-center gap-3 text-center animate-in slide-in-from-bottom-4">
             <div className="w-16 h-16 bg-yellow-500 rounded-2xl flex items-center justify-center text-black shadow-lg shadow-yellow-500/20 mb-2">
               <CheckCircle2 size={32} />
             </div>
             <h3 className="text-2xl font-black uppercase italic text-yellow-500 tracking-tighter">Squad Confirmed</h3>
             <p className="text-[10px] text-yellow-500/60 font-black uppercase tracking-[0.2em]">Roster locked for the upcoming matchday. Contact admin for emergency changes.</p>
          </div>
        )}

        {/* Bench Section */}
        <div className="bg-zincSub rounded-[2rem] border border-zinc-800 p-8 shadow-2xl">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-black uppercase italic tracking-tight flex items-center gap-2">
              <AlertCircle size={18} className="text-pitch" />
              Substitutes
            </h3>
            <span className="text-[10px] font-black uppercase text-zinc-600">{subs.length}/3 On Bench</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {subs.length === 0 ? (
              <div className="col-span-3 py-10 text-center text-zinc-700 font-black uppercase italic text-xs border-2 border-dashed border-zinc-800 rounded-3xl">No Subs Selected</div>
            ) : (
              subs.map(p => (
                <div key={p.id} className="flex items-center justify-between p-5 bg-zinc-900 rounded-2xl border border-zinc-800 group hover:border-zinc-700 transition-all shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center text-[10px] font-black text-zinc-500">
                      {p.position}
                    </div>
                    <div>
                      <div className="text-xs font-black uppercase italic text-white">{p.name}</div>
                      <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">{p.points} PTS</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const PitchPlayer: React.FC<{ player: Player, locked?: boolean }> = ({ player, locked }) => (
  <div className="flex flex-col items-center gap-1 group cursor-default">
    <div className={`relative w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border-2 shadow-xl transition-all duration-300 ${locked ? 'border-yellow-500/50 hover:scale-110' : 'border-white/40 hover:scale-125'}`}>
      <UserIcon size={30} className="text-white" />
      <div className={`absolute -top-2 -right-2 text-[9px] px-1.5 py-0.5 rounded-lg font-black border ${locked ? 'bg-yellow-500 text-black border-yellow-600' : 'bg-black text-pitch border-white/20'}`}>
        {player.price}
      </div>
    </div>
    <div className={`bg-black/90 backdrop-blur-md px-3 py-1.5 rounded-xl text-[10px] font-black uppercase italic shadow-2xl whitespace-nowrap border mt-1 transition-colors ${locked ? 'text-yellow-500 border-yellow-500/30' : 'text-white border-white/10'}`}>
      {player.name}
    </div>
    <div className={`text-[9px] font-black uppercase tracking-tight ${locked ? 'text-black/60' : 'text-black/40'}`}>
      {player.points} PTS
    </div>
  </div>
);

export default PitchView;
