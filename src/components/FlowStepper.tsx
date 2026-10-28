import React from 'react';
import { Sparkles, Layers, PlaySquare, Download, CheckCircle2 } from 'lucide-react';
import { StudioTab, StoryboardProject } from '../types/videoStudio';

interface FlowStepperProps {
  currentTab: StudioTab;
  onTabChange: (tab: StudioTab) => void;
  project: StoryboardProject;
}

export const FlowStepper: React.FC<FlowStepperProps> = ({ currentTab, onTabChange, project }) => {
  const scenesCount = project.scenes.length;
  const imagesGenerated = project.scenes.filter((s) => s.imageUrl).length;
  const audiosGenerated = project.scenes.filter((s) => s.audioUrl).length;

  const steps: { id: StudioTab; label: string; sub: string; icon: any }[] = [
    {
      id: 'input',
      label: '1. 기획 & 아이디어',
      sub: '주제 입력 및 스타일 설정',
      icon: Sparkles,
    },
    {
      id: 'storyboard',
      label: '2. 스토리보드 & 에셋',
      sub: `${scenesCount}개 씬 (${imagesGenerated}개 이미지 / ${audiosGenerated}개 음성)`,
      icon: Layers,
    },
    {
      id: 'player',
      label: '3. 비디오 스튜디오 플레이어',
      sub: '실시간 싱크 재생 & 자막 연출',
      icon: PlaySquare,
    },
    {
      id: 'veo-export',
      label: '4. Veo 프롬프트 & 비디오 저장',
      sub: 'MP4/WebM 다운로드 & 프롬프트 시트',
      icon: Download,
    },
  ];

  return (
    <div className="w-full bg-slate-900/60 border-b border-slate-800/80 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between overflow-x-auto gap-2 no-scrollbar">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isActive = currentTab === step.id;
          const isDone =
            (step.id === 'input' && scenesCount > 0) ||
            (step.id === 'storyboard' && imagesGenerated > 0);

          return (
            <button
              key={step.id}
              onClick={() => onTabChange(step.id)}
              className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-left transition whitespace-nowrap group ${
                isActive
                  ? 'bg-indigo-600/20 border border-indigo-500/50 text-white shadow-sm'
                  : 'hover:bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : isDone
                    ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-400'
                    : 'bg-slate-800 text-slate-400 group-hover:text-slate-200'
                }`}
              >
                {isDone && !isActive ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </div>
              <div className="flex flex-col">
                <span
                  className={`text-xs font-semibold ${
                    isActive ? 'text-indigo-300' : 'text-slate-200'
                  }`}
                >
                  {step.label}
                </span>
                <span className="text-[11px] text-slate-400 font-normal">{step.sub}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
