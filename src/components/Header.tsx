import React from 'react';
import { Film, Sparkles, Monitor, Smartphone, Square, Play, RotateCcw } from 'lucide-react';
import { AspectRatio, StoryboardProject, StudioTab } from '../types/videoStudio';
import { SAMPLE_PROJECTS } from '../utils/defaultPresets';

interface HeaderProps {
  currentTab: StudioTab;
  onTabChange: (tab: StudioTab) => void;
  project: StoryboardProject;
  onLoadPreset: (project: StoryboardProject) => void;
  onNewProject: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  project,
  onLoadPreset,
  onNewProject,
}) => {
  return (
    <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand & Logo */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => onTabChange('input')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-amber-500 p-0.5 shadow-lg shadow-indigo-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Film className="w-5 h-5 text-indigo-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
                Google Flow
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-gradient-to-r from-blue-500 to-cyan-500 text-white tracking-normal uppercase">
                  Veo Studio
                </span>
              </span>
            </div>
            <p className="text-xs text-slate-400 truncate max-w-[220px] sm:max-w-xs">
              {project.title || 'AI 비디오 자동 제작 스튜디오'}
            </p>
          </div>
        </div>

        {/* Aspect Ratio Badge & Presets */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Preset Selector Dropdown */}
          <div className="relative hidden md:flex items-center">
            <select
              aria-label="샘플 프로젝트 선택"
              className="bg-slate-900 border border-slate-800 text-xs text-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500 transition cursor-pointer"
              onChange={(e) => {
                const selected = SAMPLE_PROJECTS.find((p) => p.id === e.target.value);
                if (selected) onLoadPreset(selected);
              }}
              value={project.id || ''}
            >
              <option value="" disabled>
                💡 샘플 프로젝트 체험
              </option>
              {SAMPLE_PROJECTS.map((sample) => (
                <option key={sample.id} value={sample.id}>
                  {sample.title} ({sample.aspectRatio})
                </option>
              ))}
            </select>
          </div>

          {/* Aspect Ratio Indicator */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300">
            {project.aspectRatio === '9:16' ? (
              <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
            ) : project.aspectRatio === '1:1' ? (
              <Square className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Monitor className="w-3.5 h-3.5 text-indigo-400" />
            )}
            <span className="font-semibold text-slate-200">{project.aspectRatio}</span>
          </div>

          {/* Action buttons */}
          <button
            onClick={onNewProject}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-xs font-medium text-slate-300 transition"
            title="새 프로젝트 만들기"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">새로 만들기</span>
          </button>

          <button
            onClick={() => onTabChange('player')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition shadow-sm ${
              currentTab === 'player'
                ? 'bg-indigo-600 text-white shadow-indigo-500/25'
                : 'bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30'
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>플레이어</span>
          </button>
        </div>
      </div>
    </header>
  );
};
