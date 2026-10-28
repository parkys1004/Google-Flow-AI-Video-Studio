import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));

// Shared GoogleGenAI Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// 1. Generate Storyboard & Script Flow
app.post('/api/generate-storyboard', async (req, res) => {
  try {
    const {
      topic,
      aspectRatio = '16:9',
      style = 'Cinematic 3D Animation',
      tone = 'Inspiring & Engaging',
      sceneCount = 4,
      targetLanguage = 'ko',
      voiceName = 'Kore',
    } = req.body;

    if (!topic || typeof topic !== 'string' || !topic.trim()) {
      return res.status(400).json({ error: '주제 또는 내용을 입력해주세요.' });
    }

    const systemInstruction = `
You are an award-winning creative video producer, director, and prompt engineer specializing in Google Flow, Google Veo, and cinematic video storytelling.
Your task is to take a user's topic or rough ideas, and produce a complete, polished, multi-scene video production blueprint.

Key Requirements:
1. Target aspect ratio: ${aspectRatio} (${aspectRatio === '9:16' ? 'Vertical Video for Shorts/Reels/TikTok' : aspectRatio === '1:1' ? 'Square Video' : 'Widescreen 16:9 Cinematic Video'}).
2. Target tone: ${tone}.
3. Visual Art Style: ${style}.
4. Target language for narration and titles: ${targetLanguage === 'ko' ? 'Korean (자연스럽고 몰입도 높은 대본)' : 'English'}.
5. Exactly ${sceneCount} coherent, sequential narrative scenes that form a captivating complete story (Hook -> Introduction -> Core Climax/Value -> Conclusion/Call-to-Action).
6. Each scene MUST have:
   - sceneNumber (1 to ${sceneCount})
   - title: Short, punchy scene headline
   - narration: Natural, spoken voiceover script (around 20-40 words, approx 5-8 seconds of speech).
   - estimatedDurationSec: 5 to 8
   - visualDescription: Precise description of what is on screen
   - imagePrompt: Rich, highly descriptive English visual prompt for generating the keyframe illustration/photograph. Include lighting, lens type, mood, color palette, atmosphere, and the chosen style '${style}'. DO NOT use text in the image.
   - veoPrompt: An industry-standard Google Veo video generation prompt. Format: "[Camera: <movement>] <scene description>, cinematic lighting, 8k resolution, photorealistic motion, hyper-detailed, seamless movement, no subtitles in video".
   - cameraMovement: One of ["Zoom In", "Zoom Out", "Pan Left", "Pan Right", "Dolly In", "Aerial Drone", "Tilt Up", "Orbit"]
   - transitionType: One of ["fade", "dissolve", "slide-left", "zoom"]
   - subtitleKeywords: 2-3 prominent punchy words from narration to visually highlight in bold neon colors on screen
   - sfxCue: Atmospheric sound cue (e.g., "gentle breeze with wind chimes", "digital whoosh transition", "deep bass drop")

Return ONLY strict valid JSON conforming to the requested schema.
`;

    const userPrompt = `
Topic / Source Content:
"""${topic.trim()}"""

Selected Video Options:
- Aspect Ratio: ${aspectRatio}
- Visual Style: ${style}
- Tone: ${tone}
- Number of Scenes: ${sceneCount}
- Voice Actor: ${voiceName}

Generate a breathtaking video production flow with full scripts, prompts, and scene directions.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: userPrompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: 'Catchy video title' },
            summary: { type: Type.STRING, description: 'One-line logline summary' },
            visualStyle: { type: Type.STRING, description: 'Visual style descriptor' },
            targetAudience: { type: Type.STRING, description: 'Target audience' },
            bgmPrompt: { type: Type.STRING, description: 'Soundtrack description (mood, tempo, instruments)' },
            scenes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING, description: 'Unique scene ID' },
                  sceneNumber: { type: Type.INTEGER, description: 'Scene index 1..N' },
                  title: { type: Type.STRING, description: 'Scene title' },
                  narration: { type: Type.STRING, description: 'Voiceover narration script' },
                  estimatedDurationSec: { type: Type.INTEGER, description: 'Duration in seconds' },
                  visualDescription: { type: Type.STRING, description: 'Visual description' },
                  imagePrompt: { type: Type.STRING, description: 'Detailed English prompt for image generation' },
                  veoPrompt: { type: Type.STRING, description: 'Detailed Google Veo video generation prompt' },
                  cameraMovement: { type: Type.STRING, description: 'Camera motion' },
                  transitionType: { type: Type.STRING, description: 'Transition effect' },
                  subtitleKeywords: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: 'Keywords to highlight in subtitles',
                  },
                  sfxCue: { type: Type.STRING, description: 'Sound effect cue' },
                },
                required: [
                  'sceneNumber',
                  'title',
                  'narration',
                  'estimatedDurationSec',
                  'visualDescription',
                  'imagePrompt',
                  'veoPrompt',
                  'cameraMovement',
                  'transitionType',
                  'subtitleKeywords',
                  'sfxCue',
                ],
              },
            },
          },
          required: ['title', 'summary', 'visualStyle', 'scenes', 'bgmPrompt'],
        },
      },
    });

    const text = response.text || '{}';
    const parsedData = JSON.parse(text);

    // Ensure IDs are present
    if (Array.isArray(parsedData.scenes)) {
      parsedData.scenes = parsedData.scenes.map((scene: any, idx: number) => ({
        ...scene,
        id: scene.id || `scene-${idx + 1}-${Date.now().toString(36)}`,
        sceneNumber: idx + 1,
      }));
    }

    res.json({ success: true, storyboard: parsedData });
  } catch (error: any) {
    console.error('Error generating storyboard:', error);
    res.status(500).json({
      error: error.message || '대본 및 스토리보드 생성 중 오류가 발생했습니다.',
    });
  }
});

// 2. Generate Keyframe Image
app.post('/api/generate-image', async (req, res) => {
  try {
    const { prompt, aspectRatio = '16:9' } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: '이미지 프롬프트가 필요합니다.' });
    }

    // Supported aspect ratios for gemini-3.1-flash-lite-image: "1:1", "3:4", "4:3", "9:16", "16:9"
    const validRatio = ['1:1', '3:4', '4:3', '9:16', '16:9'].includes(aspectRatio)
      ? aspectRatio
      : '16:9';

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-image',
      contents: {
        parts: [
          {
            text: `${prompt}, ultra high quality, masterpiece, 8k resolution, cinematic lighting, vivid colors, no text, no watermark`,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: validRatio,
        },
      },
    });

    let imageUrl = '';
    const parts = response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData && part.inlineData.data) {
        const mime = part.inlineData.mimeType || 'image/png';
        imageUrl = `data:${mime};base64,${part.inlineData.data}`;
        break;
      }
    }

    if (!imageUrl) {
      return res.status(500).json({ error: '이미지 데이터를 수신하지 못했습니다.' });
    }

    res.json({ success: true, imageUrl });
  } catch (error: any) {
    console.error('Error generating image:', error);
    res.status(500).json({
      error: error.message || '이미지 생성에 실패했습니다.',
    });
  }
});

// 3. Generate Scene Voiceover TTS
app.post('/api/generate-tts', async (req, res) => {
  try {
    const { text, voice = 'Kore' } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: '내레이션 텍스트가 필요합니다.' });
    }

    const validVoice = ['Kore', 'Puck', 'Fenrir', 'Zephyr', 'Charon'].includes(voice)
      ? voice
      : 'Kore';

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: text.trim(),
              speechMetadata: {
                style: 'Natural, engaging documentary storyteller and confident narrator',
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: validVoice },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
      return res.status(500).json({ error: '음성 데이터를 수신하지 못했습니다.' });
    }

    const audioUrl = `data:audio/wav;base64,${base64Audio}`;
    res.json({ success: true, audioUrl });
  } catch (error: any) {
    console.error('Error generating TTS:', error);
    res.status(500).json({
      error: error.message || '음성 생성 중 오류가 발생했습니다.',
    });
  }
});

// 4. Generate Google Veo / Omni Flash Video (Optional single clip synthesis)
app.post('/api/generate-omni-video', async (req, res) => {
  try {
    const { prompt, aspectRatio = '16:9', duration = '5s' } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: '비디오 프롬프트가 필요합니다.' });
    }

    const interaction = await ai.interactions.create(
      {
        model: 'gemini-omni-1.1-flash',
        input: prompt,
        background: false,
        store: false,
        stream: false,
        response_format: {
          type: 'video',
          aspect_ratio: aspectRatio === '9:16' ? '9:16' : '16:9',
          duration: duration === '10s' ? '10s' : '5s',
          resolution: '720p',
        },
      },
      { timeout: 300000 }
    );

    const videoPart = interaction.output_video;
    if (videoPart && videoPart.data) {
      const mime = videoPart.mime_type || 'video/mp4';
      const videoUrl = `data:${mime};base64,${videoPart.data}`;
      return res.json({ success: true, videoUrl });
    }

    return res.status(500).json({ error: '비디오 생성 출력을 찾을 수 없습니다.' });
  } catch (error: any) {
    console.error('Error generating omni video:', error);
    res.status(500).json({
      error: error.message || 'Veo 비디오 클립 생성 중 오류가 발생했습니다.',
    });
  }
});

// Setup Vite or static serving
async function setupServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: PORT,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Google Flow Video Studio Server listening on http://0.0.0.0:${PORT}`);
  });
}

setupServer();
