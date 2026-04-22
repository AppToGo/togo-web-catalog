const AVATAR_PALETTE = [
  { bg: '#f4efe2', ink: '#5a4e2a' },
  { bg: '#e8eee1', ink: '#3a5530' },
  { bg: '#eae4ee', ink: '#4a3a5c' },
  { bg: '#efe3df', ink: '#6b3d2f' },
  { bg: '#dfe6ec', ink: '#2d4a66' },
];

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

interface InitialsAvatarProps {
  name: string;
  subcatId: string;
}

export function InitialsAvatar({ name, subcatId }: InitialsAvatarProps) {
  const color = AVATAR_PALETTE[hashStr(subcatId) % AVATAR_PALETTE.length];
  const words = name.split(/\s+/).filter(Boolean);
  const initials =
    words.length === 1
      ? words[0].slice(0, 2).toUpperCase()
      : (words[0][0] + words[1][0]).toUpperCase();

  return (
    <div
      className="w-[52px] h-[52px] rounded-lg flex items-center justify-center shrink-0 relative overflow-hidden select-none font-bold text-[15px] tracking-[-0.02em]"
      style={{ background: color.bg, color: color.ink, fontFamily: 'var(--font-display)' }}
    >
      <span className="relative z-[1]">{initials}</span>
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.25)_0%,transparent_60%)] pointer-events-none" />
    </div>
  );
}
