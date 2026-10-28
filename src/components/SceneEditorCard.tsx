import React, { useState, useRef } from 'react';
import {
  StoryboardScene,
  AspectRatio,
  CameraMovement,
  TransitionType,
} from '../types/videoStudio';
import {
  Image as ImageIcon,
  Volume2,
  RefreshCw,
  Copy,
  Check,
  Upload,
  Play,
  Square,
  Video,
  Clapperboard,
  Eye,
  Sliders,
  ChevronDown,
} from 'lucide-react';
import { studioAudioEngine } from '../utils/audioEngine';

interface SceneEditorCardProps {
  scene: StoryboardScene;
  aspectRatio: AspectRatio;
  onUpdateScene: (updated: StoryboardScene) => void;
  onGenerateImage: (sceneId: string) => Promise<void>;
  onGenerateAudio: (sceneId: string) => Promise<void>;
  onGenerateVeoClip: (sceneId: string) => Promise<void>;
  onPreviewScene: (sceneIndex: number) => void;
}

export const SceneEditorCard: React.FC<SceneEditorCardProps> = ({
  scene,
  aspectRatio,
  onUpdateScene,
  onGenerateImage,
  onGenerateAudio,
  onGenerateVeoClip,
  onPreviewScene,
}) => {
  const [copied, setCopied] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(scene.veoPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePlayVoice = async () => {
    if (isPlayingAudio) {
      studioAudioEngine.stopVoice();
      setIsPlayingAudio(false);
      return;
    }

    setIsPlayingAudio(true);
    if (scene.audioUrl) {
      await studioAudioEngine.playVoiceAudio(scene.audioUrl);
    } else {
      await studioAudioEngine.speakFallback(scene.narration, 'ko-KR');
    }
    setIsPlayingAudio(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const result = uploadEvent.target?.result as string;
        if (result) {
          onUpdateScene({ ...scene, imageUrl: result });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const cameraOptions: CameraMovement[] = [
    'Zoom In',
    'Zoom Out',
    'Pan Left',
    'Pan Right',
    'Dolly In',
    'Aerial Drone',
    'Tilt Up',
    'Orbit',
  ];

  const transitionOptions: TransitionType[] = ['fade', 'dissolve', 'slide-left', 'zoom'];

  // Calculate container aspect ratio class
  const aspectClass =
    aspectRatio === '9:16'
      ? 'aspect-[9/16] max-h-[360px]'
      : aspectRatio === '1:1'
      ? 'aspect-square max-h-[300px]'
      : 'aspect-[16/9] max-h-[240px]';

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-lg transition hover:border-slate-700/80">
      {/* Top Bar */}
      <div className="bg-slate-950/80 px-4 py-3 border-b border-slate-800/80 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold tracking-wider uppercase">
            Scene {scene.sceneNumber}
          </span>
          <input
            type="text"
            value={scene.title}
            onChange={(e) => onUpdateScene({ ...scene, title: e.target.value })}
            className="bg-transparent border-none text-slate-100 font-semibold text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/40 rounded px-1"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Duration Badge */}
          <div className="flex items-center gap-1 text-[11px] font-medium text-slate-400 bg-slate-900 px-2 py-1 rounded-md border border-slate-800">
            <span>⏱️ {scene.estimatedDurationSec}초</span>
          </div>

          {/* Quick Scene Play */}
          <button
            onClick={() => onPreviewScene(scene.sceneNumber - 1)}
            className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 transition cursor-pointer"
            title="이 씬 바로 미리보기"
          >
            <Play className="w-3 h-3 fill-current" />
            <span className="hidden sm:inline">미리보기</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Visual Media (Left) & Script / Prompts (Right) */}
      <div className="p-4 grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Left Column: Visual Keyframe & Veo Preview (5 cols) */}
        <div className="md:col-span-5 flex flex-col gap-2.5">
          <div
            className={`w-full ${aspectClass} mx-auto relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center group`}
          >
            {scene.imageUrl ? (
              <img
                src={scene.imageUrl}
                alt={scene.title}
                className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="text-center p-4">
                <ImageIcon className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-400">이미지가 없습니다</p>
              </div>
            )}

            {/* Loading Overlay */}
            {scene.isGeneratingImage && (
              <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2 z-10">
                <div className="w-7 h-7 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-semibold text-indigo-200">
                  Gemini Flash 이미지 생성 중...
                </span>
              </div>
            )}

            {/* Veo Generated Video overlay tag if available */}
            {scene.videoUrl && (
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-amber-500/80 backdrop-blur-sm text-slate-950 font-bold text-[10px] flex items-center gap-1">
                <Video className="w-3 h-3" />
                <span>Veo Clip Ready</span>
              </div>
            )}

            {/* Camera Tag in Corner */}
            <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-slate-950/80 backdrop-blur-sm text-slate-300 text-[10px] border border-slate-800 font-medium flex items-center gap-1">
              <Clapperboard className="w-3 h-3 text-cyan-400" />
              <span>{scene.cameraMovement}</span>
            </div>
          </div>

          {/* Keyframe Action Toolbar */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onGenerateImage(scene.id)}
              disabled={scene.isGeneratingImage}
              className="flex-1 py-1.5 px-2.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${scene.isGeneratingImage ? 'animate-spin' : ''}`}
              />
              <span>{scene.imageUrl ? '이미지 재생성' : 'AI 이미지 생성'}</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer"
              title="컴퓨터에서 이미지 직접 업로드"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>업로드</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>
        </div>

        {/* Right Column: Narration, Voice, Veo Prompt (7 cols) */}
        <div className="md:col-span-7 flex flex-col justify-between gap-3">
          {/* Narration Script */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>내레이션 대본 (Voiceover Script)</span>
              </label>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500">{scene.narration.length}자</span>
                <button
                  type="button"
                  onClick={handlePlayVoice}
                  className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                >
                  {isPlayingAudio ? (
                    <>
                      <Square className="w-2.5 h-2.5 text-rose-400 fill-current" />
                      <span>중지</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-2.5 h-2.5 text-emerald-400 fill-current" />
                      <span>대본 듣기</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => onGenerateAudio(scene.id)}
                  disabled={scene.isGeneratingAudio}
                  className="text-[11px] px-2 py-0.5 rounded bg-indigo-900/40 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-500/30 transition cursor-pointer"
                >
                  {scene.isGeneratingAudio ? '음성 합성 중...' : 'Gemini TTS 생성'}
                </button>
              </div>
            </div>

            <textarea
              value={scene.narration}
              onChange={(e) => {
                const text = e.target.value;
                const estimated = Math.max(4, Math.round(text.length * 0.16));
                onUpdateScene({ ...scene, narration: text, estimatedDurationSec: estimated });
              }}
              rows={3}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition leading-relaxed resize-none"
              placeholder="내레이션 대본을 입력하세요..."
            />

            {/* Keyword chips */}
            {scene.subtitleKeywords?.length > 0 && (
              <div className="mt-1.5 flex flex-wrap items-center gap-1">
                <span className="text-[10px] text-slate-500">강조 자막:</span>
                {scene.subtitleKeywords.map((kw, kidx) => (
                  <span
                    key={kidx}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium"
                  >
                    #{kw}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Google Veo Video Generation Prompt Box */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                <Clapperboard className="w-3.5 h-3.5" />
                <span>Google Veo 비디오 생성 프롬프트</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyPrompt}
                  className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400 font-semibold">복사됨!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>프롬프트 복사</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <p className="text-[11px] text-slate-300 font-mono bg-slate-900/90 p-2 rounded-lg border border-slate-800/60 leading-normal line-clamp-3">
              {scene.veoPrompt}
            </p>

            <div className="mt-2 flex items-center justify-between gap-2">
              <span className="text-[10px] text-slate-500 truncate">
                SFX: {scene.sfxCue || '시네마틱 배경음'}
              </span>

              <button
                type="button"
                onClick={() => onGenerateVeoClip(scene.id)}
                disabled={scene.isGeneratingVideo}
                className="text-[10px] font-semibold px-2.5 py-1 rounded bg-gradient-to-r from-amber-600/30 to-indigo-600/30 hover:from-amber-600/40 hover:to-indigo-600/40 text-amber-300 border border-amber-500/30 transition flex items-center gap-1 cursor-pointer"
              >
                {scene.isGeneratingVideo ? (
                  <>
                    <div className="w-2.5 h-2.5 border border-amber-300 border-t-transparent rounded-full animate-spin" />
                    <span>Veo 클립 생성 중...</span>
                  </>
                ) : (
                  <>
                    <Video className="w-3 h-3" />
                    <span>Veo 비디오 직접 생성</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Advanced Camera & Transition Settings Dropdown */}
          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 transition"
            >
              <Sliders className="w-3 h-3" />
              <span>카메라 무빙 & 트랜지션 상세 설정</span>
              <ChevronDown
                className={`w-3 h-3 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
              />
            </button>

            {showAdvanced && (
              <div className="mt-2 grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-xs">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">카메라 무빙</label>
                  <select
                    value={scene.cameraMovement}
                    onChange={(e) =>
                      onUpdateScene({ ...scene, cameraMovement: e.target.value as CameraMovement })
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 text-xs"
                  >
                    {cameraOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">씬 전환 효과</label>
                  <select
                    value={scene.transitionType}
                    onChange={(e) =>
                      onUpdateScene({ ...scene, transitionType: e.target.value as TransitionType })
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 text-xs"
                  >
                    {transitionOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
