import type { UpdateState } from '../auth-types';
import type { LiteSettings } from './model';
import type { Report } from './broadcast';
export interface DesktopSnapshot { settings: LiteSettings; recovery: boolean; bubble: Report | null }
export interface LiteDesktop {
  bootstrap: (payload: unknown) => Promise<DesktopSnapshot>;
  getSnapshot: () => Promise<DesktopSnapshot>;
  saveSettings: (settings: LiteSettings) => Promise<DesktopSnapshot>;
  resetSettings: () => Promise<DesktopSnapshot>;
  importBackup: () => Promise<DesktopSnapshot | null>;
  onSnapshot: (callback: (state: DesktopSnapshot) => void) => () => void;
  openMain: (screen?: string) => Promise<void>;
  quiet: (mode: 'hour' | 'today' | 'resume') => Promise<DesktopSnapshot>;
  report: () => Promise<void>;
  dismiss: () => Promise<void>;
  hoverBubble: (hovered: boolean) => Promise<void>;
  hoverCard: (show: boolean, delay?: number) => Promise<void>;
  panelBusy: (busy: boolean) => Promise<void>;
  petMenu: () => Promise<void>;
  hitTest: (interactive: boolean) => Promise<void>;
  drag: (payload: { kind: 'start' | 'move' | 'end'; x?: number; y?: number }) => void;
  onAnimate: (callback: (action: 'play' | 'sleep') => void) => () => void;
  onPaused: (callback: (paused: boolean) => void) => () => void;
  onNavigate: (callback: (screen: string) => void) => () => void;
  exportBackup: () => Promise<{ ok: boolean; canceled?: boolean }>;
  getUpdateState: () => Promise<UpdateState>;
  checkForUpdates: () => Promise<UpdateState>;
  installUpdate: () => Promise<UpdateState>;
  onUpdate: (callback: (state: UpdateState) => void) => () => void;
}
declare global { interface Window { wageclawLite?: LiteDesktop; wageclawInitial?: DesktopSnapshot } }
