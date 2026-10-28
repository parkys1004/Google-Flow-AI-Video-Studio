import React, { useState } from 'react';
import { StoryboardProject } from '../types/videoStudio';
import {
  Download,
  Copy,
  Check,
  FileText,
  Code,
  Sparkles,
  Clapperboard,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface VeoExportModalProps {
  project: StoryboardProject;
  onNavigateToTab: (tab: any) => void;
}

export const VeoExportModal: React.FC<VeoExportModalProps> = ({ project, onNavigateToTab }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const scenes = project.scenes;

  // Generate full Markdown screenplay
  const generateMarkdown = (): string => {
    let md = `# [Google Flow] ${project.title}\n\n`;
    md += `> **기획 요약**: ${project.summary}\n`;
    md += `> **화면 비율**: ${project.aspectRatio} | **비주얼 스타일**: ${project.visualStyle}\n`;
    md += `> **톤앤매너**: ${project.tone} | **BGM 프롬프트**: ${project.bgmPrompt}\n\n`;
    md += `---\n\n## 🎬 씬별 대본 및 Google Veo 영상 생성 프롬프트\n\n`;

    scenes.forEach((s) => {
      md += `### Scene ${s.sceneNumber}: ${s.title} (${s.estimatedDurationSec}초)\n`;
      md += `- **카메라 무빙**: ${s.cameraMovement} | **전환 효과**: ${s.transitionType}\n`;
      md += `- **음성 내레이션 대본**:\n  "${s.narration}"\n`;
      md += `- **강조 자막 키워드**: ${s.subtitleKeywords.join(', ')}\n`;
      md += `- **효과음(SFX)**: ${s.sfxCue}\n`;
      md += `- **Google Veo 비디오 생성 프롬프트**:\n\`\`\`text\n${s.veoPrompt}\n\`\`\`\n`;
      md += `- **Imagen 키프레임 프롬프트**:\n\`\`\`text\n${s.imagePrompt}\n\`\`\`\n\n`;
    });

    return md;
  };

  const handleCopySingle = (prompt: string, idx: number) => {
    navigator.clipboard.writeText(prompt);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleCopyAllPrompts = () => {
    const all = scenes
      .map((s) => `[Scene ${s.sceneNumber}: ${s.title}]\n${s.veoPrompt}\n`)
      .join('\n');
    navigator.clipboard.writeText(all);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    const md = generateMarkdown();
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.title.replace(/[^a-zA-Z0-9가-힣]/g, '_')}_대본_프롬프트.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadJSON = () => {
    const jsonStr = JSON.stringify(project, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.title.replace(/[^a-zA-Z0-9가-힣]/g, '_')}_flow_project.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Overview Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 mb-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-semibold flex items-center gap-1">
                <Clapperboard className="w-3.5 h-3.5" />
                <span>Google Flow & Veo Production Package</span>
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">{project.title}</h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Google Flow 및 Google Veo 모델에서 바로 사용할 수 있는 표준 카메라 연출 프롬프트 시트와 대본 패키지입니다.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleCopyAllPrompts}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
            >
              {copiedAll ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-semibold">전체 복사됨!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Veo 프롬프트 전체 복사</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownloadMarkdown}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-cyan-400" />
              <span>대본 마크다운 (.md) 저장</span>
            </button>

            <button
              onClick={handleDownloadJSON}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
            >
              <Code className="w-3.5 h-3.5 text-amber-400" />
              <span>프로젝트 JSON 저장</span>
            </button>
          </div>
        </div>
      </div>

      {/* Scene Prompts List */}
      <div className="space-y-4">
        {scenes.map((scene, idx) => (
          <div
            key={scene.id || idx}
            className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold text-xs">
                  Scene {scene.sceneNumber}
                </span>
                <h3 className="font-semibold text-sm text-slate-100">{scene.title}</h3>
                <span className="text-xs text-slate-500">⏱️ {scene.estimatedDurationSec}초</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] px-2 py-0.5 rounded bg-slate-950 text-cyan-300 border border-slate-800">
                  {scene.cameraMovement}
                </span>
                <button
                  onClick={() => handleCopySingle(scene.veoPrompt, idx)}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1 transition cursor-pointer"
                >
                  {copiedIndex === idx ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">복사됨</span>
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

            {/* Narration quote */}
            <div className="mb-3 px-3 py-2 rounded-lg bg-slate-950/60 border border-slate-800/60 text-xs text-slate-300">
              <span className="text-slate-500 font-semibold mr-1.5">🎙️ 대본:</span>
              "{scene.narration}"
            </div>

            {/* Veo Prompt Code block */}
            <div className="relative">
              <div className="text-[11px] font-mono text-amber-200/95 bg-slate-950 p-3 rounded-xl border border-slate-800 leading-relaxed overflow-x-auto">
                {scene.veoPrompt}
              </div>
            </div>

            <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500">
              <span>전환 효과: {scene.transitionType}</span>
              <span>SFX: {scene.sfxCue}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Return to Player Bar */}
      <div className="mt-8 text-center">
        <button
          onClick={() => onNavigateToTab('player')}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition shadow-lg shadow-indigo-600/30 cursor-pointer"
        >
          <span>스튜디오 플레이어에서 완성 영상 재생하기</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
