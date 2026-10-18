/** Public business-calendar configuration, never credentials or a frozen date. */
export const DEFAULT_TIME_ZONE = "Asia/Jakarta";
let businessTimeZone = DEFAULT_TIME_ZONE;

export function calendarDate(date = new Date(), timeZone = businessTimeZone): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone, year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(date);
  return ["year", "month", "day"].map(key => parts.find(part => part.type === key)!.value).join("-");
}

export function configureBusinessTimeZone(timeZone: string): void {
  // Validate the IANA identifier before replacing the previous configuration.
  calendarDate(new Date(), timeZone);
  businessTimeZone = timeZone;
}
