import { pillBase, pillTones } from "../lib/ui.js";

const sizeMap = {
  sm: "text-xs",
  md: "text-sm",
};

export default function Pill({ tone = "neutral", size = "sm", className = "", children }) {
  const toneClass = pillTones[tone] || pillTones.neutral;
  const sizeClass = sizeMap[size] || sizeMap.sm;
  return (
    <span className={`${pillBase} ${toneClass} ${sizeClass} ${className}`.trim()}>
      {children}
    </span>
  );
}
