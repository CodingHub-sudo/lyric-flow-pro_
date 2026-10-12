const fs = require('fs');
const content = fs.readFileSync('server.ts', 'utf8');

// Find the index of app.post('/api/ai/generate-video'
const startIndex = content.indexOf(`app.post('/api/ai/generate-video'`);

// Find the start of the next section // =====================
const endIndex = content.indexOf('// ============================================================================', startIndex);

const part1 = content.substring(0, startIndex);
const part2 = content.substring(endIndex);

const newLogic = `
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
      const cleanData = imageBase64.replace(/^data:image\\/[a-z]+;base64,/, '');
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
      error: (interaction.status === 'failed' || interaction.status === 'cancelled') ? \`Video generation \${interaction.status}\` : null,
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
    if (!videoPart || (!videoPart.data && !videoPart.uri)) {
      return res.status(404).json({ error: 'Video data not available' });
    }

    if (videoPart.data) {
      const videoBuffer = Buffer.from(videoPart.data, 'base64');
      res.setHeader('Content-Type', videoPart.mime_type || 'video/mp4');
      res.setHeader('Content-Length', videoBuffer.length);
      res.send(videoBuffer);
    } else if (videoPart.uri) {
      // Fallback if returned as URI
      const videoRes = await fetch(videoPart.uri);
      const arrayBuffer = await videoRes.arrayBuffer();
      res.setHeader('Content-Type', 'video/mp4');
      res.send(Buffer.from(arrayBuffer));
    }
  } catch (error: any) {
    console.error('Error downloading video:', error);
    res.status(500).json({ error: error.message || 'Failed to download video' });
  }
});

`;

fs.writeFileSync('server.ts', part1 + newLogic + part2);
