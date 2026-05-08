/// <reference types="vite/client" />

type WageClawDesktopApi = {
  focusScreen: (screen: string) => Promise<{ ok: boolean; screen: string }>;
  openMainPanel: () => Promise<{ ok: boolean }>;
  togglePet: (enabled: boolean) => Promise<{ ok: boolean; visible: boolean }>;
  closeMainWindow: () => void;
   minimizeMainWindow: () => void;
   maximizeMainWindow: () => void;
  petCommand: (payload: Record<string, unknown>) => Promise<{ ok: boolean }>;
  triggerBlackout: (payload: Record<string, unknown>) => Promise<{ ok: boolean }>;
  petRicochet: () => Promise<{ ok: boolean; visible: boolean }>;
  petStorm: () => Promise<{ ok: boolean; visible: boolean }>;
  petNuke: () => Promise<{ ok: boolean; visible: boolean }>;
  petResize: (width: number, height: number) => Promise<{ ok: boolean }>;
  showPet: () => Promise<{ ok: boolean }>;
  petDragStart: () => void;
  petDragMove: (dx: number, dy: number) => void;
  petDragEnd: () => void;
  petHitTest: (interactive: boolean) => void;
  onNavigate: (callback: (payload: { screen?: string }) => void) => () => void;
  onPetCommand: (callback: (payload: Record<string, unknown>) => void) => () => void;
};

declare global {
  interface Window {
    wageclawDesktop?: WageClawDesktopApi;
  }
}

export {};
