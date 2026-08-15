function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

// "Today / Yesterday / March / March 2025" — plain Date/Intl is enough for
// this, no need for a date library. Shared by the wallet screen's category
// drilldown and the cross-wallet Transactions list, so both group the same way.
export function getDateGroupLabel(dateString: string): string {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (isSameDay(date, today)) return 'Today';
  if (isSameDay(date, yesterday)) return 'Yesterday';

  return date.toLocaleDateString(
    undefined,
    date.getFullYear() === today.getFullYear() ? { month: 'long' } : { month: 'long', year: 'numeric' },
  );
}

export function groupRecordsByDate<T extends { date: string }>(records: T[]): { label: string; records: T[] }[] {
  const groups: { label: string; records: T[] }[] = [];
  records.forEach((record) => {
    const label = getDateGroupLabel(record.date);
    const lastGroup = groups[groups.length - 1];
    if (lastGroup && lastGroup.label === label) {
      lastGroup.records.push(record);
    } else {
      groups.push({ label, records: [record] });
    }
  });
  return groups;
}
