
import React, { useState } from 'react';
import { ref, get, set } from 'firebase/database';
import { PlusCircle, Search, CheckCircle2, Copy, ArrowRight, Loader2, AlertTriangle } from 'lucide-react';

export default function Gateway({ user, onJoinSuccess, db }: any) {
  const [view, setView] = useState<'hub' | 'create' | 'join' | 'success'>('hub');
  const [tName, setTName] = useState('');
  const [tPass, setTPass] = useState('');
  const [tIdInput, setTIdInput] = useState('');
  const [error, setError] = useState('');
  const [newChip, setNewChip] = useState('');
  const [joining, setJoining] = useState(false);

  const generateChip = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleCreate = async () => {
    setError('');
    if (!tName || !tPass) return setError('Fill all fields');
    
    const chip = generateChip();
    try {
      const tRef = ref(db, `tournaments/${chip}`);
      await set(tRef, {
        id: chip,
        name: tName,
        adminPassword: tPass,
        owner: user.username,
        createdBy: user.username,
        players: [], 
        standings: [],
        matches: [],
        scoringRules: {
          goal: 4,
          assist: 2,
          win: 1,
          motm: 1,
          cleanSheet: 3,
          captainBonus: 1,
          yellowCard: -2,
          redCard: -4
        },
        users: {
           [user.username]: { ...user, role: 'owner' }
        }
      });
      setNewChip(chip);
      setView('success');
    } catch (err) {
      setError('Failed to create tournament');
    }
  };

  const handleJoin = async () => {
    setError('');
    const cleanId = tIdInput.replace(/#/g, '').trim().toUpperCase();
    if (!cleanId) return;

    setJoining(true);
    try {
      const tournamentPath = 'tournaments/' + cleanId;
      const tRef = ref(db, tournamentPath);
      const snapshot = await get(tRef);

      if (snapshot.exists()) {
        onJoinSuccess(cleanId);
      } else {
        setError(`Searching for [${cleanId}]... Result: NOT FOUND`);
      }
    } catch (err) {
      setError('Cloud connection failed. Check your internet.');
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4">
      {view === 'hub' && (
        <div className="w-full max-w-lg grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in zoom-in duration-300">
          <button
            onClick={() => setView('create')}
            className="group relative bg-[#1a1a1a] p-10 rounded-3xl border border-white/5 hover:border-[#00E676]/30 transition-all flex flex-col items-center gap-4"
          >
            <div className="p-4 bg-white/5 rounded-2xl group-hover:bg-[#00E676]/10 transition-colors">
              <PlusCircle size={40} className="text-white group-hover:text-[#00E676]" />
            </div>
            <span className="font-black uppercase tracking-tighter text-xl text-white">Create</span>
            <p className="text-center text-xs text-white/40">Start your own tournament as Commissioner</p>
          </button>

          <button
            onClick={() => setView('join')}
            className="group relative bg-[#1a1a1a] p-10 rounded-3xl border border-white/5 hover:border-[#00E676]/30 transition-all flex flex-col items-center gap-4"
          >
            <div className="p-4 bg-white/5 rounded-2xl group-hover:bg-[#00E676]/10 transition-colors">
              <Search size={40} className="text-white group-hover:text-[#00E676]" />
            </div>
            <span className="font-black uppercase tracking-tighter text-xl text-white">Join</span>
            <p className="text-center text-xs text-white/40">Enter an existing league with a Chip code</p>
          </button>
        </div>
      )}

      {(view === 'create' || view === 'join') && (
        <div className="w-full max-w-md bg-[#1a1a1a] p-8 rounded-3xl border border-white/5 animate-in slide-in-from-bottom-4 duration-300">
          <h2 className="text-2xl font-black uppercase italic tracking-tighter mb-6 flex items-center gap-2 text-white">
            {view === 'create' ? <><PlusCircle/> Create League</> : <><Search/> Join League</>}
          </h2>

          <div className="space-y-4">
            {view === 'create' ? (
              <>
                <input
                  type="text"
                  placeholder="League Name"
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 outline-none focus:border-[#00E676] text-white"
                  value={tName}
                  onChange={(e) => setTName(e.target.value)}
                />
                <input
                  type="password"
                  placeholder="Admin Security PIN"
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 outline-none focus:border-[#00E676] text-white"
                  value={tPass}
                  onChange={(e) => setTPass(e.target.value)}
                />
              </>
            ) : (
              <input
                type="text"
                placeholder="#CHIP CODE"
                className="w-full bg-white/5 border border-white/10 rounded-xl p-6 outline-none focus:border-[#00E676] text-center font-black text-2xl tracking-widest placeholder:text-white/10 text-white"
                value={tIdInput}
                onChange={(e) => setTIdInput(e.target.value)}
              />
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center gap-3 animate-in fade-in zoom-in duration-200">
                <AlertTriangle className="text-red-500 shrink-0" size={20} />
                <p className="text-red-500 text-xs font-black uppercase tracking-tight leading-none">{error}</p>
              </div>
            )}

            <button
              onClick={view === 'create' ? handleCreate : handleJoin}
              disabled={joining}
              className="w-full bg-[#00E676] text-[#121212] font-black uppercase py-4 rounded-xl flex items-center justify-center gap-2 transition-all hover:brightness-110 active:scale-[0.98]"
            >
              {joining ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>Connecting to Cloud...</span>
                </>
              ) : (
                view === 'create' ? 'Launch Tournament' : 'Verify & Join'
              )}
            </button>
            <button
              onClick={() => { setView('hub'); setError(''); }}
              className="w-full text-white/40 text-sm font-bold uppercase py-2 hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {view === 'success' && (
        <div className="w-full max-w-md bg-[#1a1a1a] p-10 rounded-3xl border-2 border-[#00E676]/30 text-center animate-in zoom-in duration-300">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-[#00E676]/20 rounded-full flex items-center justify-center text-[#00E676]">
              <CheckCircle2 size={48} />
            </div>
          </div>
          <h2 className="text-3xl font-black uppercase italic tracking-tighter mb-2 text-white">Created Successfully</h2>
          <p className="text-white/40 text-sm mb-8 italic">Share this code with your participants</p>
          
          <div className="bg-black/50 p-6 rounded-2xl border border-white/10 flex flex-col items-center gap-2 mb-8">
             <span className="text-white/30 text-[10px] font-bold uppercase tracking-widest">League Chip ID</span>
             <div className="flex items-center gap-4">
               <span className="text-4xl font-black tracking-widest text-[#00E676]">#{newChip}</span>
               <button onClick={() => { navigator.clipboard.writeText(newChip); alert('Copied!'); }} className="p-2 hover:bg-white/10 rounded-lg text-white/40">
                 <Copy size={20} />
               </button>
             </div>
          </div>

          <button
            onClick={() => setView('hub')}
            className="w-full bg-[#00E676] text-[#121212] font-black uppercase py-4 rounded-xl flex items-center justify-center gap-2 group transition-all"
          >
            Go to Join Page <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      )}
    </div>
  );
}
