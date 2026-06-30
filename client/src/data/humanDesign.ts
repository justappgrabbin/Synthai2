/**
 * Human Design reference data — gate colors, center maps.
 * Used by NovelWriter for Klein dimensional addressing.
 */

export type Center =
  | 'Head' | 'Ajna' | 'Throat' | 'G' | 'Heart'
  | 'SolarPlexus' | 'Sacral' | 'Spleen' | 'Root';

export type Color = 1 | 2 | 3 | 4 | 5 | 6;

// Gate → primary color (1-6), derived from trigram interference
export const COLOR_MAP: Record<number, Color> = {
  1:1, 2:2, 3:3, 4:4, 5:5, 6:6, 7:1, 8:2, 9:3, 10:4, 11:5, 12:6,
  13:1, 14:2, 15:3, 16:4, 17:5, 18:6, 19:1, 20:2, 21:3, 22:4, 23:5, 24:6,
  25:1, 26:2, 27:3, 28:4, 29:5, 30:6, 31:1, 32:2, 33:3, 34:4, 35:5, 36:6,
  37:1, 38:2, 39:3, 40:4, 41:5, 42:6, 43:1, 44:2, 45:3, 46:4, 47:5, 48:6,
  49:1, 50:2, 51:3, 52:4, 53:5, 54:6, 55:1, 56:2, 57:3, 58:4, 59:5, 60:6,
  61:1, 62:2, 63:3, 64:4,
};

// Gate → center mapping
export const CENTER_MAP_REF: Record<number, Center> = {
  64:  'Head',   47: 'Head',   4:  'Head',   17: 'Head',   43: 'Head',   11: 'Head',   24: 'Head',
  61:  'Head',   63: 'Head',
  47:  'Ajna',   4:  'Ajna',   17: 'Ajna',   43: 'Ajna',   11: 'Ajna',   24: 'Ajna',
  62:  'Throat', 23: 'Throat', 56: 'Throat', 35: 'Throat', 12: 'Throat', 45: 'Throat',
  33:  'Throat', 8:  'Throat', 31: 'Throat', 20: 'Throat', 16: 'Throat',
  1:   'G',      13: 'G',      25: 'G',      46: 'G',      2:  'G',      15: 'G',      10: 'G',
  7:   'G',      7:  'G',
  21:  'Heart',  40: 'Heart',  26: 'Heart',  51: 'Heart',
  36:  'SolarPlexus', 22: 'SolarPlexus', 37: 'SolarPlexus', 6: 'SolarPlexus',
  49:  'SolarPlexus', 55: 'SolarPlexus', 30: 'SolarPlexus',
  34:  'Sacral', 5:  'Sacral', 14: 'Sacral', 29: 'Sacral', 59: 'Sacral',
  9:   'Sacral', 3:  'Sacral', 42: 'Sacral', 27: 'Sacral',
  44:  'Spleen', 50: 'Spleen', 32: 'Spleen', 28: 'Spleen', 18: 'Spleen',
  48:  'Spleen', 57: 'Spleen',
  53:  'Root',   60: 'Root',   52: 'Root',   19: 'Root',   39: 'Root',
  41:  'Root',   58: 'Root',   38: 'Root',   54: 'Root',
};
