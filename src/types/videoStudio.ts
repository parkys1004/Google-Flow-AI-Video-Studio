export type AspectRatio = '16:9' | '9:16' | '1:1';

export type CameraMovement =
  | 'Zoom In'
  | 'Zoom Out'
  | 'Pan Left'
  | 'Pan Right'
  | 'Dolly In'
  | 'Aerial Drone'
  | 'Tilt Up'
  | 'Orbit';

export type TransitionType = 'fade' | 'dissolve' | 'slide-left' | 'zoom';

export interface StoryboardScene {
  id: string;
  sceneNumber: number;
  title: string;
  narration: string;
  estimatedDurationSec: number;
  visualDescription: string;
  imagePrompt: string;
  veoPrompt: string;
  cameraMovement: CameraMovement;
  transitionType: TransitionType;
  subtitleKeywords: string[];
  sfxCue: string;
  imageUrl?: string;
  audioUrl?: string;
  videoUrl?: string;
  isGeneratingImage?: boolean;
  isGeneratingAudio?: boolean;
  isGeneratingVideo?: boolean;
}

export interface StoryboardProject {
  id: string;
  title: string;
  summary: string;
  visualStyle: string;
  targetAudience: string;
  bgmPrompt: string;
  aspectRatio: AspectRatio;
  scenes: StoryboardScene[];
  tone: string;
  voiceName: string;
  createdAt: number;
}

export type SubtitleStyle = 'neon-bold' | 'clean-minimal' | 'cinematic-bar' | 'reels-yellow';

export interface SubtitleSettings {
  enabled: boolean;
  position: 'bottom' | 'middle' | 'top';
  style: SubtitleStyle;
  fontSize: number; // in pt/px scaling
}

export type StudioTab = 'input' | 'storyboard' | 'player' | 'veo-export';
