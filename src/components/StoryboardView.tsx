import React from 'react';
import { StoryboardProject, StoryboardScene } from '../types/videoStudio';
import { SceneEditorCard } from './SceneEditorCard';
import {
  Sparkles,
  Layers,
  Play,
  Plus,
  RefreshCw,
  Volume2,
  Image as ImageIcon,
  CheckCircle2,
} from 'lucide-react';
import { generatePlaceholderImage } from '../utils/placeholderImage';

interface StoryboardViewProps {
  project: StoryboardProject;
  onUpdateProject: (project: StoryboardProject) => void;
  onGenerateAllImages: () => Promise<void>;
  onGenerateAllAudios: () => Promise<void>;
  onGenerateSingleImage: (sceneId: string) => Promise<void>;
  onGenerateSingleAudio: (sceneId: string) => Promise<void>;
  onGenerateSingleVeo: (sceneId: string) => Promise<void>;
  onNavigateToPlayer: (sceneIndex?: number) => void;
  isBulkProcessing: boolean;
  bulkMessage?: string;
}

export const StoryboardView: React.FC<StoryboardViewProps> = ({
  project,
  onUpdateProject,
  onGenerateAllImages,
  onGenerateAllAudios,
  onGenerateSingleImage,
  onGenerateSingleAudio,
  onGenerateSingleVeo,
  onNavigateToPlayer,
  isBulkProcessing,
  bulkMessage,
}) => {
  const scenes = project.scenes;

  const handleUpdateScene = (updatedScene: StoryboardScene) => {
    const updatedScenes = scenes.map((s) => (s.id === updatedScene.id ? updatedScene : s));
    onUpdateProject({ ...project, scenes: updatedScenes });
  };

  const handleAddScene = () => {
    const nextNum = scenes.length + 1;
    const newScene: StoryboardScene = {
      id: `scene-${nextNum}-${Date.now().toString(36)}`,
      sceneNumber: nextNum,
      title: `씬 ${nextNum}: 새로운 장면`,
      narration: '새로운 씬의 흥미진진한 내레이션을 작성해보세요.',
      estimatedDurationSec: 5,
      visualDescription: '추가된 씬의 비주얼 배경 설명',
      imagePrompt: `Cinematic scene ${nextNum}, ${project.visualStyle}, detailed atmosphere, 8k resolution`,
      veoPrompt: `[Camera: Slow Dolly In] Cinematic scene, ${project.visualStyle}, photorealistic movement, 8k`,
      cameraMovement: 'Zoom In',
      transitionType: 'dissolve',
      subtitleKeywords: ['새로운장면'],
      sfxCue: '배경 효과음',
      imageUrl: generatePlaceholderImage(`씬 ${nextNum}`, nextNum, project.visualStyle, project.aspectRatio),
    };
    onUpdateProject({ ...project, scenes: [...scenes, newScene] });
  };

  const totalDuration = scenes.reduce((acc, s) => acc + (s.estimatedDurationSec || 5), 0);
  const imagesDone = scenes.filter((s) => s.imageUrl).length;
  const audiosDone = scenes.filter((s) => s.audioUrl).length;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Overview Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 mb-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-semibold">
                Google Flow Storyboard
              </span>
              <span className="text-xs text-slate-400">총 {scenes.length}개 씬 (~{totalDuration}초)</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">{project.title}</h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">{project.summary}</p>
          </div>

          {/* Bulk Generation & Player Trigger */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onGenerateAllImages}
              disabled={isBulkProcessing}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
            >
              <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
              <span>전체 이미지 일괄 생성 ({imagesDone}/{scenes.length})</span>
            </button>

            <button
              onClick={onGenerateAllAudios}
              disabled={isBulkProcessing}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
            >
              <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>전체 TTS 일괄 생성 ({audiosDone}/{scenes.length})</span>
            </button>

            <button
              onClick={() => onNavigateToPlayer(0)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 transition shadow-md shadow-indigo-600/30 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>스튜디오 플레이어 열기</span>
            </button>
          </div>
        </div>

        {/* Bulk progress indicator if processing */}
        {isBulkProcessing && (
          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center gap-3">
            <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-medium text-indigo-300">
              {bulkMessage || '에셋을 순차적으로 생성 중입니다...'}
            </span>
          </div>
        )}
      </div>

      {/* Scene Cards List */}
      <div className="space-y-5">
        {scenes.map((scene, idx) => (
          <SceneEditorCard
            key={scene.id || idx}
            scene={scene}
            aspectRatio={project.aspectRatio}
            onUpdateScene={handleUpdateScene}
            onGenerateImage={onGenerateSingleImage}
            onGenerateAudio={onGenerateSingleAudio}
            onGenerateVeoClip={onGenerateSingleVeo}
            onPreviewScene={onNavigateToPlayer}
          />
        ))}
      </div>

      {/* Add Scene Button */}
      <div className="mt-6 flex justify-center">
        <button
          onClick={handleAddScene}
          className="flex items-center gap-2 px-5 py-3 rounded-xl border border-dashed border-slate-700 hover:border-indigo-500/80 bg-slate-900/50 hover:bg-slate-800/80 text-xs font-semibold text-slate-300 transition cursor-pointer"
        >
          <Plus className="w-4 h-4 text-indigo-400" />
          <span>+ 새로운 씬(Scene) 추가하기</span>
        </button>
      </div>
    </div>
  );
};
