'use client';

import { formatPrice } from '@/lib/utils';

export interface HighlightItem {
  id: string;
  name: string;
  price: number;
  priceBefore?: number;
  badge?: string;
}

interface HighlightsRailProps {
  highlights?: HighlightItem[];
}

export function HighlightsRail({ highlights }: HighlightsRailProps) {
  if (!highlights || highlights.length === 0) return null;

  return (
    <div className="pt-3 pb-1 border-b border-[var(--line)]">
      <div
        className="flex gap-[10px] overflow-x-auto px-4 pt-1 pb-2 scrollbar-hide"
        style={{ scrollbarWidth: 'none' } as React.CSSProperties}
      >
        {highlights.map((item) => (
          <div
            key={item.id}
            className="shrink-0 w-[120px] bg-[var(--surface)] border-[1.5px] border-[var(--line)] rounded-xl p-[10px] cursor-pointer transition-[border-color,box-shadow] hover:border-[var(--accent)] hover:shadow-sm"
          >
            {item.badge && (
              <div className="inline-block text-[10px] font-semibold text-[var(--accent)] bg-[var(--accent-soft)] px-[6px] py-[2px] rounded-[4px] mb-1 uppercase tracking-[0.04em]">
                {item.badge}
              </div>
            )}
            <div className="text-xs font-semibold text-[var(--ink)] leading-[1.3] mb-1 line-clamp-2">
              {item.name}
            </div>
            <div className="flex items-baseline gap-1">
              {item.priceBefore && (
                <span className="text-[11px] text-[var(--ink-3)] line-through">
                  {formatPrice(item.priceBefore)}
                </span>
              )}
              <span
                className="text-[13px] font-bold text-[var(--accent)] tracking-[-0.03em]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {formatPrice(item.price)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
