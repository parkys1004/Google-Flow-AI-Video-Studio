import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  StoryboardProject,
  StoryboardScene,
  SubtitleSettings,
  AspectRatio,
} from '../types/videoStudio';
import { studioAudioEngine } from '../utils/audioEngine';
import confetti from 'canvas-confetti';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Maximize2,
  Download,
  Settings,
  Sparkles,
  Music,
  Video,
} from 'lucide-react';

interface VideoCanvasPlayerProps {
  project: StoryboardProject;
  initialSceneIndex?: number;
  onNavigateToTab: (tab: any) => void;
}

export const VideoCanvasPlayer: React.FC<VideoCanvasPlayerProps> = ({
  project,
  initialSceneIndex = 0,
  onNavigateToTab,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(initialSceneIndex);
  const [bgmTheme, setBgmTheme] = useState<'cinematic' | 'tech' | 'calm' | 'epic'>('cinematic');
  const [bgmVolume, setBgmVolume] = useState(0.25);
  const [voiceVolume, setVoiceVolume] = useState(0.9);
  const [isMuted, setIsMuted] = useState(false);

  // Subtitle settings
  const [subtitleSettings, setSubtitleSettings] = useState<SubtitleSettings>({
    enabled: true,
    position: 'bottom',
    style: 'reels-yellow',
    fontSize: 22,
  });
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Video recording / export state
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // Preloaded image elements cache
  const imageElementsRef = useRef<Map<string, HTMLImageElement>>(new Map());

  // Animation frame reference
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedTimeOffsetRef = useRef<number>(0);

  const scenes = project.scenes;

  // Compute scene timing markers
  const sceneDurations = scenes.map((s) => Math.max(3, s.estimatedDurationSec || 5));
  const totalDuration = sceneDurations.reduce((a, b) => a + b, 0);

  // Get scene timeline offsets
  const sceneOffsets = sceneDurations.reduce((acc, dur, idx) => {
    acc.push(idx === 0 ? 0 : acc[idx - 1] + sceneDurations[idx - 1]);
    return acc;
  }, [] as number[]);

  // Preload images into memory
  useEffect(() => {
    scenes.forEach((scene) => {
      if (scene.imageUrl && !imageElementsRef.current.has(scene.id)) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = scene.imageUrl;
        img.onload = () => {
          imageElementsRef.current.set(scene.id, img);
        };
      }
    });
  }, [scenes]);

  // Jump to specific scene if initialSceneIndex changes
  useEffect(() => {
    if (initialSceneIndex >= 0 && initialSceneIndex < scenes.length) {
      seekTo(sceneOffsets[initialSceneIndex] || 0);
    }
  }, [initialSceneIndex]);

  // Calculate current scene index from time
  const getSceneIndexAtTime = (time: number): number => {
    for (let i = sceneOffsets.length - 1; i >= 0; i--) {
      if (time >= sceneOffsets[i]) {
        return i;
      }
    }
    return 0;
  };

  // Play voice narration for the current scene
  const playSceneVoice = useCallback(
    async (sceneIdx: number) => {
      const scene = scenes[sceneIdx];
      if (!scene || isMuted) return;

      if (scene.audioUrl) {
        await studioAudioEngine.playVoiceAudio(scene.audioUrl);
      } else if (scene.narration) {
        await studioAudioEngine.speakFallback(scene.narration, 'ko-KR');
      }
    },
    [scenes, isMuted]
  );

  // Render a single frame on canvas with Ken Burns effect and subtitles
  const renderFrame = useCallback(
    (time: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;

      const sceneIdx = getSceneIndexAtTime(time);
      const currentScene = scenes[sceneIdx];
      if (!currentScene) return;

      const sceneStart = sceneOffsets[sceneIdx];
      const sceneDuration = sceneDurations[sceneIdx];
      const sceneProgress = Math.min(1, Math.max(0, (time - sceneStart) / sceneDuration));

      ctx.clearRect(0, 0, width, height);

      // 1. Draw Image with Ken Burns Camera Motion
      const img = imageElementsRef.current.get(currentScene.id);
      if (img && img.complete && img.naturalWidth > 0) {
        ctx.save();

        let scale = 1.0;
        let transX = 0;
        let transY = 0;
        let rotation = 0;

        const movement = currentScene.cameraMovement || 'Zoom In';

        switch (movement) {
          case 'Zoom In':
            scale = 1.0 + sceneProgress * 0.18;
            break;
          case 'Zoom Out':
            scale = 1.18 - sceneProgress * 0.18;
            break;
          case 'Pan Left':
            scale = 1.12;
            transX = (0.5 - sceneProgress) * 0.12 * width;
            break;
          case 'Pan Right':
            scale = 1.12;
            transX = (sceneProgress - 0.5) * 0.12 * width;
            break;
          case 'Tilt Up':
            scale = 1.12;
            transY = (sceneProgress - 0.5) * 0.08 * height;
            break;
          case 'Orbit':
            scale = 1.08 + Math.sin(sceneProgress * Math.PI) * 0.06;
            rotation = Math.sin(sceneProgress * Math.PI) * 0.02;
            break;
          case 'Dolly In':
          default:
            scale = 1.0 + sceneProgress * 0.22;
            break;
        }

        // Apply transformations centered
        ctx.translate(width / 2 + transX, height / 2 + transY);
        ctx.rotate(rotation);
        ctx.scale(scale, scale);

        // Aspect fit / cover
        const imgRatio = img.naturalWidth / img.naturalHeight;
        const canvasRatio = width / height;
        let drawW = width;
        let drawH = height;

        if (imgRatio > canvasRatio) {
          drawH = height;
          drawW = height * imgRatio;
        } else {
          drawW = width;
          drawH = width / imgRatio;
        }

        ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
        ctx.restore();
      } else {
        // Fallback procedural background
        const grad = ctx.createLinearGradient(0, 0, width, height);
        grad.addColorStop(0, '#0f172a');
        grad.addColorStop(1, '#1e1b4b');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
      }

      // 2. Cinematic Vignette Overlay
      const vigGrad = ctx.createRadialGradient(
        width / 2,
        height / 2,
        Math.min(width, height) * 0.4,
        width / 2,
        height / 2,
        Math.min(width, height) * 0.95
      );
      vigGrad.addColorStop(0, 'rgba(0,0,0,0)');
      vigGrad.addColorStop(1, 'rgba(0,0,0,0.55)');
      ctx.fillStyle = vigGrad;
      ctx.fillRect(0, 0, width, height);

      // 3. Scene Transition (Crossfade / Dissolve at scene start)
      if (sceneProgress < 0.15 && sceneIdx > 0) {
        const prevScene = scenes[sceneIdx - 1];
        const prevImg = imageElementsRef.current.get(prevScene.id);
        const fadeAlpha = 1.0 - sceneProgress / 0.15;

        if (prevImg && prevImg.complete && prevImg.naturalWidth > 0 && fadeAlpha > 0) {
          ctx.save();
          ctx.globalAlpha = fadeAlpha;
          ctx.drawImage(prevImg, 0, 0, width, height);
          ctx.restore();
        }
      }

      // 4. Render Subtitles & Keywords
      if (subtitleSettings.enabled && currentScene.narration) {
        renderSubtitles(ctx, width, height, currentScene, sceneProgress);
      }

      // 5. Minimal Scene Badge (Top Left)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.beginPath();
      ctx.roundRect(24, 24, 110, 32, 16);
      ctx.fill();

      ctx.font = '700 12px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#38bdf8';
      ctx.textAlign = 'left';
      ctx.fillText(`SCENE 0${currentScene.sceneNumber}`, 38, 44);
    },
    [scenes, sceneDurations, sceneOffsets, subtitleSettings]
  );

  // Helper to render subtitles with style
  const renderSubtitles = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    scene: StoryboardScene,
    progress: number
  ) => {
    const text = scene.narration.trim();
    if (!text) return;

    ctx.save();

    const isVertical = project.aspectRatio === '9:16';
    const baseFontSize = isVertical ? 24 : 28;
    ctx.font = `800 ${baseFontSize}px "Noto Sans KR", "Plus Jakarta Sans", sans-serif`;
    ctx.textAlign = 'center';

    let posY = height - 90;
    if (subtitleSettings.position === 'middle') posY = height / 2 + 80;
    if (subtitleSettings.position === 'top') posY = 120;
    if (isVertical) posY = height * 0.78;

    // Word wrap
    const maxLineWidth = width * (isVertical ? 0.88 : 0.8);
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const w of words) {
      const testLine = currentLine ? `${currentLine} ${w}` : w;
      if (ctx.measureText(testLine).width > maxLineWidth) {
        lines.push(currentLine);
        currentLine = w;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);

    const lineHeight = baseFontSize * 1.35;
    const totalTextHeight = lines.length * lineHeight;
    const startY = posY - (totalTextHeight / 2);

    lines.forEach((line, lineIndex) => {
      const lineY = startY + lineIndex * lineHeight;
      const textWidth = ctx.measureText(line).width;

      // Style variants
      if (subtitleSettings.style === 'cinematic-bar') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
        ctx.fillRect(width / 2 - textWidth / 2 - 16, lineY - baseFontSize + 2, textWidth + 32, lineHeight);
      } else if (subtitleSettings.style === 'reels-yellow') {
        // Heavy black outline + vibrant yellow text
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 7;
        ctx.lineJoin = 'round';
        ctx.strokeText(line, width / 2, lineY);
        ctx.fillStyle = '#fef08a'; // Yellow
        ctx.fillText(line, width / 2, lineY);
        return;
      } else if (subtitleSettings.style === 'neon-bold') {
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 12;
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 6;
        ctx.strokeText(line, width / 2, lineY);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(line, width / 2, lineY);
        return;
      }

      // Default outline
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.lineWidth = 5;
      ctx.strokeText(line, width / 2, lineY);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(line, width / 2, lineY);
    });

    ctx.restore();
  };

  // Main playback loop
  useEffect(() => {
    let lastSceneIdx = -1;

    const tick = (now: number) => {
      if (!startTimeRef.current) startTimeRef.current = now;
      const elapsedSec = (now - startTimeRef.current) / 1000 + pausedTimeOffsetRef.current;

      if (elapsedSec >= totalDuration) {
        setIsPlaying(false);
        setCurrentTime(totalDuration);
        pausedTimeOffsetRef.current = 0;
        studioAudioEngine.stopAll();
        return;
      }

      setCurrentTime(elapsedSec);
      renderFrame(elapsedSec);

      // Check scene transition to play audio
      const sceneIdx = getSceneIndexAtTime(elapsedSec);
      if (sceneIdx !== lastSceneIdx) {
        lastSceneIdx = sceneIdx;
        setCurrentSceneIndex(sceneIdx);
        playSceneVoice(sceneIdx);
      }

      if (isPlaying) {
        animationFrameRef.current = requestAnimationFrame(tick);
      }
    };

    if (isPlaying) {
      studioAudioEngine.startBgm(bgmTheme);
      studioAudioEngine.setBgmVolume(isMuted ? 0 : bgmVolume);
      studioAudioEngine.setVoiceVolume(isMuted ? 0 : voiceVolume);
      startTimeRef.current = performance.now();
      animationFrameRef.current = requestAnimationFrame(tick);
    } else {
      studioAudioEngine.stopVoice();
      studioAudioEngine.stopBgm();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      renderFrame(currentTime);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, totalDuration, bgmTheme, bgmVolume, voiceVolume, isMuted, playSceneVoice, renderFrame]);

  // Seek handler
  const seekTo = (targetTime: number) => {
    const clamped = Math.max(0, Math.min(totalDuration, targetTime));
    pausedTimeOffsetRef.current = clamped;
    startTimeRef.current = performance.now();
    setCurrentTime(clamped);
    const sceneIdx = getSceneIndexAtTime(clamped);
    setCurrentSceneIndex(sceneIdx);
    renderFrame(clamped);

    if (isPlaying) {
      playSceneVoice(sceneIdx);
    }
  };

  const togglePlay = () => {
    if (isPlaying) {
      pausedTimeOffsetRef.current = currentTime;
      setIsPlaying(false);
    } else {
      if (currentTime >= totalDuration - 0.2) {
        seekTo(0);
      }
      setIsPlaying(true);
    }
  };

  const handleNextScene = () => {
    const nextIdx = Math.min(scenes.length - 1, currentSceneIndex + 1);
    seekTo(sceneOffsets[nextIdx] || 0);
  };

  const handlePrevScene = () => {
    const prevIdx = Math.max(0, currentSceneIndex - 1);
    seekTo(sceneOffsets[prevIdx] || 0);
  };

  // Fullscreen toggle
  const handleFullscreen = () => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef.current.requestFullscreen();
    }
  };

  // Export video via MediaRecorder
  const handleExportVideo = async () => {
    const canvas = canvasRef.current;
    if (!canvas || isExporting) return;

    try {
      setIsExporting(true);
      setExportProgress(0);

      // Pause regular playback
      setIsPlaying(false);
      studioAudioEngine.stopAll();

      // Setup audio stream
      const audioTrack = studioAudioEngine.getAudioStream();
      const canvasStream = canvas.captureStream(30);

      const combinedStream = new MediaStream();
      canvasStream.getVideoTracks().forEach((track) => combinedStream.addTrack(track));
      if (audioTrack) {
        combinedStream.addTrack(audioTrack);
      }

      // Check supported mime types
      let mimeType = 'video/webm;codecs=vp9,opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm';
      }

      const recorder = new MediaRecorder(combinedStream, {
        mimeType,
        videoBitsPerSecond: 4500000,
      });

      recordedChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const sanitizedTitle = project.title.replace(/[^a-zA-Z0-9가-힣]/g, '_') || 'google_flow_video';
        a.download = `${sanitizedTitle}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        setIsExporting(false);
        setExportProgress(100);

        // Confetti celebratory burst!
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      };

      recorder.start();

      // Start background music for the recording
      studioAudioEngine.startBgm(bgmTheme);

      // Render through timeline step by step
      const fps = 30;
      const totalFrames = Math.ceil(totalDuration * fps);
      let currentFrame = 0;
      let lastAudioScene = -1;

      const recordStep = () => {
        if (currentFrame >= totalFrames) {
          recorder.stop();
          studioAudioEngine.stopAll();
          return;
        }

        const renderTime = currentFrame / fps;
        renderFrame(renderTime);
        setCurrentTime(renderTime);

        const sceneIdx = getSceneIndexAtTime(renderTime);
        if (sceneIdx !== lastAudioScene) {
          lastAudioScene = sceneIdx;
          playSceneVoice(sceneIdx);
        }

        currentFrame++;
        setExportProgress(Math.round((currentFrame / totalFrames) * 100));

        // Yield slightly so frame draws cleanly
        setTimeout(recordStep, 1000 / fps);
      };

      recordStep();
    } catch (error) {
      console.error('Export error:', error);
      setIsExporting(false);
      alert('비디오 내보내기 중 오류가 발생했습니다.');
    }
  };

  // Keyboard shortcut for spacebar play/pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, currentTime]);

  const canvasWidth = project.aspectRatio === '9:16' ? 720 : project.aspectRatio === '1:1' ? 1080 : 1280;
  const canvasHeight = project.aspectRatio === '9:16' ? 1280 : project.aspectRatio === '1:1' ? 1080 : 720;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Studio Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 text-xs font-semibold">
              Live Flow Player
            </span>
            <span className="text-xs text-slate-400">
              {project.aspectRatio === '9:16' ? '세로형 쇼츠' : '시네마틱 16:9'} • {scenes.length}개 씬
            </span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight mt-0.5">{project.title}</h2>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettingsModal(true)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
            title="자막 및 사운드 설정"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">연출 설정</span>
          </button>

          <button
            onClick={handleExportVideo}
            disabled={isExporting}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs flex items-center gap-2 transition shadow-md shadow-emerald-600/30 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? `비디오 렌더링 중 (${exportProgress}%)` : '비디오 파일 다운로드'}</span>
          </button>
        </div>
      </div>

      {/* Main Canvas Viewport */}
      <div
        ref={containerRef}
        className="relative bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col items-center justify-center p-2 sm:p-4"
      >
        <div
          className={`relative w-full flex items-center justify-center ${
            project.aspectRatio === '9:16'
              ? 'max-w-[380px] aspect-[9/16]'
              : project.aspectRatio === '1:1'
              ? 'max-w-[560px] aspect-square'
              : 'max-w-4xl aspect-[16/9]'
          }`}
        >
          <canvas
            ref={canvasRef}
            width={canvasWidth}
            height={canvasHeight}
            className="w-full h-full object-contain rounded-xl shadow-inner bg-black"
          />

          {/* Export Overlay */}
          {isExporting && (
            <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md rounded-xl flex flex-col items-center justify-center gap-3 z-30">
              <div className="w-12 h-12 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin" />
              <div className="text-center">
                <p className="text-sm font-bold text-white">Google Flow 비디오 합성 중...</p>
                <p className="text-xs text-slate-400 mt-1">
                  모든 씬의 움직임, 음성, 자막을 인코딩하고 있습니다. ({exportProgress}%)
                </p>
              </div>
              <div className="w-48 bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full transition-all duration-200"
                  style={{ width: `${exportProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Timeline Bar & Scrubbing */}
        <div className="w-full mt-4 px-2">
          {/* Timeline Bar with Scene Segments */}
          <div className="relative w-full h-3 bg-slate-800/80 rounded-full cursor-pointer overflow-hidden group">
            {/* Scene divider lines */}
            {sceneOffsets.map((offset, idx) => (
              <div
                key={idx}
                className="absolute top-0 bottom-0 w-[1.5px] bg-slate-950/80 z-10"
                style={{ left: `${(offset / totalDuration) * 100}%` }}
              />
            ))}

            {/* Filled Progress */}
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-75 relative"
              style={{ width: `${(currentTime / totalDuration) * 100}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-md scale-0 group-hover:scale-100 transition-transform" />
            </div>

            {/* Click to Seek Overlay */}
            <input
              type="range"
              aria-label="타임라인 탐색"
              min={0}
              max={totalDuration}
              step={0.05}
              value={currentTime}
              onChange={(e) => seekTo(parseFloat(e.target.value))}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
          </div>

          {/* Time & Play Controls Bar */}
          <div className="flex items-center justify-between mt-3 text-xs text-slate-300">
            {/* Playback Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevScene}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
                title="이전 씬"
              >
                <SkipBack className="w-4 h-4" />
              </button>

              <button
                onClick={togglePlay}
                className="w-9 h-9 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center transition shadow-md shadow-indigo-600/30 cursor-pointer"
                title={isPlaying ? '일시 정지' : '재생'}
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 fill-current" />
                ) : (
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                )}
              </button>

              <button
                onClick={handleNextScene}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
                title="다음 씬"
              >
                <SkipForward className="w-4 h-4" />
              </button>

              <button
                onClick={() => seekTo(0)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
                title="처음부터 다시 재생"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <span className="ml-2 font-mono text-[11px] text-slate-400">
                {formatTime(currentTime)} / {formatTime(totalDuration)}
              </span>
            </div>

            {/* Current Scene Tag */}
            <div className="hidden md:flex items-center gap-2">
              <span className="text-[11px] text-slate-400">
                현재 씬: <strong className="text-indigo-300">{currentSceneIndex + 1}</strong> / {scenes.length}
              </span>
              <span className="text-[11px] text-slate-500 truncate max-w-[180px]">
                {scenes[currentSceneIndex]?.title}
              </span>
            </div>

            {/* Sound & Fullscreen Controls */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
                  title={isMuted ? '음소거 해제' : '음소거'}
                >
                  {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
                </button>

                <input
                  type="range"
                  aria-label="볼륨 조절"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : bgmVolume}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setBgmVolume(val);
                    if (isMuted) setIsMuted(false);
                    studioAudioEngine.setBgmVolume(val);
                  }}
                  className="w-16 h-1 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              <button
                onClick={handleFullscreen}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
                title="전체화면"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Settings className="w-4 h-4 text-indigo-400" />
                <span>비디오 연출 & 오디오 설정</span>
              </h3>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                닫기
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* BGM Theme */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center gap-1.5">
                  <Music className="w-3.5 h-3.5 text-cyan-400" />
                  <span>배경음악 테마 (Web Audio Synth)</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['cinematic', 'tech', 'calm', 'epic'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        setBgmTheme(t);
                        if (isPlaying) {
                          studioAudioEngine.stopBgm();
                          studioAudioEngine.startBgm(t);
                        }
                      }}
                      className={`py-2 px-3 rounded-lg border text-xs font-medium capitalize transition cursor-pointer ${
                        bgmTheme === t
                          ? 'bg-indigo-600/20 border-indigo-500 text-white font-semibold'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subtitle Style */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">자막 스타일</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSubtitleSettings({ ...subtitleSettings, style: 'reels-yellow' })}
                    className={`py-2 px-3 rounded-lg border text-xs font-medium transition cursor-pointer ${
                      subtitleSettings.style === 'reels-yellow'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-200'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400'
                    }`}
                  >
                    릴스/쇼츠 옐로우 볼드
                  </button>

                  <button
                    type="button"
                    onClick={() => setSubtitleSettings({ ...subtitleSettings, style: 'neon-bold' })}
                    className={`py-2 px-3 rounded-lg border text-xs font-medium transition cursor-pointer ${
                      subtitleSettings.style === 'neon-bold'
                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-200'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400'
                    }`}
                  >
                    네온 사이버 볼드
                  </button>

                  <button
                    type="button"
                    onClick={() => setSubtitleSettings({ ...subtitleSettings, style: 'cinematic-bar' })}
                    className={`py-2 px-3 rounded-lg border text-xs font-medium transition cursor-pointer ${
                      subtitleSettings.style === 'cinematic-bar'
                        ? 'bg-indigo-500/20 border-indigo-500 text-indigo-200'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400'
                    }`}
                  >
                    시네마틱 블랙 바
                  </button>

                  <button
                    type="button"
                    onClick={() => setSubtitleSettings({ ...subtitleSettings, style: 'clean-minimal' })}
                    className={`py-2 px-3 rounded-lg border text-xs font-medium transition cursor-pointer ${
                      subtitleSettings.style === 'clean-minimal'
                        ? 'bg-slate-700/40 border-slate-500 text-slate-200'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400'
                    }`}
                  >
                    클린 미니멀 화이트
                  </button>
                </div>
              </div>

              {/* Subtitle toggle */}
              <div className="pt-2 flex items-center justify-between">
                <span className="text-slate-300">자막 표시 여부</span>
                <input
                  type="checkbox"
                  checked={subtitleSettings.enabled}
                  onChange={(e) =>
                    setSubtitleSettings({ ...subtitleSettings, enabled: e.target.checked })
                  }
                  className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 h-4 w-4 bg-slate-950"
                />
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs cursor-pointer"
              >
                적용 완료
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}
