// Local-only adaptation. No score or nickname leaves this device.
export interface ScoreEntry { nickname:string; score:number; created_at:string; }
export class LeaderboardAPI { constructor(..._args:unknown[]) {} async submitScore(_nickname:string,_score:number){return false;} async getTopScores(_limit=100):Promise<ScoreEntry[]>{return [];} }
