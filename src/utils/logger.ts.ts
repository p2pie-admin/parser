import { memoryUsage } from "process";

export const mylog = (
  message: string,
  color:
    | "error"
    | "success"
    | "warning"
    | "important"
    | "info"
    | "hidden" = "info"
) => {
  const colors = {
    error: "📕 \u001b[1;31m", // red
    success: "📗 \u001b[1;32m", // green
    warning: "📙 \u001b[38;5;208m", // orange
    important: "📔 \u001b[1;33m", // yellow
    info: "📘 \u001b[1;34m", // blue
    hidden: "📓 \u001b[1;30m", // gray
  };

  // fallback на фиолетовый (info)
  const chosenColor = colors[color] || colors.info;

  console.log(`${chosenColor}${message}\u001b[0m`);
};
export const emoji = (id: string | number) => {
  const emojis = {
    "0": "⚪",
    "1": "🟤",
    "2": "🟣",
    "3": "🔵",
    "4": "🟡",
    "5": "🟠",
    "6": "🔴",
    "7": "🟢",
  } as Record<string, string>;
  return emojis[id] || "⚫";
};
