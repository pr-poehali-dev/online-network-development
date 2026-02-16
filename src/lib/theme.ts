export type ThemeKey = "dark-green" | "dark-blue" | "crystal" | "white-yellow";

export interface ThemeInfo {
  key: ThemeKey;
  name: string;
  bg: string;
  card: string;
  primary: string;
}

export const themes: ThemeInfo[] = [
  { key: "dark-green", name: "Темно-зеленая", bg: "#0a1a0f", card: "#0f2415", primary: "#22c55e" },
  { key: "dark-blue", name: "Темно-синяя", bg: "#0a0f1a", card: "#0f1524", primary: "#3b82f6" },
  { key: "crystal", name: "Кристальная", bg: "#f0f4f8", card: "#ffffff", primary: "#6366f1" },
  { key: "white-yellow", name: "Светло-желтая", bg: "#fffdf7", card: "#ffffff", primary: "#eab308" },
];

export function getStoredTheme(): ThemeKey {
  return (localStorage.getItem("buzzy_theme") as ThemeKey) || "dark-green";
}

export function setStoredTheme(theme: ThemeKey) {
  localStorage.setItem("buzzy_theme", theme);
  applyTheme(theme);
}

export function applyTheme(theme: ThemeKey) {
  document.documentElement.setAttribute("data-theme", theme);
}

export function initTheme() {
  const theme = getStoredTheme();
  applyTheme(theme);
}
