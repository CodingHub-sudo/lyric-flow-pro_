const fs = require('fs');

const content = fs.readFileSync('server.ts', 'utf8');

const regex = /app\.post\('\/api\/ai\/generate-video'[\s\S]*?app\.post\('\/api\/ai\/video-download'[\s\S]*?\}\);/m;

const replacement = `
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
`;

const updated = content.replace(regex, replacement.trim());
fs.writeFileSync('server.ts', updated, 'utf8');
console.log('Video logic replaced.');
