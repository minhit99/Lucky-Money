
export interface Denomination {
  id: string;
  label: string;
  value: number;
  weight: number;
  color: string;
}

export interface HistoryEntry {
  id: string;
  label: string;
  timestamp: number;
}

export enum GameState {
  IDLE = 'IDLE',
  SPINNING = 'SPINNING',
  WINNING = 'WINNING'
}

export enum SelectionMode {
  WHEEL = 'WHEEL',
  ENVELOPES = 'ENVELOPES'
}
