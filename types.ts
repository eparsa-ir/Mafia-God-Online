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
  NIGHT_MAF_ACTION = 'NIGHT_MAF_ACTION',
  NIGHT_IND_ACTION = 'NIGHT_IND_ACTION',
  NIGHT_GUN_TRANSFER = 'NIGHT_GUN_TRANSFER',
  DAY = 'DAY',
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