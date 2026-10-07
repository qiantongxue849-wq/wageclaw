import income from '../assets/ui/income.png';
import offwork from '../assets/ui/offwork.png';
import payday from '../assets/ui/payday.png';
import holiday from '../assets/ui/holiday.png';
import bonus from '../assets/ui/bonus.png';
import spring from '../assets/ui/spring.png';
import rest from '../assets/ui/rest.png';

export const cardArt = { income, offwork, payday, holiday, bonus, spring, rest };

export function artForTopic(topic: string) {
  if (topic === 'income') return income;
  if (topic === 'payday') return payday;
  if (topic === 'offwork') return offwork;
  if (topic === 'holiday' || topic === 'break') return holiday;
  if (topic === 'spring') return spring;
  if (topic === 'bonus') return bonus;
  return rest;
}
