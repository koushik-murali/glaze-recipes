import { format } from 'date-fns';

/**
 * Get cone number from temperature
 */
export function getConeFromTemperature(temp: number): string {
  if (temp >= 1060 && temp <= 1080) return '04';
  if (temp >= 1040 && temp <= 1060) return '05';
  if (temp >= 990 && temp <= 1020) return '06';
  if (temp >= 950 && temp <= 980) return '07';
  if (temp >= 910 && temp <= 940) return '08';
  if (temp >= 890 && temp <= 920) return '09';
  if (temp >= 880 && temp <= 900) return '10';
  return `${temp}°C`;
}

/**
 * Generate default title for firing log
 */
export function generateFiringLogTitle(targetTemp: number, date: string): string {
  const cone = getConeFromTemperature(targetTemp);
  const formattedDate = format(new Date(date), 'MMM dd, yyyy');
  return `Cone ${cone}, ${formattedDate}`;
}

/**
 * Get firing log display title (user-defined or generated)
 */
export function getFiringLogDisplayTitle(firingLog: any): string {
  if (firingLog.title) {
    return firingLog.title;
  }
  return generateFiringLogTitle(firingLog.target_temperature, firingLog.date);
}
