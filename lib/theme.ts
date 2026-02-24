/**
 * Temas simplificados
 * Ultra ligero - solo objetos planos
 */

import type { BusinessTheme } from './types';

export const themes: Record<string, BusinessTheme> = {
  modern: {
    id: 'modern',
    name: 'Moderno',
    colors: {
      primary: '#ea580c',
      primaryForeground: '#ffffff',
      secondary: '#fef3c7',
      secondaryForeground: '#92400e',
      background: '#fafaf9',
      foreground: '#1c1917',
      muted: '#f5f5f4',
      mutedForeground: '#78716c',
      border: '#e7e5e4',
      card: '#ffffff',
      cardForeground: '#1c1917',
    },
    borderRadius: '0.75rem',
  },
  classic: {
    id: 'classic',
    name: 'Clásico',
    colors: {
      primary: '#7c2d12',
      primaryForeground: '#ffedd5',
      secondary: '#fed7aa',
      secondaryForeground: '#7c2d12',
      background: '#fafaf9',
      foreground: '#292524',
      muted: '#f5f5f4',
      mutedForeground: '#78716c',
      border: '#d6d3d1',
      card: '#ffffff',
      cardForeground: '#292524',
    },
    borderRadius: '0.25rem',
  },
  minimal: {
    id: 'minimal',
    name: 'Minimalista',
    colors: {
      primary: '#18181b',
      primaryForeground: '#fafafa',
      secondary: '#f4f4f5',
      secondaryForeground: '#18181b',
      background: '#ffffff',
      foreground: '#09090b',
      muted: '#f4f4f5',
      mutedForeground: '#71717a',
      border: '#e4e4e7',
      card: '#ffffff',
      cardForeground: '#09090b',
    },
    borderRadius: '0',
  },
  playful: {
    id: 'playful',
    name: 'Divertido',
    colors: {
      primary: '#db2777',
      primaryForeground: '#ffffff',
      secondary: '#fef08a',
      secondaryForeground: '#854d0e',
      background: '#fffbeb',
      foreground: '#431407',
      muted: '#fef3c7',
      mutedForeground: '#a16207',
      border: '#fde68a',
      card: '#ffffff',
      cardForeground: '#431407',
    },
    borderRadius: '1rem',
  },
};

export function getTheme(industryType?: string): BusinessTheme {
  const map: Record<string, string> = {
    RESTAURANT: 'modern',
    CAFE: 'minimal',
    FAST_FOOD: 'playful',
    BAKERY: 'classic',
    ICE_CREAM: 'playful',
    JUICE_BAR: 'minimal',
    GROCERY: 'classic',
    PHARMACY: 'minimal',
  };
  return themes[map[industryType?.toUpperCase() || ''] || 'modern'];
}

export function generateThemeCSS(theme: BusinessTheme): string {
  return `
    --color-primary: ${theme.colors.primary};
    --color-primary-foreground: ${theme.colors.primaryForeground};
    --color-secondary: ${theme.colors.secondary};
    --color-secondary-foreground: ${theme.colors.secondaryForeground};
    --color-background: ${theme.colors.background};
    --color-foreground: ${theme.colors.foreground};
    --color-muted: ${theme.colors.muted};
    --color-muted-foreground: ${theme.colors.mutedForeground};
    --color-border: ${theme.colors.border};
    --color-card: ${theme.colors.card};
    --color-card-foreground: ${theme.colors.cardForeground};
    --radius: ${theme.borderRadius};
  `;
}
