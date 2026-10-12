import { SongDraft } from '../types';

const STORAGE_KEY = 'lyricflow_pro_drafts_v1';
const ACTIVE_SONG_ID_KEY = 'lyricflow_pro_active_song_id';

export const SAMPLE_SONGS: SongDraft[] = [
  {
    id: 'sample_song_1',
    title: 'Midnight Echoes',
    subtitle: 'Acoustic Indie Anthem',
    artist: 'LyricFlow Session',
    status: 'in_progress',
    genre: 'Indie Folk / Pop',
    tempo: 108,
    timeSignature: '4/4',
    key: 'Am',
    capo: 0,
    progression: ['Am', 'F', 'C', 'G'],
    tags: ['acoustic', 'reflective', 'anthem'],
    rhymeNotes: 'night / sight / flight / bright\nrain / remain / explain / chain',
    notes: 'Keep the bridge vocal delicate and build the acoustic strumming on the second chorus.',
    content: `[Verse 1]
[Am]Walking through the empty streets at [F]midnight
[C]Streetlights flicking like a broken [G]dream
[Am]Every shadow whispering a [F]secret
[C]Nothing is quite what it [G]seems

[Pre-Chorus]
[F]And I feel the distance [G]growing
[Am]Like a river overflowing [C]
[F]Running faster than the [G]wind

[Chorus]
[Am]Through the midnight [F]echoes calling out your [C]name
[G]Burning through the cold November [Am]rain
[F]Waiting for the dawn to break the [C]chain
[G]Hear the midnight echoes calling [Am]

[Verse 2]
[Am]Footsteps fading on the wet [F]pavement
[C]Searching for a trace of who we [G]were
[Am]Paper memories scattered in the [F]gutter
[C]Everything has turned into a [G]blur

[Chorus]
[Am]Through the midnight [F]echoes calling out your [C]name
[G]Burning through the cold November [Am]rain
[F]Waiting for the dawn to break the [C]chain
[G]Hear the midnight echoes calling [Am]

[Bridge]
[Dm]If time is just a thief in the [Am]shadows
[Dm]Then love is every spark we left be[G]hind

[Outro]
[Am]Echoes, [F]echoes...
[C]Till the morning [G]light. [Am]`,
    createdAt: Date.now() - 86400000 * 2,
    updatedAt: Date.now() - 3600000,
    revisions: [
      {
        id: 'rev_sample_1_initial',
        songId: 'sample_song_1',
        title: 'Midnight Echoes',
        versionLabel: 'v1.0 - Initial Verse & Chorus Idea',
        timestamp: Date.now() - 86400000 * 2,
        key: 'Em',
        tempo: 100,
        timeSignature: '4/4',
        capo: 0,
        progression: ['Em', 'C', 'G', 'D'],
        content: `[Verse 1]\n[Em]Walking through the empty streets at [C]midnight\n[G]Streetlights flicking like a [D]dream\n\n[Chorus]\n[Em]Midnight echoes [C]calling your name\n[G]Burning in the [D]rain`,
        summary: {
          lineCount: 6,
          wordCount: 22,
          chordCount: 6,
          progressionSummary: 'Em - C - G - D',
        },
      },
      {
        id: 'rev_sample_1_rework',
        songId: 'sample_song_1',
        title: 'Midnight Echoes',
        versionLabel: 'v1.1 - Shifted to Am & Added Bridge Chords',
        timestamp: Date.now() - 86400000 * 1,
        key: 'Am',
        tempo: 108,
        timeSignature: '4/4',
        capo: 0,
        progression: ['Am', 'F', 'C', 'G'],
        content: `[Verse 1]\n[Am]Walking through the empty streets at [F]midnight\n[C]Streetlights flicking like a broken [G]dream\n[Am]Every shadow whispering a [F]secret\n[C]Nothing is quite what it [G]seems\n\n[Chorus]\n[Am]Through the midnight [F]echoes calling out your [C]name\n[G]Burning through the cold November [Am]rain\n[F]Waiting for the dawn to break the [C]chain\n[G]Hear the midnight echoes calling [Am]`,
        summary: {
          lineCount: 11,
          wordCount: 52,
          chordCount: 12,
          progressionSummary: 'Am - F - C - G',
        },
      },
    ],
  },
  {
    id: 'sample_song_2',
    title: 'Golden Horizon',
    subtitle: 'Uplifting Summer Track',
    artist: 'Studio Demo',
    status: 'polished',
    genre: 'Country Pop',
    tempo: 124,
    timeSignature: '4/4',
    key: 'G',
    capo: 2,
    progression: ['G', 'C', 'Em', 'D'],
    tags: ['summer', 'roadtrip', 'acoustic'],
    rhymeNotes: 'gold / hold / told / bold\nsky / high / fly',
    notes: 'Capo 2nd fret for acoustic warmth.',
    content: `[Verse 1]
[G]Tires humming on the two-lane [C]highway
[Em]Windows down and the radio [D]loud
[G]Leaving every heavy thought be[C]hind us
[Em]Far away from every city [D]cloud

[Chorus]
[G]Chasing the golden ho[C]rizon
[Em]Reaching up into the endless [D]sky
[G]Every mile we take is [C]shining
[Em]Never gonna let this feeling [D]die`,
    createdAt: Date.now() - 86400000 * 5,
    updatedAt: Date.now() - 86400000,
    revisions: [
      {
        id: 'rev_sample_2_init',
        songId: 'sample_song_2',
        title: 'Golden Horizon',
        versionLabel: 'v1.0 - Roadtrip chords (G - C - D)',
        timestamp: Date.now() - 86400000 * 5,
        key: 'G',
        tempo: 120,
        timeSignature: '4/4',
        capo: 0,
        progression: ['G', 'C', 'D'],
        content: `[Verse 1]\n[G]Tires humming on the two-lane [C]highway\n[D]Windows down\n\n[Chorus]\n[G]Chasing the golden [C]horizon\n[D]Sky`,
        summary: {
          lineCount: 5,
          wordCount: 15,
          chordCount: 4,
          progressionSummary: 'G - C - D',
        },
      },
    ],
  },
];

export function loadStoredSongs(): SongDraft[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load songs from localStorage:', e);
  }
  // Store sample songs by default
  saveStoredSongs(SAMPLE_SONGS);
  return SAMPLE_SONGS;
}

export function saveStoredSongs(songs: SongDraft[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(songs));
  } catch (e) {
    console.error('Failed to save songs to localStorage:', e);
  }
}

export function getActiveSongId(): string | null {
  return localStorage.getItem(ACTIVE_SONG_ID_KEY);
}

export function setActiveSongId(id: string) {
  localStorage.setItem(ACTIVE_SONG_ID_KEY, id);
}
