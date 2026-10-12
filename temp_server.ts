import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Modality, GenerateVideosOperation } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Support larger audio & image payloads for transcription and video reference
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Lazy Gemini client helper
function getGenAI(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set in the server environment.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: !!process.env.GEMINI_API_KEY,
    timestamp: Date.now(),
  });
});

// ============================================================================
// 1. INTELLIGENT LYRIC SUGGESTIONS (Lyric Co-Writer)
// ============================================================================
app.post('/api/ai/lyric-suggestions', async (req, res) => {
  try {
    const {
      currentLyrics = '',
      songTitle = 'Untitled',
      genre = 'Singer-Songwriter',
      key = 'C',
      tempo = 120,
      mode = 'couplet', // couplet | continuation | hook | contrast
      prompt = '',
    } = req.body;

    const ai = getGenAI();

    const systemPrompt = `You are an elite multi-platinum songwriter, lyricist, and top-liner co-writing with an artist.
You are helping the artist write lyrics in the style of:
Song Title: "${songTitle}"
Genre: ${genre}
Musical Key: ${key}
Tempo: ${tempo} BPM

Mode requested: "${mode}"
${prompt ? `Additional Artist Direction: "${prompt}"` : ''}

Existing song draft lines:
"""
${currentLyrics ? currentLyrics.slice(-1200) : '(No lyrics written yet)'}
"""

Task based on mode:
- "couplet": Provide 3 distinct rhyming couplet options that fit the rhythm, emotional tone, and rhyme scheme of the preceding lines.
- "continuation": Write a smooth 4-line stanza continuation that develops the narrative or imagery without feeling generic.
- "hook": Generate 3 memorable, anthemic chorus hooks or refrain lines that stick in the listener's head.
- "contrast": Create a dynamic 4-line bridge or pre-chorus that shifts perspective, emotion, or melodic pacing.

Format requirements:
Return ONLY a valid JSON array of suggestion objects. No markdown backticks, no wrapping text outside JSON.
Each object in the array must follow:
{
  "id": "sug_1",
  "type": "${mode}",
  "label": "Short descriptive label (e.g. 'Metaphorical & Intimate', 'Punchy & Rhythmic')",
  "lines": ["Line 1", "Line 2"],
  "rhymeScheme": "e.g. AABB or ABAB",
  "syllableCounts": [8, 8],
  "rationale": "One-sentence explanation of why this lyrical choice lands powerfully."
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: systemPrompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const responseText = response.text || '[]';
    let parsed = [];
    try {
      parsed = JSON.parse(responseText);
    } catch {
      // Fallback clean parsing
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    }

    res.json({ success: true, suggestions: parsed });
  } catch (error: any) {
    console.error('Error generating lyric suggestions:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate lyric suggestions',
    });
  }
});

// ============================================================================
// 2. SMART CHORD PROGRESSION GENERATION
// ============================================================================
app.post('/api/ai/chord-progression', async (req, res) => {
  try {
    const {
      key = 'C',
      mood = 'Emotional, Uplifting',
      genre = 'Indie Folk',
      timeSignature = '4/4',
      tempo = 120,
      currentProgression = [],
      lyricsSnippet = '',
    } = req.body;

    const ai = getGenAI();

    const prompt = `You are a master music theorist and song arranger.
Generate 3 inspiring, professionally voiced chord progressions for a song with:
Key: ${key}
Mood/Vibe: ${mood}
Genre: ${genre}
Time Signature: ${timeSignature}
Tempo: ${tempo} BPM
${currentProgression.length > 0 ? `Current Progression: [${currentProgression.join(' - ')}]` : ''}
${lyricsSnippet ? `Lyrics Context: "${lyricsSnippet.slice(0, 300)}"` : ''}

Rules:
1. Provide 3 distinct progression alternatives (e.g. 1 standard emotional progression, 1 soulful modal variation, 1 dynamic contrast bridge progression).
2. All chord names must be playable and standard (e.g. C, G, Am, F, Dm7, Em, Cadd9, G/B, F#m7b5).
3. Return Roman numeral analysis (e.g. "I - V - vi - IV").
4. Explain the harmonic tension and why it matches the requested mood.

Return ONLY a valid JSON array of objects:
[
  {
    "id": "prog_1",
    "name": "e.g. Bittersweet Ascent",
    "chords": ["C", "Em7", "Am", "Fadd9"],
    "romanNumerals": ["I", "iii7", "vi", "IVadd9"],
    "mood": "Nostalgic, Warm",
    "genreFit": "Folk-Pop / Acoustic",
    "transitionTips": "Smooth step-down bassline from C to B on the way to Am.",
    "whyItWorks": "Delayed resolution creates longing before landing on the resonant tonic."
  }
]`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '[]';
    let parsed = [];
    try {
      parsed = JSON.parse(text);
    } catch {
      const match = text.match(/\[[\s\S]*\]/);
      parsed = match ? JSON.parse(match[0]) : [];
    }

    res.json({ success: true, progressions: parsed });
  } catch (error: any) {
    console.error('Error generating chord progressions:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate chord progressions',
    });
  }
});

// ============================================================================
// 3. AUTOMATED SONG ANALYSIS (Structure, Emotional Arc, Lyrical Density)
// ============================================================================
app.post('/api/ai/analyze-song', async (req, res) => {
  try {
    const {
      title = 'Untitled',
      lyrics = '',
      progression = [],
      key = 'C',
      tempo = 120,
      genre = 'Singer-Songwriter',
    } = req.body;

    if (!lyrics.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Song lyrics must be provided for automated analysis.',
      });
    }

    const ai = getGenAI();

    const prompt = `You are a legendary A&R executive, Grammy-winning producer, and master songwriting coach.
Analyze the following complete song draft and provide comprehensive, objective, highly actionable feedback across 3 core dimensions:
1. Structural Balance (verse/chorus ratio, sectional momentum, dynamic pacing)
2. Emotional Arc (trajectory of tension and release, payoff at peak moments, narrative intrigue)
3. Lyrical Density & Syllable Cadence (meter consistency, line clutter, freshness of rhyme vs clichés)

Song Profile:
Title: "${title}"
Genre: ${genre}
Key: ${key} | Tempo: ${tempo} BPM
Chords: [${progression.join(', ')}]

Lyrics:
"""
${lyrics}
"""

Return ONLY a valid JSON object matching this schema:
{
  "scores": {
    "structure": 88,
    "emotionalArc": 92,
    "lyricalDensity": 84,
    "overall": 88
  },
  "structuralBalance": {
    "assessment": "Detailed paragraph evaluating the song's form, section transitions, and contrast.",
    "sectionBreakdown": [
      { "section": "Verse 1", "linesCount": 4, "rhythmPacing": "Moderate conversational cadence" },
      { "section": "Chorus", "linesCount": 4, "rhythmPacing": "Broad vowel-heavy anthemic lift" }
    ],
    "suggestions": ["Suggestion 1", "Suggestion 2"]
  },
  "emotionalArc": {
    "trajectory": "Summary of how the song builds from opening intrigue to climax and resolution.",
    "tensionReleaseAnalysis": "Analysis of harmonic and emotional tension.",
    "peakMoments": ["Quote or moment 1", "Quote or moment 2"],
    "suggestions": ["Emotional arc tip 1", "Emotional arc tip 2"]
  },
  "lyricalDensity": {
    "feedback": "Evaluation of syllable flow and word choice.",
    "syllableFlow": "Analysis of rhythm and whether any lines feel cluttered or tongue-twisty.",
    "rhymeClutterAssessment": "Assessment of end-rhyme freshness vs predictability.",
    "suggestions": ["Metric tightening tip 1", "Rhyme revision tip 2"]
  },
  "strengths": [
    "Compelling vulnerability in the opening imagery",
    "Hook has excellent melodic repeatability"
  ],
  "actionableTips": [
    "Consider trimming 2 syllables from line 3 of Verse 2 for cleaner breath rhythm",
    "Add a contrasting 4-bar bridge to heighten the emotional payoff of the final chorus"
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    let parsed = {};
    try {
      parsed = JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : {};
    }

    res.json({ success: true, analysis: parsed });
  } catch (error: any) {
    console.error('Error analyzing song:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to analyze song',
    });
  }
});

// ============================================================================
// 4. NATURAL LANGUAGE META-TAGGING
// ============================================================================
app.post('/api/ai/meta-tags', async (req, res) => {
  try {
    const {
      title = '',
      lyrics = '',
      progression = [],
      key = 'C',
      tempo = 120,
    } = req.body;

    const ai = getGenAI();

    const prompt = `You are a music taxonomist, playlist curator, and metadata specialist for major streaming platforms.
Examine this song draft and automatically determine the most accurate, evocative metadata for organization and cataloging.

Song Title: "${title}"
Key: ${key}
Current Tempo: ${tempo} BPM
Chord Progressions: [${progression.join(', ')}]
Lyrics:
"""
${lyrics ? lyrics.slice(0, 1500) : '(No lyrics provided)'}
"""

Determine:
1. Primary Genre (e.g. 'Indie Folk', 'Neo-Soul', 'Synth-Pop', 'Alternative Country')
2. Secondary/Alternate Genres (2-3 tags)
3. Mood Tags (4-6 evocative hashtags like '#Bittersweet', '#GoldenHour', '#LateNightVibes')
4. Tempo Descriptor (e.g. 'Mid-tempo groove with steady acoustic pulse (112-118 BPM)')
5. Suggested BPM (number)
6. Vocal Delivery / Performance Style (e.g. 'Intimate, breathy verses building to raw, belted chorus')
7. Instrumentation Ideas (3-4 instrumental suggestions, e.g. 'Fingerpicked acoustic guitar', 'Warm Rhodes electric piano')
8. Thematic Summary (A 1-2 sentence logline describing what the song is about)

Return ONLY a valid JSON object:
{
  "suggestedGenre": "Indie Folk",
  "alternateGenres": ["Singer-Songwriter", "Acoustic Pop"],
  "moodTags": ["#Melancholic", "#Reflective", "#Nostalgic", "#Intimate", "#Autumnal"],
  "tempoDescriptor": "Contemplative mid-tempo ballad (84 BPM)",
  "suggestedBpm": 84,
  "vocalDelivery": "Conversational, near-whisper delivery in verses opening up with rich vibrato on the hook",
  "instrumentationIdeas": ["Open-tuned acoustic guitar", "Soft upright bass", "Subtle felt piano accents"],
  "thematicSummary": "A bittersweet recollection of a past romance framed through the changing seasons in a quiet coastal town."
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    let parsed = {};
    try {
      parsed = JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : {};
    }

    res.json({ success: true, metadata: parsed });
  } catch (error: any) {
    console.error('Error generating metadata tags:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate metadata tags',
    });
  }
});

// ============================================================================
// 5. VOICE-TO-LYRIC REFINEMENT (gemini-3.5-transcribe + AI Polishing Layer)
// ============================================================================
app.post('/api/ai/transcribe-voice', async (req, res) => {
  try {
    const {
      audioBase64,
      mimeType = 'audio/webm',
      songContext = {},
    } = req.body;

    if (!audioBase64) {
      return res.status(400).json({
        success: false,
        error: 'audioBase64 data is required for transcription',
      });
    }

    const ai = getGenAI();

    // Stage 1: Audio Transcription with gemini-3.5-transcribe
    const cleanBase64 = audioBase64.replace(/^data:audio\/[a-z0-9]+;base64,/, '');

    const transcribeResponse = await ai.models.generateContent({
      model: 'gemini-3.5-transcribe',
      contents: [
        {
          parts: [
            {
              inlineData: {
                mimeType: mimeType || 'audio/webm',
                data: cleanBase64,
              },
            },
            {
              text: 'Transcribe this spoken or sung songwriting memo accurately word for word. Output only the verbatim transcript of the words heard.',
            },
          ],
        },
      ],
    });

    const rawTranscript = transcribeResponse.text?.trim() || '';

    if (!rawTranscript) {
      return res.json({
        success: true,
        rawTranscript: '(No audible words detected in recording)',
        polishedLyrics: '',
        detectedStructure: [],
        syllableMeterNotes: 'Audio was too quiet or contained only instrumental melody.',
      });
    }

    // Stage 2: AI Polishing & Song Lyric Structuring Layer with gemini-3.8-flash
    const polishPrompt = `You are a master songwriting collaborator.
A songwriter just recorded an audio voice memo with raw melody ideas and spontaneous stream-of-consciousness words.
Here is the verbatim transcript:
"""
${rawTranscript}
"""

Context:
Song Title: "${songContext.title || 'Untitled'}"
Genre: ${songContext.genre || 'Singer-Songwriter'}
Key: ${songContext.key || 'C'}
Tempo: ${songContext.tempo || 120} BPM

Task:
1. Polish the raw transcription into professionally structured song lyrics.
2. Organize into standard section labels (e.g. [Verse 1], [Chorus], [Verse 2], [Bridge], [Outro]).
3. Fix stumbled words or false starts while strictly honoring the songwriter's original creative intent and imagery.
4. Align line breaks for natural breathing and metric cadence.
5. Optionally place bracketed chords (e.g. [C], [G], [Am], [F]) over key anchor syllables where chords naturally change.

Return ONLY a valid JSON object:
{
  "rawTranscript": "${rawTranscript.replace(/"/g, '\\"')}",
  "polishedLyrics": "Full structured lyrics with [Verse], [Chorus] headings and poetic line breaks...",
  "detectedStructure": ["Verse 1", "Chorus"],
  "syllableMeterNotes": "Summary of line lengths and rhythmic meter established in the voice memo",
  "suggestedChordsHint": ["C", "G", "Am", "F"]
}`;

    const polishResponse = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: polishPrompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = polishResponse.text || '{}';
    let parsed: any = {};
    try {
      parsed = JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : {};
    }

    res.json({
      success: true,
      rawTranscript: parsed.rawTranscript || rawTranscript,
      polishedLyrics: parsed.polishedLyrics || rawTranscript,
      detectedStructure: parsed.detectedStructure || ['Idea'],
      syllableMeterNotes: parsed.syllableMeterNotes || 'Formatted with natural rhythmic phrasing.',
      suggestedChordsHint: parsed.suggestedChordsHint || [],
    });
  } catch (error: any) {
    console.error('Error transcribing and polishing audio:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to transcribe and polish audio memo',
    });
  }
});

// ============================================================================
// 6. MUSIC GENERATION (lyria-3-clip-preview / lyria-3-pro-preview)
// ============================================================================
app.post('/api/ai/generate-music', async (req, res) => {
  try {
    const {
      prompt = '',
      duration = 'clip', // 'clip' (30s) or 'pro' (full track)
      genre = 'acoustic',
      mood = 'uplifting',
    } = req.body;

    const ai = getGenAI();
    const model = duration === 'pro' ? 'lyria-3-pro-preview' : 'lyria-3-clip-preview';
    const finalPrompt = prompt || `Create an evocative ${mood} ${genre} acoustic instrumental track with rich harmony.`;

    const stream = await ai.models.generateContentStream({
      model,
      contents: finalPrompt,
    });

    let audioBase64 = '';
    let lyrics = '';
    let mimeType = 'audio/wav';

    for await (const chunk of stream) {
      const parts = chunk.candidates?.[0]?.content?.parts;
      if (!parts) continue;
      for (const part of parts) {
        if (part.inlineData?.data) {
          if (!audioBase64 && part.inlineData.mimeType) {
            mimeType = part.inlineData.mimeType;
          }
          audioBase64 += part.inlineData.data;
        }
        if (part.text && !lyrics) {
          lyrics = part.text;
        }
      }
    }

    res.json({
      success: true,
      audioBase64,
      mimeType,
      lyrics,
    });
  } catch (error: any) {
    console.error('Error generating music:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate music audio',
    });
  }
});

// ============================================================================
// 7. VIDEO GENERATION (veo-3.1-fast-generate-preview)
// ============================================================================
app.post('/api/ai/generate-video', async (req, res) => {
  try {
    const {
      prompt = 'Cinematic music video scene matching acoustic guitar song',
      aspectRatio = '16:9',
      imageBase64 = null,
      mimeType = 'image/jpeg',
    } = req.body;

    const ai = getGenAI();
    
    let input = [];
    if (imageBase64) {
      const cleanData = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
      input.push({
        type: 'image',
        mimeType: mimeType || 'image/jpeg',
        data: cleanData
      });
    }
    input.push({
      type: 'text',
      text: prompt
    });

    const interaction = await ai.interactions.create({
      model: 'gemini-omni-1.1-flash',
      input,
      background: true,
      store: false,
      response_format: {
        type: 'video',
        aspect_ratio: aspectRatio === '9:16' ? '9:16' : '16:9',
      }
    });

    res.json({
      success: true,
      operationName: interaction.id,
    });
  } catch (error: any) {
    console.error('Error initiating video generation:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate video',
    });
  }
});

app.post('/api/ai/video-status', async (req, res) => {
  try {
    const { operationName: interactionId } = req.body;
    if (!interactionId) {
      return res.status(400).json({ error: 'operationName required' });
    }

    const ai = getGenAI();
    const interaction = await ai.interactions.get(interactionId);

    const done = ['completed', 'failed', 'cancelled'].includes(interaction.status);

    res.json({
      done,
      error: (interaction.status === 'failed' || interaction.status === 'cancelled') ? `Video generation ${interaction.status}` : null,
    });
  } catch (error: any) {
    console.error('Error polling video operation:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/ai/video-download', async (req, res) => {
  try {
    const { operationName: interactionId } = req.body;
    const ai = getGenAI();
    const interaction = await ai.interactions.get(interactionId);

    if (interaction.status !== 'completed') {
      return res.status(400).json({ error: 'Video is not ready yet.' });
    }

    const videoPart = interaction.output_video;
    if (!videoPart || !videoPart.data) {
      return res.status(404).json({ error: 'Video data not available' });
    }

    const videoBuffer = Buffer.from(videoPart.data, 'base64');
    res.setHeader('Content-Type', videoPart.mime_type || 'video/mp4');
    res.setHeader('Content-Length', videoBuffer.length);
    res.send(videoBuffer);
  } catch (error: any) {
    console.error('Error downloading video:', error);
    res.status(500).json({ error: error.message || 'Failed to download video' });
  }
});
    const uri = updated.response?.generatedVideos?.[0]?.video?.uri;

    if (!uri) {
      return res.status(404).json({ error: 'Video URI not available' });
    }

    const videoRes = await fetch(uri, {
      headers: { 'x-goog-api-key': apiKey },
    });

    res.setHeader('Content-Type', 'video/mp4');
    if (videoRes.body) {
      const arrayBuffer = await videoRes.arrayBuffer();
      res.send(Buffer.from(arrayBuffer));
    } else {
      res.status(500).json({ error: 'Failed to download video stream' });
    }
  } catch (error: any) {
    console.error('Error downloading video:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// VITE MIDDLEWARE & SERVER STARTUP
// ============================================================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LyricFlow Pro Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
