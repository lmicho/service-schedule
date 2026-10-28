type IconProps = { className?: string };

const base = {
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export function GridIcon({ className = "size-6" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="3.75" y="3.75" width="7" height="7" rx="1.75" />
      <rect x="13.25" y="3.75" width="7" height="7" rx="1.75" />
      <rect x="3.75" y="13.25" width="7" height="7" rx="1.75" />
      <rect x="13.25" y="13.25" width="7" height="7" rx="1.75" />
    </svg>
  );
}

export function CarIcon({ className = "size-6" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M5 11l1.6-4.4A2 2 0 018.5 5.25h7a2 2 0 011.9 1.35L19 11" />
      <rect x="3.25" y="11" width="17.5" height="6" rx="2" />
      <path d="M6.5 17v2M17.5 17v2" />
      <circle cx="7.5" cy="14" r=".5" fill="currentColor" />
      <circle cx="16.5" cy="14" r=".5" fill="currentColor" />
    </svg>
  );
}

export function ToolsIcon({ className = "size-6" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M3 21h4L20 8a1.5 1.5 0 00-4-4L3 17v4" />
      <path d="M14.5 5.5l4 4M12 8L7 3 3 7l5 5M7 8L5.5 9.5M16 12l5 5-4 4-5-5M16 17l-1.5 1.5" />
    </svg>
  );
}

export function CashIcon({ className = "size-6" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="8.25" />
      <path d="M14.5 9.25c-.4-.8-1.4-1.25-2.5-1.25-1.4 0-2.5.7-2.5 1.75S10.6 11.3 12 11.6s2.5.9 2.5 1.9S13.4 15.25 12 15.25c-1.1 0-2.1-.45-2.5-1.25M12 6.5V8m0 7.25v1.5" />
    </svg>
  );
}

export function PlusIcon({ className = "size-5" }: IconProps) {
  return (
    <svg {...base} strokeWidth={1.75} className={className}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function MenuIcon({ className = "size-6" }: IconProps) {
  return (
    <svg {...base} strokeWidth={1.75} className={className}>
      <path d="M4 7h16M4 17h16M4 12h10" />
    </svg>
  );
}

export function CloseIcon({ className = "size-6" }: IconProps) {
  return (
    <svg {...base} strokeWidth={1.75} className={className}>
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

export function SunIcon({ className = "size-5" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2m0 16v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M2 12h2m16 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  );
}

export function MoonIcon({ className = "size-5" }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M20.5 14.2A8.5 8.5 0 019.8 3.5 8.5 8.5 0 1020.5 14.2z" />
    </svg>
  );
}
