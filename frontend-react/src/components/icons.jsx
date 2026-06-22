// Lightweight stroke-based icon set — no external icon library needed.
// Keeps bundle size down and matches the flat, minimal design system.

const base = {
  fill: "none",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

export function IconHome({ size = 18, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...base}>
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5.5 10v9a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-9" />
      <path d="M9.5 20v-6h5v6" />
    </svg>
  );
}

export function IconMic({ size = 18, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...base}>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <path d="M12 18v3" />
      <path d="M9 21h6" />
    </svg>
  );
}

export function IconClock({ size = 18, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...base}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}

export function IconTrendingUp({ size = 18, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...base}>
      <path d="M3 17l6-6 4 4 8-8" />
      <path d="M15 7h6v6" />
    </svg>
  );
}

export function IconCalendar({ size = 18, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...base}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
      <path d="M3.5 9.5h17" />
      <path d="M8 3v4M16 3v4" />
    </svg>
  );
}

export function IconSettings({ size = 18, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...base}>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 3.5v2M12 18.5v2M3.5 12h2M18.5 12h2M5.8 5.8l1.4 1.4M16.8 16.8l1.4 1.4M5.8 18.2l1.4-1.4M16.8 7.2l1.4-1.4" />
    </svg>
  );
}

export function IconStar({ size = 18, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} fill={color} strokeWidth="1">
      <path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9-4.3-4.1 5.9-.8 2.6-5.4z" />
    </svg>
  );
}

export function IconFlame({ size = 18, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} fill={color} strokeWidth="0.5">
      <path d="M12 2.5c1 2.5-.5 3.6-1.6 4.8-1.3 1.4-2.4 3-2.4 5.2a5 5 0 0 0 10 0c0-1.8-.7-2.9-1.5-4-.2 1.6-1 2.4-1.7 2.4-.9 0-1.2-.8-1-1.7.3-1.3.6-3-1.8-6.7z" />
    </svg>
  );
}

export function IconLogOut({ size = 18, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...base}>
      <path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3" />
      <path d="M15 16l4-4-4-4" />
      <path d="M19 12H9" />
    </svg>
  );
}

export function IconPlus({ size = 18, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...base}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function IconEye({ size = 16, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...base}>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="2.8" />
    </svg>
  );
}

export function IconList({ size = 16, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...base}>
      <path d="M8 6h12M8 12h12M8 18h12" />
      <circle cx="4" cy="6" r="1.1" fill={color} stroke="none" />
      <circle cx="4" cy="12" r="1.1" fill={color} stroke="none" />
      <circle cx="4" cy="18" r="1.1" fill={color} stroke="none" />
    </svg>
  );
}

export function IconBulb({ size = 16, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...base}>
      <path d="M9 18h6" />
      <path d="M10 21h4" />
      <path d="M12 3a6 6 0 0 0-3.5 10.9c.6.45.9 1 1 1.85h5c.1-.85.4-1.4 1-1.85A6 6 0 0 0 12 3z" />
    </svg>
  );
}

export function IconHeart({ size = 16, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...base}>
      <path d="M12 20.5s-7.5-4.6-9.7-9.1C.7 8 2 4.5 5.5 3.7c2-.45 3.8.4 4.9 2 .5.7.6 1 .6 1s.1-.3.6-1c1.1-1.6 2.9-2.45 4.9-2C19.5 4.5 21.3 8 19.7 11.4 17.5 15.9 12 20.5 12 20.5z" />
    </svg>
  );
}

export function IconChevronRight({ size = 14, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...base}>
      <path d="M9 5l7 7-7 7" />
    </svg>
  );
}
