
import React, { useState } from 'react';
import { Trophy, LogIn, UserPlus, Loader2, ShieldCheck, ShieldAlert, AlertTriangle, UserX } from 'lucide-react';
// Import Firebase functions for auth logic
import { ref, get, set } from 'firebase/database';

interface Props {
  onLogin: (user: any) => void;
  db: any;
}

const Login: React.FC<Props> = ({ onLogin, db }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errorType, setErrorType] = useState<'NOT_FOUND' | 'INVALID' | 'TAKEN' | 'GENERAL' | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setErrorType(null);
    const uname = username.trim().toLowerCase();
    const upass = password.trim();

    if (!uname || !upass) {
      setError("Missing credentials!");
      setErrorType('INVALID');
      return;
    }
    
    setLoading(true);
    try {
      const userRef = ref(db, `users/${uname}`);
      const snapshot = await get(userRef);

      if (isRegister) {
        if (snapshot.exists()) {
          setError("Username already taken!");
          setErrorType('TAKEN');
        } else {
          const newUser = {
            username: uname,
            password: upass,
            teamName: `${uname}'s XI`,
            selectedPlayerIds: [],
            starterIds: []
          };
          await set(userRef, newUser);
          localStorage.setItem('fantasy_user', JSON.stringify(newUser));
          onLogin(newUser);
        }
      } else {
        if (!snapshot.exists()) {
          setError("WARNING: ACCOUNT NOT FOUND");
          setErrorType('NOT_FOUND');
        } else if (snapshot.val().password === upass) {
          const userData = snapshot.val();
          localStorage.setItem('fantasy_user', JSON.stringify(userData));
          onLogin(userData);
        } else {
          setError("Invalid Credentials!");
          setErrorType('INVALID');
        }
      }
    } catch (err: any) {
      console.error("Auth flow error:", err);
      setError("Cloud connection error.");
      setErrorType('GENERAL');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#121212]">
      <div className="w-full max-w-md bg-[#1a1a1a] border border-zinc-800 p-8 rounded-3xl shadow-2xl space-y-8 relative overflow-hidden">
        {loading && (
          <div className="absolute inset-0 z-10 bg-black/40 backdrop-blur-sm flex items-center justify-center">
            <Loader2 className="animate-spin text-[#00E676]" size={32} />
          </div>
        )}
        
        <div className="text-center space-y-2">
          <div className="w-20 h-20 bg-[#00E676] rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-[#00E676]/30 rotate-3">
            <Trophy size={40} className="text-black" />
          </div>
          <h1 className="text-4xl font-black tracking-tighter mt-6 uppercase italic">LOCAL <span className="text-[#00E676]">FANTASY</span></h1>
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em]">Tournament Entry Portal</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-500 uppercase ml-1 tracking-widest flex items-center gap-1">
              <ShieldCheck size={12}/> Username
            </label>
            <input 
              type="text" 
              required
              placeholder="e.g. manager99" 
              className={`w-full bg-zinc-900 border ${errorType === 'NOT_FOUND' ? 'border-red-500 shadow-lg shadow-red-500/10' : 'border-zinc-700'} rounded-xl py-4 px-4 focus:outline-none focus:border-[#00E676] transition-all text-white font-bold`}
              value={username}
              onChange={(e) => {
                setUsername(e.target.value.toLowerCase().replace(/\s/g, ''));
                if (errorType === 'NOT_FOUND') { setError(''); setErrorType(null); }
              }}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-500 uppercase ml-1 tracking-widest flex items-center gap-1">
              <ShieldAlert size={12}/> Password
            </label>
            <input 
              type="password" 
              required
              placeholder="••••••••" 
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl py-4 px-4 focus:outline-none focus:border-[#00E676] transition-all text-white font-bold"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <div className={`p-4 rounded-xl flex items-center gap-3 animate-in fade-in zoom-in duration-200 border ${errorType === 'NOT_FOUND' ? 'bg-red-500/20 border-red-500/50' : 'bg-red-500/10 border-red-500/20'}`}>
              {errorType === 'NOT_FOUND' ? (
                <UserX className="text-red-500 shrink-0" size={20} />
              ) : (
                <AlertTriangle className="text-red-500 shrink-0" size={20} />
              )}
              <p className="text-red-500 text-xs font-black uppercase tracking-tight leading-none">{error}</p>
            </div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-[#00E676] text-black font-black py-5 rounded-xl hover:bg-[#00E676]/90 transition-all flex items-center justify-center gap-2 mt-4 shadow-xl shadow-[#00E676]/10 uppercase italic text-lg"
          >
            {isRegister ? <UserPlus size={20} /> : <LogIn size={20} />}
            {isRegister ? 'Register Now' : 'Sign In'}
          </button>
        </form>

        <div className="text-center">
          <button 
            type="button"
            disabled={loading}
            onClick={() => { setIsRegister(!isRegister); setError(''); setErrorType(null); }}
            className="text-[10px] font-black text-zinc-500 hover:text-[#00E676] transition-colors uppercase tracking-[0.2em]"
          >
            {isRegister ? 'Back to Login' : "No Account? Join Tournament"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
