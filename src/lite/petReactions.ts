import type { Report } from './broadcast';

export type PetAction = 'play' | 'sleep' | 'stretch' | 'notice' | 'celebrate';

/** React to the delivered report, never to formatted text or a made-up reward. */
export function reportAction(report: Pick<Report, 'id' | 'topic'>): PetAction | null {
  if (report.topic === 'error') return null;
  if (report.id === 'income-zero') return 'notice';
  if (report.id === 'spring-rest') return 'sleep';
  if (report.topic === 'comfort') return report.id === 'stretch' ? 'stretch' : 'play';
  if (report.id === 'end' || report.topic === 'income' || report.id === 'bonus-received') return 'celebrate';
  if (['offwork', 'holiday', 'spring', 'bonus'].includes(report.topic)) return 'notice';
  if (report.topic === 'rest') return 'sleep';
  return 'play';
}
