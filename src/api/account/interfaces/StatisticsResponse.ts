export interface MatchStats {
  kills: number;
  wins: number;
  matches_played: number;
}

export interface StatisticsResponse {
  AccountID: string;
  MatchesPlayed: number;
  Solos: MatchStats;
  Duos: MatchStats;
  Squads: MatchStats;
  Season: string;
}
