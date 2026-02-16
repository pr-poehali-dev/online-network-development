const months = [
  "янв", "фев", "мар", "апр", "мая", "июн",
  "июл", "авг", "сен", "окт", "ноя", "дек"
];

export function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;

  const day = d.getDate();
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  const hours = d.getHours().toString().padStart(2, "0");
  const minutes = d.getMinutes().toString().padStart(2, "0");

  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);

  if (diffMin < 1) return "только что";
  if (diffMin < 60) return `${diffMin} мин. назад`;
  if (diffHours < 24 && d.getDate() === now.getDate()) {
    return `сегодня, ${hours}:${minutes}`;
  }

  if (year === now.getFullYear()) {
    return `${day} ${month}, ${hours}:${minutes}`;
  }

  return `${day} ${month} ${year}, ${hours}:${minutes}`;
}

export function formatShortDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;

  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);

  if (diffMin < 1) return "сейчас";
  if (diffMin < 60) return `${diffMin}м`;
  if (diffHours < 24) return `${diffHours}ч`;

  const day = d.getDate();
  const month = months[d.getMonth()];
  return `${day} ${month}`;
}

export function formatCount(n: number): string {
  if (!n) return "0";
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
}
