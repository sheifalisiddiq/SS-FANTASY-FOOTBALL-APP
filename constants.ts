
import { Position, Player, TeamStanding, Match, ScoringRules } from './types';

export const DEFAULT_SCORING: ScoringRules = {
  goal: 4,
  assist: 2,
  win: 1,
  motm: 1,
  cleanSheet: 3,
  captainBonus: 1,
  yellowCard: -2,
  redCard: -4
};

export const INITIAL_STANDINGS: TeamStanding[] = [
  { id: '1', team: 'Phoenix FC', played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0 },
  { id: '2', team: 'Blue Dragons', played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0 },
  { id: '3', team: 'United Strikers', played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0 },
  { id: '4', team: 'Thunderbirds', played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0 },
  { id: '5', team: 'Desert Lions', played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0 },
];

const rawGKs = "Pranav nair (5), Ashwajit Khan (6), Aniket Shetty (6), Qasim Abbas Rizvi (5), Prayag Shetty (7), Naval Kishan (6), Halladi Kedar Pai (5), Haziq Muhyaddeen (6), Arjun Divakar (6), Amal Raj (5), Sidharth shailesh (7), Abid Noushad (6), Anmol Kudva (6), Shees ahmed (5)";
const rawDEFs = "Mohammed zubedi (7), Samarth Rai (6), Chirag (5), AMRIN (7), Nidal Safari (6), NIYAS THEKKAN (6), Rehan Kavungal (5), Muhammed Musthafa Azad (6), Ali Shahid (7), Shashank krishnan (5), Usnis Sarkar (6), Vishal tripathi (5), Mohammed akil (6), Fahim Muhammed (6), Yusuf Khan (5), Aghil musthafa (6), Mohammed Shaikh (7), Ashik (6), Mohammed Aadil (7), Anirudh (6), Affani (5), INRAN (6), Mohammed Muaiz Hassan (6), Radin zayyan (7), Hamil Sadikh (6), Adnan Chemmala (6), Abdul Hameed Khan (7), SHAJAHAN PA (6), Jose Thomas (6), Mohammad Naseer Zeeshan (5), Pranav Shankar (6), Syed Ahmed B (6), Muhammed Mubashir (7), Adnan Shanavas (6), S.Sivanand (6), NIFAL ASHRAF (7), Muhammed Rahil (6), Rayan Moosa (6), Shibin Sekharan (7), Mohammed Uzaif (6), MUHAMMED PCP (7), OWAIS (6), Ridhan (5), Josh Joji (6), Arif (6), Srujan K Gowda (6)";
const rawMIDs = "ibrahim Saheem (8), Karthik S Ganiga (9), Rayan (10), MOHAMMAD SHAHEEM SIDDIQ (8), AASIM (7), Shazan Ahmad (8), Ahamed shehzad (9), Shafin Abdul Shukoor (8), Muhammed Abid (7), Mohammed Fizan Ali (8), Ali Abdul Mateen (9), Joseph g kolath (8), Aaqil Abdullah (7), Suthan Hashim (9), Affaan Raqib Ahmed (8), MUHAMMED RISHAN (9), Sohan v gowda (8), RAYAN (10), Rishabh.M (7), Fahim Abdulla (8), Sahal Afsal (9), Sajeer Ahamed (8), Naiman (7), Amaan Shafiq Mundapally (8), Sahas s Shetty (7), Hafil (8), Ahamed Shibil Mubarak (9), Aatif (8), Jinu Justin (7), Nihal (8), Deekshit (7)";
const rawFWDs = "Kudlu Akash Prasad (11), Abhin Dev (10), Shanu Shahabab (11), Sanand s Ranjith (12), Obeidullah Shaikh (10), Jestin John (11), Haaris Ahmed (10), Ajzal Abdullah (12), Roshan (11), Meeran Faridi (11), Muhammad Hasan Basheer (12), Mohammed Shibin (10), Shameel (11), Nihal Abdul Basheer (12), Hadi (11), Muhammed Farzeen (11), Nazam (10), Azim Abubaker (11), NUSAIF (12)";
const rawFLEX = "Yohan Alberto (9), Fuzail Hajwane (8), Sachin (10), Junaid Raheem (9), Mohammed hashir k (8), BHARATH S KUMAR (10), Aditya Simon Thomas (9), Rishan madhav (8), Abdulla mc (10), Mohammad Saaim Lone (9), Riza Abbas (8)";

function parsePlayers(raw: string, pos: Position): Player[] {
  return raw.split(',').map((p, i) => {
    const match = p.trim().match(/(.+)\s\((\d+)\)/);
    const name = match ? match[1] : p.trim();
    const price = match ? parseInt(match[2]) : 7;
    const teamId = INITIAL_STANDINGS[i % INITIAL_STANDINGS.length].id;
    return {
      id: `${pos}-${i}-${name.replace(/\s/g, '').toLowerCase()}-${Date.now()}`,
      name: name,
      position: pos,
      price: price,
      points: 0,
      batch: "Tournament 2026",
      teamId: teamId,
      goals: 0,
      assists: 0,
      yellowCards: 0,
      redCards: 0
    };
  });
}

export const INITIAL_PLAYERS: Player[] = [
  ...parsePlayers(rawGKs, Position.GK),
  ...parsePlayers(rawDEFs, Position.DEF),
  ...parsePlayers(rawMIDs, Position.MID),
  ...parsePlayers(rawFWDs, Position.FWD),
  ...parsePlayers(rawFLEX, Position.FLEX),
];

export const INITIAL_MATCHES: Match[] = [];
export const MAX_BUDGET = 60;
export const MAX_PLAYERS = 9;
export const MAX_STARTERS = 6;
