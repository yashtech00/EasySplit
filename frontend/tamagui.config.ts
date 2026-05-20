import { createTamagui } from 'tamagui'
import { config } from '@tamagui/config'

// Custom sleek modern light palette
const lightTheme = {
  ...config.themes.light,
  background: '#F8FAFC', // Slate 50 (clean modern light bg)
  backgroundHover: '#F1F5F9', // Slate 100
  backgroundPress: '#E2E8F0', // Slate 200
  backgroundFocus: '#E2E8F0',
  color: '#0F172A', // Slate 900 (crisp high contrast text)
  colorHover: '#1E293B', // Slate 800
  colorPress: '#0F172A',
  colorFocus: '#0F172A',
  borderColor: '#E2E8F0', // Slate 200
  borderColorHover: '#CBD5E1', // Slate 300
  borderColorPress: '#94A3B8', // Slate 400
  borderColorFocus: '#94A3B8',

  // Brand Accent: Sleek Modern Violet/Indigo (instead of standard blue)
  blue1: '#EEF2F6',
  blue2: '#E0E7FF',
  blue3: '#C7D2FE',
  blue4: '#A5B4FC',
  blue5: '#818CF8',
  blue6: '#6366F1',
  blue7: '#4F46E5',
  blue8: '#4338CA',
  blue9: '#3730A3',
  blue10: '#4F46E5', // Primary Brand Color
  blue11: '#4338CA',
  blue12: '#312E81',

  // Success Accent: Vibrant Emerald (instead of basic green)
  green1: '#F0FDF4',
  green2: '#DCFCE7',
  green3: '#BBF7D0',
  green4: '#86EFAC',
  green5: '#4ADE80',
  green6: '#22C55E',
  green7: '#16A34A',
  green8: '#15803D',
  green9: '#14532D',
  green10: '#10B981', // Emerald-500
  green11: '#059669',
  green12: '#064E3B',

  // Warning/Owe Accent: Vibrant Coral/Rose (instead of basic red)
  red1: '#FFF1F2',
  red2: '#FFE4E6',
  red3: '#FECDD3',
  red4: '#FDA4AF',
  red5: '#FB7185',
  red6: '#F43F5E',
  red7: '#E11D48',
  red8: '#BE123C',
  red9: '#881337',
  red10: '#F43F5E', // Rose-500
  red11: '#E11D48',
  red12: '#4C0519',

  // Custom premium amber for secondary warning/orange statuses
  orange1: '#FFFBEB',
  orange2: '#FEF3C7',
  orange3: '#FDE68A',
  orange4: '#FCD34D',
  orange5: '#FBBF24',
  orange6: '#F59E0B',
  orange7: '#D97706',
  orange8: '#B45309',
  orange9: '#78350F',
  orange10: '#F59E0B',
  orange11: '#D97706',
  orange12: '#451A03',

  // Neutrals: Cool zinc/slate shades for high premium contrast
  gray1: '#F8FAFC',
  gray2: '#F1F5F9',
  gray3: '#E2E8F0',
  gray4: '#CBD5E1',
  gray5: '#94A3B8',
  gray6: '#64748B',
  gray7: '#475569',
  gray8: '#334155',
  gray9: '#1E293B',
  gray10: '#64748B',
  gray11: '#475569',
  gray12: '#0F172A',
}

const tamaguiConfig = createTamagui({
  ...config,
  themes: {
    ...config.themes,
    light: lightTheme,
  }
})

export type Conf = typeof tamaguiConfig

declare module 'tamagui' {
  interface TamaguiCustomConfig extends Conf {}
}

export default tamaguiConfig
