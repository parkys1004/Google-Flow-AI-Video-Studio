/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Header } from './components/Header';
import { FlowStepper } from './components/FlowStepper';
import { ProjectInputForm } from './components/ProjectInputForm';
import { StoryboardView } from './components/StoryboardView';
import { VideoCanvasPlayer } from './components/VideoCanvasPlayer';
import { VeoExportModal } from './components/VeoExportModal';
import { StoryboardProject, StoryboardScene, StudioTab, AspectRatio } from './types/videoStudio';
import { SAMPLE_PROJECTS } from './utils/defaultPresets';
import { generatePlaceholderImage } from './utils/placeholderImage';

export default function App() {
  const [project, setProject] = useState<StoryboardProject>(SAMPLE_PROJECTS[0]);
  const [currentTab, setCurrentTab] = useState<StudioTab>('storyboard');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [bulkMessage, setBulkMessage] = useState('');
  const [targetSceneIndex, setTargetSceneIndex] = useState(0);

  // 1. Generate new Storyboard & Script Flow
  const handleGenerateStoryboard = async ({
    topic,
    aspectRatio,
    style,
    tone,
    sceneCount,
    targetLanguage,
    voiceName,
    autoGenerateAssets,
  }: {
    topic: string;
    aspectRatio: AspectRatio;
    style: string;
    tone: string;
    sceneCount: number;
    targetLanguage: string;
    voiceName: string;
    autoGenerateAssets: boolean;
  }) => {
    try {
      setIsLoading(true);
      setStatusMessage('Gemini가 영상 대본과 씬별 스토리보드를 기획 중입니다...');

      const response = await fetch('/api/generate-storyboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          aspectRatio,
          style,
          tone,
          sceneCount,
          targetLanguage,
          voiceName,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || '스토리보드 생성 실패');
      }

      const generatedStoryboard = data.storyboard;

      // Assign initial procedural images so scenes have immediate posters
      const scenesWithImages: StoryboardScene[] = generatedStoryboard.scenes.map(
        (scene: StoryboardScene, idx: number) => ({
          ...scene,
          imageUrl:
            scene.imageUrl ||
            generatePlaceholderImage(scene.title, idx + 1, style, aspectRatio),
        })
      );

      const newProject: StoryboardProject = {
        id: `proj-${Date.now().toString(36)}`,
        title: generatedStoryboard.title || topic,
        summary: generatedStoryboard.summary || '',
        visualStyle: style,
        targetAudience: generatedStoryboard.targetAudience || '모든 시청자',
        bgmPrompt: generatedStoryboard.bgmPrompt || '',
        aspectRatio,
        tone,
        voiceName,
        createdAt: Date.now(),
        scenes: scenesWithImages,
      };

      setProject(newProject);
      setCurrentTab('storyboard');
      setIsLoading(false);
      setStatusMessage('');

      // Auto-generate Images & TTS if requested
      if (autoGenerateAssets) {
        triggerAssetGeneration(newProject);
      }
    } catch (error: any) {
      console.error('Storyboard generation error:', error);
      setIsLoading(false);
      setStatusMessage('');
      alert(`오류: ${error.message || '스토리보드 생성 중 문제가 발생했습니다.'}`);
    }
  };

  // 2. Sequential asset generation for all scenes
  const triggerAssetGeneration = async (proj: StoryboardProject) => {
    setIsBulkProcessing(true);
    let currentScenes = [...proj.scenes];

    // Generate images sequentially
    for (let i = 0; i < currentScenes.length; i++) {
      const scene = currentScenes[i];
      setBulkMessage(`[${i + 1}/${currentScenes.length}] AI 키프레임 이미지 생성 중: "${scene.title}"`);

      try {
        const imgRes = await fetch('/api/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: scene.imagePrompt,
            aspectRatio: proj.aspectRatio,
          }),
        });

        const imgData = await imgRes.json();
        if (imgRes.ok && imgData.imageUrl) {
          currentScenes = currentScenes.map((s, idx) =>
            idx === i ? { ...s, imageUrl: imgData.imageUrl } : s
          );
          setProject((prev) => ({ ...prev, scenes: currentScenes }));
        }
      } catch (err) {
        console.warn(`Image generation failed for scene ${i + 1}:`, err);
      }
    }

    // Generate TTS audios sequentially
    for (let i = 0; i < currentScenes.length; i++) {
      const scene = currentScenes[i];
      setBulkMessage(`[${i + 1}/${currentScenes.length}] Gemini TTS 내레이션 합성 중: "${scene.title}"`);

      try {
        const audioRes = await fetch('/api/generate-tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: scene.narration,
            voice: proj.voiceName || 'Kore',
          }),
        });

        const audioData = await audioRes.json();
        if (audioRes.ok && audioData.audioUrl) {
          currentScenes = currentScenes.map((s, idx) =>
            idx === i ? { ...s, audioUrl: audioData.audioUrl } : s
          );
          setProject((prev) => ({ ...prev, scenes: currentScenes }));
        }
      } catch (err) {
        console.warn(`TTS generation failed for scene ${i + 1}:`, err);
      }
    }

    setIsBulkProcessing(false);
    setBulkMessage('');
  };

  // 3. Single scene image generation
  const handleGenerateSingleImage = async (sceneId: string) => {
    const scene = project.scenes.find((s) => s.id === sceneId);
    if (!scene) return;

    setProject((prev) => ({
      ...prev,
      scenes: prev.scenes.map((s) => (s.id === sceneId ? { ...s, isGeneratingImage: true } : s)),
    }));

    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: scene.imagePrompt,
          aspectRatio: project.aspectRatio,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.imageUrl) {
        throw new Error(data.error || '이미지 생성 실패');
      }

      setProject((prev) => ({
        ...prev,
        scenes: prev.scenes.map((s) =>
          s.id === sceneId ? { ...s, imageUrl: data.imageUrl, isGeneratingImage: false } : s
        ),
      }));
    } catch (err: any) {
      console.error('Image gen error:', err);
      alert(`이미지 생성 오류: ${err.message || '다시 시도해주세요.'}`);
      setProject((prev) => ({
        ...prev,
        scenes: prev.scenes.map((s) => (s.id === sceneId ? { ...s, isGeneratingImage: false } : s)),
      }));
    }
  };

  // 4. Single scene audio generation
  const handleGenerateSingleAudio = async (sceneId: string) => {
    const scene = project.scenes.find((s) => s.id === sceneId);
    if (!scene) return;

    setProject((prev) => ({
      ...prev,
      scenes: prev.scenes.map((s) => (s.id === sceneId ? { ...s, isGeneratingAudio: true } : s)),
    }));

    try {
      const res = await fetch('/api/generate-tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: scene.narration,
          voice: project.voiceName || 'Kore',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.audioUrl) {
        throw new Error(data.error || 'TTS 생성 실패');
      }

      setProject((prev) => ({
        ...prev,
        scenes: prev.scenes.map((s) =>
          s.id === sceneId ? { ...s, audioUrl: data.audioUrl, isGeneratingAudio: false } : s
        ),
      }));
    } catch (err: any) {
      console.error('TTS gen error:', err);
      alert(`TTS 생성 오류: ${err.message || '다시 시도해주세요.'}`);
      setProject((prev) => ({
        ...prev,
        scenes: prev.scenes.map((s) => (s.id === sceneId ? { ...s, isGeneratingAudio: false } : s)),
      }));
    }
  };

  // 5. Single scene Veo video clip generation
  const handleGenerateSingleVeo = async (sceneId: string) => {
    const scene = project.scenes.find((s) => s.id === sceneId);
    if (!scene) return;

    setProject((prev) => ({
      ...prev,
      scenes: prev.scenes.map((s) => (s.id === sceneId ? { ...s, isGeneratingVideo: true } : s)),
    }));

    try {
      const res = await fetch('/api/generate-omni-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: scene.veoPrompt,
          aspectRatio: project.aspectRatio,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.videoUrl) {
        throw new Error(data.error || 'Veo 비디오 생성 실패');
      }

      setProject((prev) => ({
        ...prev,
        scenes: prev.scenes.map((s) =>
          s.id === sceneId ? { ...s, videoUrl: data.videoUrl, isGeneratingVideo: false } : s
        ),
      }));
    } catch (err: any) {
      console.error('Veo video gen error:', err);
      alert(`Veo 비디오 클립 생성: ${err.message || '프롬프트 복사 후 Veo 스튜디오에서 사용 가능합니다.'}`);
      setProject((prev) => ({
        ...prev,
        scenes: prev.scenes.map((s) => (s.id === sceneId ? { ...s, isGeneratingVideo: false } : s)),
      }));
    }
  };

  // 6. Bulk Image Generation
  const handleGenerateAllImages = async () => {
    setIsBulkProcessing(true);
    let currentScenes = [...project.scenes];

    for (let i = 0; i < currentScenes.length; i++) {
      const scene = currentScenes[i];
      setBulkMessage(`[${i + 1}/${currentScenes.length}] AI 이미지 생성 중: "${scene.title}"`);

      try {
        const res = await fetch('/api/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: scene.imagePrompt,
            aspectRatio: project.aspectRatio,
          }),
        });
        const data = await res.json();
        if (res.ok && data.imageUrl) {
          currentScenes = currentScenes.map((s, idx) =>
            idx === i ? { ...s, imageUrl: data.imageUrl } : s
          );
          setProject((prev) => ({ ...prev, scenes: currentScenes }));
        }
      } catch (e) {
        console.warn(`Failed image ${i}:`, e);
      }
    }

    setIsBulkProcessing(false);
    setBulkMessage('');
  };

  // 7. Bulk Audio Generation
  const handleGenerateAllAudios = async () => {
    setIsBulkProcessing(true);
    let currentScenes = [...project.scenes];

    for (let i = 0; i < currentScenes.length; i++) {
      const scene = currentScenes[i];
      setBulkMessage(`[${i + 1}/${currentScenes.length}] Gemini TTS 생성 중: "${scene.title}"`);

      try {
        const res = await fetch('/api/generate-tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: scene.narration,
            voice: project.voiceName || 'Kore',
          }),
        });
        const data = await res.json();
        if (res.ok && data.audioUrl) {
          currentScenes = currentScenes.map((s, idx) =>
            idx === i ? { ...s, audioUrl: data.audioUrl } : s
          );
          setProject((prev) => ({ ...prev, scenes: currentScenes }));
        }
      } catch (e) {
        console.warn(`Failed TTS ${i}:`, e);
      }
    }

    setIsBulkProcessing(false);
    setBulkMessage('');
  };

  const handleNavigateToPlayer = (sceneIdx: number = 0) => {
    setTargetSceneIndex(sceneIdx);
    setCurrentTab('player');
  };

  const handleNewProject = () => {
    setCurrentTab('input');
  };

  const handleLoadPreset = (preset: StoryboardProject) => {
    setProject(preset);
    setCurrentTab('storyboard');
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* App Header */}
      <Header
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        project={project}
        onLoadPreset={handleLoadPreset}
        onNewProject={handleNewProject}
      />

      {/* Google Flow Pipeline Stepper */}
      <FlowStepper
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        project={project}
      />

      {/* Main Content Body */}
      <main className="flex-1 pb-16">
        {currentTab === 'input' && (
          <ProjectInputForm
            onGenerate={handleGenerateStoryboard}
            isLoading={isLoading}
            statusMessage={statusMessage}
          />
        )}

        {currentTab === 'storyboard' && (
          <StoryboardView
            project={project}
            onUpdateProject={setProject}
            onGenerateAllImages={handleGenerateAllImages}
            onGenerateAllAudios={handleGenerateAllAudios}
            onGenerateSingleImage={handleGenerateSingleImage}
            onGenerateSingleAudio={handleGenerateSingleAudio}
            onGenerateSingleVeo={handleGenerateSingleVeo}
            onNavigateToPlayer={handleNavigateToPlayer}
            isBulkProcessing={isBulkProcessing}
            bulkMessage={bulkMessage}
          />
        )}

        {currentTab === 'player' && (
          <VideoCanvasPlayer
            project={project}
            initialSceneIndex={targetSceneIndex}
            onNavigateToTab={setCurrentTab}
          />
        )}

        {currentTab === 'veo-export' && (
          <VeoExportModal project={project} onNavigateToTab={setCurrentTab} />
        )}
      </main>
    </div>
  );
}
