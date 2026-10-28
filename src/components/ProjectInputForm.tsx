import React, { useState } from 'react';
import {
  Sparkles,
  Wand2,
  Video,
  Monitor,
  Smartphone,
  Square,
  Volume2,
  Palette,
  Timer,
  CheckCircle,
  HelpCircle,
  Lightbulb,
} from 'lucide-react';
import { AspectRatio } from '../types/videoStudio';

interface ProjectInputFormProps {
  onGenerate: (params: {
    topic: string;
    aspectRatio: AspectRatio;
    style: string;
    tone: string;
    sceneCount: number;
    targetLanguage: string;
    voiceName: string;
    autoGenerateAssets: boolean;
  }) => Promise<void>;
  isLoading: boolean;
  statusMessage?: string;
}

export const ProjectInputForm: React.FC<ProjectInputFormProps> = ({
  onGenerate,
  isLoading,
  statusMessage,
}) => {
  const [topic, setTopic] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [style, setStyle] = useState('Photorealistic Cinematic 8K');
  const [tone, setTone] = useState('Inspiring & Dramatic');
  const [sceneCount, setSceneCount] = useState<number>(4);
  const [voiceName, setVoiceName] = useState('Kore');
  const [targetLanguage, setTargetLanguage] = useState('ko');
  const [autoGenerateAssets, setAutoGenerateAssets] = useState(true);

  const sampleTopics = [
    {
      title: '양자 컴퓨터 원리와 일상 혁신',
      ratio: '9:16' as AspectRatio,
      style: 'Cyberpunk Neon Sci-Fi',
      tone: 'Fast & Engaging (YouTube Shorts)',
    },
    {
      title: '인공지능과 인류의 2030 미래 도시 공존',
      ratio: '16:9' as AspectRatio,
      style: 'Photorealistic Cinematic 8K',
      tone: 'Inspiring & Dramatic',
    },
    {
      title: '조선시대 비밀 레시피로 만드는 수제 궁중 떡갈비',
      ratio: '16:9' as AspectRatio,
      style: 'Photorealistic Cinematic 8K',
      tone: 'Educational & Clear',
    },
    {
      title: '우주 심우주 탐사선 제임스 웹이 포착한 기적의 성운',
      ratio: '16:9' as AspectRatio,
      style: 'Photorealistic Cinematic 8K',
      tone: 'Inspiring & Dramatic',
    },
    {
      title: '바쁜 현대인을 위한 1분 스트레스 해소 호흡법',
      ratio: '9:16' as AspectRatio,
      style: 'Warm Watercolor Storybook',
      tone: 'Calm & Philosophical',
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    onGenerate({
      topic,
      aspectRatio,
      style,
      tone,
      sceneCount,
      targetLanguage,
      voiceName,
      autoGenerateAssets,
    });
  };

  const handleApplyTopic = (item: (typeof sampleTopics)[0]) => {
    setTopic(item.title);
    setAspectRatio(item.ratio);
    setStyle(item.style);
    setTone(item.tone);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Intro Hero Banner */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Google Flow & Veo Video Production Pipeline</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          주제만 넣으면{' '}
          <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-amber-300 bg-clip-text text-transparent">
            대본·키프레임·Veo 프롬프트
          </span>
          가 완성됩니다
        </h1>
        <p className="mt-2 text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
          Google Gemini를 통해 씬별 내레이션 대본, Google Veo 시네마틱 프롬프트, 키프레임 이미지,
          TTS 음성을 원스톱으로 구성하고 브라우저에서 즉시 동영상으로 합성합니다.
        </p>
      </div>

      {/* Main Input Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Topic Input Box */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl relative">
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="topic-input" className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              <span>영상 주제 또는 원문 내용 입력</span>
            </label>
            <span className="text-xs text-slate-500">{topic.length}자</span>
          </div>

          <textarea
            id="topic-input"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            rows={4}
            placeholder="예: 2030년 자율주행 플라잉카와 스마트 시티의 하루를 담은 감각적인 테크 다큐 영상 만들어줘. 또는 유튜브 쇼츠용 양자 컴퓨터 설명 영상."
            className="w-full bg-slate-950/90 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition resize-none"
            required
          />

          {/* Preset Chips */}
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-slate-400 mr-1 flex items-center gap-1">
              <span>추천 아이디어:</span>
            </span>
            {sampleTopics.map((s, idx) => (
              <button
                type="button"
                key={idx}
                onClick={() => handleApplyTopic(s)}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-slate-700/50 hover:border-indigo-500/50 transition cursor-pointer"
              >
                {s.title}
              </button>
            ))}
          </div>
        </div>

        {/* Configuration Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Aspect Ratio */}
          <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-4">
            <label className="text-xs font-semibold text-slate-300 mb-2.5 flex items-center gap-1.5">
              <Video className="w-3.5 h-3.5 text-indigo-400" />
              <span>화면 비율 (비디오 포맷)</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setAspectRatio('16:9')}
                className={`flex flex-col items-center justify-center py-3 px-2 rounded-xl border text-xs font-medium transition cursor-pointer ${
                  aspectRatio === '16:9'
                    ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-sm'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Monitor className="w-5 h-5 mb-1.5 text-indigo-400" />
                <span className="font-semibold">16:9 가로형</span>
                <span className="text-[10px] text-slate-400">유튜브/웹</span>
              </button>

              <button
                type="button"
                onClick={() => setAspectRatio('9:16')}
                className={`flex flex-col items-center justify-center py-3 px-2 rounded-xl border text-xs font-medium transition cursor-pointer ${
                  aspectRatio === '9:16'
                    ? 'bg-cyan-600/20 border-cyan-500 text-white shadow-sm'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Smartphone className="w-5 h-5 mb-1.5 text-cyan-400" />
                <span className="font-semibold">9:16 세로형</span>
                <span className="text-[10px] text-slate-400">쇼츠/릴스/틱톡</span>
              </button>

              <button
                type="button"
                onClick={() => setAspectRatio('1:1')}
                className={`flex flex-col items-center justify-center py-3 px-2 rounded-xl border text-xs font-medium transition cursor-pointer ${
                  aspectRatio === '1:1'
                    ? 'bg-emerald-600/20 border-emerald-500 text-white shadow-sm'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Square className="w-5 h-5 mb-1.5 text-emerald-400" />
                <span className="font-semibold">1:1 정사각</span>
                <span className="text-[10px] text-slate-400">인스타그램 피드</span>
              </button>
            </div>
          </div>

          {/* Visual Style */}
          <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-4">
            <label htmlFor="visual-style-select" className="text-xs font-semibold text-slate-300 mb-2.5 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-pink-400" />
              <span>비주얼 아트 스타일 (Imagen / Veo 프롬프트 반영)</span>
            </label>
            <select
              id="visual-style-select"
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              className="w-full bg-slate-950/90 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition cursor-pointer"
            >
              <option value="Photorealistic Cinematic 8K">실사 시네마틱 8K 다큐 (Photorealistic 8K)</option>
              <option value="Cinematic 3D Animation">시네마틱 3D 애니메이션 (Pixar/Disney 3D)</option>
              <option value="Cyberpunk Neon Sci-Fi">사이버펑크 네온 SF (Cyberpunk Neon)</option>
              <option value="Modern Minimalist Motion Graphic">모던 테크 모션 그래픽 (Clean Motion)</option>
              <option value="Warm Watercolor Storybook">따뜻한 수채화 동화풍 (Watercolor Storybook)</option>
              <option value="Retro Vintage Film">레트로 35mm 필름 (Vintage Film Grain)</option>
            </select>
            <p className="mt-2 text-[11px] text-slate-500">
              선택한 스타일에 맞춰 Google Veo용 카메라 무빙 및 렌즈 조명 지시어가 자동 생성됩니다.
            </p>
          </div>

          {/* Voice Actor Selection */}
          <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-4">
            <label htmlFor="voice-actor-select" className="text-xs font-semibold text-slate-300 mb-2.5 flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-amber-400" />
              <span>내레이션 AI 음성 (Gemini TTS)</span>
            </label>
            <select
              id="voice-actor-select"
              value={voiceName}
              onChange={(e) => setVoiceName(e.target.value)}
              className="w-full bg-slate-950/90 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition cursor-pointer"
            >
              <option value="Kore">Kore - 명확하고 신뢰감 있는 여성 아나운서</option>
              <option value="Puck">Puck - 에너제틱하고 경쾌한 남성 크리에이터</option>
              <option value="Fenrir">Fenrir - 차분하고 묵직한 남성 다큐멘터리</option>
              <option value="Zephyr">Zephyr - 부드럽고 따뜻한 감성 여성 나레이터</option>
            </select>
          </div>

          {/* Tone & Scene Count */}
          <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <label htmlFor="tone-select" className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                <Timer className="w-3.5 h-3.5 text-cyan-400" />
                <span>대본 톤앤매너 & 씬(Scene) 수</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  id="tone-select"
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="bg-slate-950/90 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition cursor-pointer"
                >
                  <option value="Inspiring & Dramatic">웅장하고 감동적인</option>
                  <option value="Fast & Engaging (YouTube Shorts)">빠르고 강렬한 쇼츠</option>
                  <option value="Educational & Clear">명확한 지식 전달</option>
                  <option value="Calm & Philosophical">차분한 힐링/철학</option>
                </select>

                <select
                  id="scene-count-select"
                  aria-label="씬 개수 선택"
                  value={sceneCount}
                  onChange={(e) => setSceneCount(Number(e.target.value))}
                  className="bg-slate-950/90 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition cursor-pointer"
                >
                  <option value={3}>3개 씬 (~18초)</option>
                  <option value={4}>4개 씬 (~25초)</option>
                  <option value={5}>5개 씬 (~32초)</option>
                  <option value={6}>6개 씬 (~40초)</option>
                </select>
              </div>
            </div>

            {/* Auto Generate Assets Checkbox */}
            <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={autoGenerateAssets}
                  onChange={(e) => setAutoGenerateAssets(e.target.checked)}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 h-4 w-4 bg-slate-900"
                />
                <span>대본 생성 후 키프레임 이미지와 TTS 음성 자동 생성</span>
              </label>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading || !topic.trim()}
            className={`w-full py-4 px-6 rounded-2xl font-bold text-base flex items-center justify-center gap-3 transition shadow-lg ${
              isLoading || !topic.trim()
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 hover:from-blue-500 hover:via-indigo-500 hover:to-indigo-600 text-white shadow-indigo-600/30 cursor-pointer active:scale-[0.99]'
            }`}
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <span>{statusMessage || 'Google Flow 비디오 파이프라인 생성 중...'}</span>
              </>
            ) : (
              <>
                <Wand2 className="w-5 h-5 text-amber-300 animate-pulse-subtle" />
                <span>Google Flow 비디오 생성 시작 (대본 + 이미지 + Veo 프롬프트)</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
