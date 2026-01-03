
import React, { useMemo } from 'react';
import { TeamStanding, User, Player } from '../types';
import { Trophy, TrendingUp, User as UserIcon } from 'lucide-react';

interface Props {
  standings: TeamStanding[];
  users: Record<string, User>;
  players: Player[];
}

const LeagueTableView: React.FC<Props> = ({ standings, users, players }) => {
  const fantasyLeaderboard = useMemo(() => {
    return Object.values(users || {}).map((user: User) => {
      const selectedIds = user.selectedPlayerIds || [];
      const teamPlayers = players.filter(p => selectedIds.includes(p.id));
      const totalPoints = teamPlayers.reduce((sum, p) => sum + p.points, 0);
      return {
        ...user,
        selectedPlayerIds: selectedIds,
        totalPoints
      };
    }).sort((a, b) => b.totalPoints - a.totalPoints);
  }, [users, players]);

  const sortedStandings = useMemo(() => {
    return [...(standings || [])].sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      const gdA = a.goalsFor - a.goalsAgainst;
      const gdB = b.goalsFor - b.goalsAgainst;
      return gdB - gdA;
    });
  }, [standings]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-12">
      {/* Fantasy Leaderboard */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <TrendingUp className="text-pitch" />
          Fantasy Leaderboard
        </h2>
        <div className="bg-zincSub rounded-2xl border border-zinc-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-zinc-900/50 border-b border-zinc-800 text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
                  <th className="px-6 py-4">Pos</th>
                  <th className="px-6 py-4">Manager / Team</th>
                  <th className="px-6 py-4 text-center">Players</th>
                  <th className="px-6 py-4 text-right">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {fantasyLeaderboard.map((u, i) => (
                  <tr key={u.username} className="hover:bg-zinc-800/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-zinc-500">#{i + 1}</td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-white">{u.teamName}</div>
                      <div className="text-xs text-zinc-500">@{u.username}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="bg-zinc-800 px-2 py-1 rounded-full text-xs font-bold text-zinc-400">
                        {(u.selectedPlayerIds || []).length}/9
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-pitch text-lg">
                      {u.totalPoints}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* League Table */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Trophy className="text-pitch" />
          Tournament Standings
        </h2>
        <div className="bg-zincSub rounded-2xl border border-zinc-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-zinc-900/50 border-b border-zinc-800 text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
                  <th className="px-6 py-4">Pos</th>
                  <th className="px-6 py-4">Team</th>
                  <th className="px-6 py-4 text-center">P</th>
                  <th className="px-6 py-4 text-center">W</th>
                  <th className="px-6 py-4 text-center">D</th>
                  <th className="px-6 py-4 text-center">L</th>
                  <th className="px-6 py-4 text-center">GD</th>
                  <th className="px-6 py-4 text-right">Pts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {sortedStandings.map((team, i) => (
                  <tr key={team.id} className="hover:bg-zinc-800/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-zinc-500">#{i + 1}</td>
                    <td className="px-6 py-4 font-bold text-white">{team.team}</td>
                    <td className="px-6 py-4 text-center text-zinc-400 font-mono">{team.played}</td>
                    <td className="px-6 py-4 text-center text-zinc-400 font-mono">{team.won}</td>
                    <td className="px-6 py-4 text-center text-zinc-400 font-mono">{team.drawn}</td>
                    <td className="px-6 py-4 text-center text-zinc-400 font-mono">{team.lost}</td>
                    <td className="px-6 py-4 text-center text-zinc-400 font-mono">{team.goalsFor - team.goalsAgainst}</td>
                    <td className="px-6 py-4 text-right font-bold text-white">{team.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LeagueTableView;
