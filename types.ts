export enum Role {
  MAFIA = 'مافیا',
  CITIZEN = 'شهروند',
}

export enum GunType {
  CORRECT = 'درست',
  SABOTAGED = 'خرابکاری‌شده',
}

export interface Player {
  id: number;
  name: string;
  role: Role;
  isAlive: boolean;
  hasGun: boolean;
  hasSave: boolean;
  receivedGuns?: GunType[];
}

export enum GamePhase {
  SETUP = 'SETUP',
  ROLE_REVEAL = 'ROLE_REVEAL',
  NIGHT_MAF_CONSULT = 'NIGHT_MAF_CONSULT',
  NIGHT_IND_ACTION = 'NIGHT_IND_ACTION',
  NIGHT_GUN_TRANSFER = 'NIGHT_GUN_TRANSFER',
  DAY_VOTE_NOMINATION = 'DAY_VOTE_NOMINATION',
  DAY_TRIAL = 'DAY_TRIAL',
  DAY_VOTE_FINAL = 'DAY_VOTE_FINAL',
  END = 'END',
}

export interface NightAction {
  shooter: string;
  target: string | null;
}

export interface SaveAction {
  saver: string;
  target: string | null;
}

export interface NightResult {
  eliminated: { player: Player; reason:string }[];
  gunTransfers: { from: Player; gunType: GunType | null; to: string | null }[];
  log: string[];
}