import { RhymeResult } from '../types';

/**
 * Robust syllable counter for English words & lyrics lines
 */
export function countSyllablesInWord(rawWord: string): number {
  const word = rawWord.toLowerCase().replace(/[^a-z]/g, '');
  if (!word) return 0;
  if (word.length <= 3) return 1;

  // Handle common contractions and endings
  const clean = word
    .replace(/(?:[^laeiouy]|ed|es|e)$/, '')
    .replace(/^y/, '');

  const matches = clean.match(/[aeiouy]{1,2}/g);
  return matches ? Math.max(1, matches.length) : 1;
}

export function countSyllablesInLine(line: string): number {
  // Strip chord brackets like [Am] or [G/B]
  const cleanLine = line.replace(/\[[^\]]*\]/g, ' ').trim();
  if (!cleanLine) return 0;

  const words = cleanLine.split(/\s+/).filter(Boolean);
  return words.reduce((sum, word) => sum + countSyllablesInWord(word), 0);
}

// Built-in offline songwriting rhyme groups
const OFFLINE_RHYME_GROUPS: Record<string, string[]> = {
  night: ['light', 'bright', 'fight', 'sight', 'flight', 'tight', 'white', 'height', 'ignite', 'tonight', 'insight', 'daylight', 'midnight'],
  fire: ['desire', 'higher', 'wire', 'choir', 'liar', 'tire', 'admire', 'inspire', 'aspire', 'acquire'],
  heart: ['part', 'start', 'smart', 'chart', 'dart', 'art', 'apart', 'depart', 'restart'],
  time: ['rhyme', 'clime', 'climb', 'crime', 'dime', 'lime', 'prime', 'sublime', 'lifetime'],
  love: ['above', 'dove', 'glove', 'shove'],
  dream: ['gleam', 'beam', 'stream', 'seem', 'team', 'scheme', 'theme', 'scream', 'extreme'],
  rain: ['pain', 'gain', 'stain', 'train', 'chain', 'brain', 'plain', 'remain', 'explain', 'insane'],
  free: ['see', 'tree', 'sea', 'knee', 'flee', 'plea', 'be', 'me', 'we', 'destiny', 'memory', 'harmony'],
  away: ['day', 'say', 'stay', 'play', 'gray', 'pray', 'way', 'may', 'display', 'decay', 'today'],
  hold: ['cold', 'bold', 'gold', 'fold', 'told', 'sold', 'old', 'untold', 'behold'],
  soul: ['whole', 'roll', 'control', 'goal', 'toll', 'stroll', 'patrol'],
  deep: ['keep', 'sleep', 'weep', 'leap', 'creep', 'steep', 'reap'],
  eyes: ['skies', 'lies', 'cries', 'dies', 'flies', 'rise', 'ties', 'disguise', 'sunrise'],
  sound: ['ground', 'found', 'bound', 'round', 'wound', 'profound', 'around'],
  mind: ['find', 'blind', 'kind', 'wind', 'bind', 'behind', 'remind', 'aligned'],
  glow: ['flow', 'show', 'slow', 'know', 'grow', 'blow', 'below', 'shadow'],
  cry: ['fly', 'die', 'sky', 'lie', 'why', 'try', 'high', 'goodbye', 'reply'],
  shine: ['fine', 'mine', 'line', 'wine', 'pine', 'divine', 'combine', 'design'],
};

// Common word synonyms & emotional lyrical triggers
const LYRICAL_METAPHORS: Record<string, string[]> = {
  love: ['devotion', 'passion', 'yearning', 'flame', 'embracing', 'adoration', 'gravity', 'electric'],
  sad: ['hollow', 'shattered', 'shadows', 'bittersweet', 'melancholy', 'autumn', 'echos', 'drowning'],
  happy: ['golden', 'euphoria', 'sunburst', 'radiant', 'electric', 'unbound', 'floating', 'vibrant'],
  dark: ['midnight', 'velvet', 'abyss', 'obsidian', 'smoke', 'twilight', 'whisper', 'eclipse'],
  light: ['dawn', 'luminescence', 'beacon', 'ember', 'constellation', 'prism', 'glimmer', 'halo'],
  loss: ['ghost', 'empty chair', 'silence', 'fading footsteps', 'remnants', 'aftermath', 'relic'],
};

/**
 * Finds rhymes, near rhymes, and poetic synonyms for any given word
 */
export async function searchRhymes(targetWord: string): Promise<{
  perfect: RhymeResult[];
  near: RhymeResult[];
  synonyms: RhymeResult[];
}> {
  const clean = targetWord.trim().toLowerCase().replace(/[^a-z]/g, '');
  if (!clean) {
    return { perfect: [], near: [], synonyms: [] };
  }

  const perfectResults: RhymeResult[] = [];
  const nearResults: RhymeResult[] = [];
  const synonymResults: RhymeResult[] = [];

  // Offline fallback initial check
  for (const [key, group] of Object.entries(OFFLINE_RHYME_GROUPS)) {
    if (key === clean || group.includes(clean)) {
      const allWords = [key, ...group].filter((w) => w !== clean);
      allWords.slice(0, 15).forEach((w) => {
        perfectResults.push({
          word: w,
          numSyllables: countSyllablesInWord(w),
          type: 'perfect',
        });
      });
      break;
    }
  }

  // Check lyrical metaphors
  if (LYRICAL_METAPHORS[clean]) {
    LYRICAL_METAPHORS[clean].forEach((w) => {
      synonymResults.push({
        word: w,
        numSyllables: countSyllablesInWord(w),
        type: 'synonym',
      });
    });
  }

  // Fetch from Datamuse API (fast, reliable, free JSON API)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);

    const [rhyRes, nryRes, synRes] = await Promise.all([
      fetch(`https://api.datamuse.com/words?rel_rhy=${clean}&max=25`, { signal: controller.signal }).catch(() => null),
      fetch(`https://api.datamuse.com/words?rel_nry=${clean}&max=25`, { signal: controller.signal }).catch(() => null),
      fetch(`https://api.datamuse.com/words?ml=${clean}&max=15`, { signal: controller.signal }).catch(() => null),
    ]);

    clearTimeout(timeout);

    if (rhyRes && rhyRes.ok) {
      const data = await rhyRes.json();
      if (Array.isArray(data) && data.length > 0) {
        perfectResults.length = 0; // replace fallback with richer API list
        data.forEach((item: any) => {
          perfectResults.push({
            word: item.word,
            score: item.score,
            numSyllables: item.numSyllables || countSyllablesInWord(item.word),
            type: 'perfect',
          });
        });
      }
    }

    if (nryRes && nryRes.ok) {
      const data = await nryRes.json();
      if (Array.isArray(data)) {
        data.forEach((item: any) => {
          if (!perfectResults.some((p) => p.word === item.word)) {
            nearResults.push({
              word: item.word,
              score: item.score,
              numSyllables: item.numSyllables || countSyllablesInWord(item.word),
              type: 'near',
            });
          }
        });
      }
    }

    if (synRes && synRes.ok) {
      const data = await synRes.json();
      if (Array.isArray(data)) {
        data.forEach((item: any) => {
          if (!synonymResults.some((s) => s.word === item.word)) {
            synonymResults.push({
              word: item.word,
              numSyllables: item.numSyllables || countSyllablesInWord(item.word),
              type: 'synonym',
            });
          }
        });
      }
    }
  } catch {
    // Gracefully use the offline fallback
  }

  return {
    perfect: perfectResults,
    near: nearResults,
    synonyms: synonymResults,
  };
}

/**
 * Detects rhyme schemes across stanza lines (e.g. AABB, ABAB)
 */
export function analyzeRhymeScheme(lines: string[]): string[] {
  const lastWords = lines.map((line) => {
    const clean = line.replace(/\[[^\]]*\]/g, '').trim();
    const parts = clean.split(/\s+/).filter(Boolean);
    return parts.length > 0 ? parts[parts.length - 1].toLowerCase().replace(/[^a-z]/g, '') : '';
  });

  const scheme: string[] = [];
  const assignedLetters: Record<string, string> = {};
  let currentLetterCode = 65; // 'A'

  for (let i = 0; i < lastWords.length; i++) {
    const word = lastWords[i];
    if (!word) {
      scheme.push('');
      continue;
    }

    // Check if this word rhymes with any previous word
    let matchedLetter = '';
    for (let j = 0; j < i; j++) {
      const prevWord = lastWords[j];
      if (!prevWord) continue;

      if (
        word === prevWord ||
        (word.length >= 3 && prevWord.length >= 3 && word.slice(-3) === prevWord.slice(-3)) ||
        (word.length >= 2 && prevWord.length >= 2 && word.slice(-2) === prevWord.slice(-2))
      ) {
        matchedLetter = scheme[j];
        break;
      }
    }

    if (matchedLetter) {
      scheme.push(matchedLetter);
    } else {
      const newLetter = String.fromCharCode(currentLetterCode++);
      scheme.push(newLetter);
      assignedLetters[word] = newLetter;
    }
  }

  return scheme;
}
