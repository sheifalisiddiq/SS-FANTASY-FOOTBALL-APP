
export enum Position {
  GK = 'GK',
  DEF = 'DEF',
  MID = 'MID',
  FWD = 'FWD',
  FLEX = 'FLEX'
}

export interface ScoringRules {
  goal: number;
  assist: number;
  win: number;
  motm: number;
  cleanSheet: number;
  captainBonus: number;
  yellowCard: number;
  redCard: number;
}

export interface Player {
  id: string;
  name: string;
  position: Position;
  price: number;
  points: number;
  batch: string;
  teamId: string;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
}

export interface TeamStanding {
  id: string;
  team: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  captainPlayerId?: string;
}

export interface Match {
  id: string;
  gameweek: number;
  date: string;
  teamAId: string;
  teamBId: string;
  scoreA: number;
  scoreB: number;
  isPlayed: boolean;
  scorers: { playerId: string; count: number }[];
  assisters: { playerId: string; count: number }[];
  yellowCardPlayerIds: string[];
  redCardPlayerIds: string[];
  motmPlayerId?: string;
}

export interface User {
  username: string;
  teamName: string;
  selectedPlayerIds: string[]; 
  starterIds: string[]; 
  isLocked?: boolean;
}

export interface TournamentData {
  id: string;
  name: string;
  adminPassword?: string;
  createdBy: string;
  players: Player[];
  standings: TeamStanding[];
  users: Record<string, User>;
  matches: Match[];
  scoringRules: ScoringRules;
}
