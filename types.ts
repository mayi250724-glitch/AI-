
export interface Character {
  id: string; // Unique ID for library management
  name: string;
  gender?: string;
  age?: string;
  tags?: string[]; // e.g. ["Cyberpunk", "Student"]
  subjectDescription: string; // 主体描述
  background: string; // 身份背景
  personality: string; // 性格特征
  coreProps: string; // 核心道具
  visualPrompt: string; // Character portrait prompt (Chinese)
  imageUrl?: string; // Generated image
  isGeneratingImage?: boolean;
  error?: string; // Error message if generation failed
}

export interface Scene {
  location: string;
  mood: string;
  timeOfDay: string;
  visualPrompt: string; // Environment prompt (Chinese)
}

export interface Shot {
  id: number;
  shotNumber: number;
  
  // Content
  contentZh: string;
  contentEn: string;
  
  // Visuals
  visualDescriptionZh: string;
  visualDescriptionEn: string;
  
  // Specs
  shotSize: string; // Bilingual string e.g. "Close-up (特写)"
  cameraMovement: string; // Bilingual string e.g. "Pan Right (右摇)"
  
  // Prompts - Bilingual
  t2iPrompt: string; // Text to Image (Chinese)
  t2iPromptEn: string; // Text to Image (English)
  
  i2vPrompt: string; // Image to Video (Chinese)
  i2vPromptEn: string; // Image to Video (English)
  
  t2vPrompt: string; // Text to Video (Chinese)
  t2vPromptEn: string; // Text to Video (English)
  
  // Audio
  narrationZh: string;
  narrationEn: string;
  audioPromptZh?: string; // BGM/SFX (Chinese)
  audioPromptEn?: string; // BGM/SFX (English)
  audioFileUrl?: string; // User uploaded audio file
  
  duration: string;
  imageUrl?: string;
  lastFrameImageUrl?: string; // Uploaded Last Frame Image
  isGeneratingImage?: boolean;

  // Video
  videoUrl?: string;
  isGeneratingVideo?: boolean;
  generationProgress?: number; // 0-100
  generationStatus?: string; // e.g., 'running', 'queued'
  error?: string; // Error message if generation failed
}

export interface StoryboardData {
  title: string;
  synopsis: string;
  characters: Character[];
  scenes: Scene[];
  shots: Shot[];
}

// --- Comic Generator Interfaces ---
export interface ComicPanel {
  id: number;
  panelNumber: number;
  description: string;
  visualPrompt: string;
  caption: string;
  imageUrl?: string;
  isGenerating?: boolean;
}

export interface ComicData {
  title: string;
  style: string;
  panels: ComicPanel[];
}

// --- Editor Interfaces ---
export enum TrackType {
  VIDEO = 'video',
  AUDIO = 'audio',
  TEXT = 'text',
  EFFECT = 'effect'
}

export interface EditorClip {
  id: string;
  resourceId: string; // Link to raw asset
  startOffset: number; // Start time in timeline (seconds)
  duration: number; // Length in timeline (seconds)
  srcStart: number; // Start time in source file
  type: TrackType;
  name: string;
  properties?: any; // Scale, volume, text content, etc.
  
  // New Editing Features
  transition?: { type: string; duration: number; name: string };
  effects?: { type: string; name: string }[];
}

export interface EditorTrack {
  id: string;
  type: TrackType;
  clips: EditorClip[];
  isMuted?: boolean;
  isLocked?: boolean;
}

export enum AppStep {
  INPUT = 'INPUT',
  ANALYZING = 'ANALYZING',
  RESULT = 'RESULT',
  FULL_MOVIE = 'FULL_MOVIE',
  COMIC_GENERATOR = 'COMIC_GENERATOR',
  EDITOR = 'EDITOR',
  IMAGE_GEN = 'IMAGE_GEN', 
  VIDEO_GEN = 'VIDEO_GEN',
  BOOK_DECONSTRUCTION = 'BOOK_DECONSTRUCTION', // Legacy compatibility
  NOVEL_WORKSTATION = 'NOVEL_WORKSTATION',
  SELF_MEDIA_CENTER = 'SELF_MEDIA_CENTER', // NEW
}

export interface DeconstructionResult {
    title: string;
    characterDesign: string;
    plotDesign: string;
    emotionalBeats: string;
    imitationSuggestions: string;
}

export interface AnalyzeOptions {
  genre: string;
  style: string;
  mode: 'divergent' | 'logic';
  lang: 'zh' | 'en';
  shotCountMode: 'auto' | 'custom';
  customShotCount?: number;
  aspectRatio: string;
  libraryCharacters?: Character[]; // Pass known characters to analysis
}

export interface ProviderConfig {
    baseUrl: string;
    apiKey: string;
    textModel?: string;
    imageModel?: string;
    videoModel?: string;
}

export interface ApiConfig {
  baseUrl: string;
  apiKey: string;
  textModel: string;
  imageModel: string;
  videoModel: string;
  provider: 'gemini' | 'yunwu' | 't8star' | 'tuzi';
  
  // Multi-provider storage for failover
  providers?: Record<string, ProviderConfig>;

  // Backend Integration
  enableBackend: boolean;
  backendUrl: string;
}

export interface UserProfile {
  id?: string;
  username: string;
  avatar?: string;
  phone?: string;
  email?: string;
  level: string; // e.g. "Nano Pro"
  status: string; // e.g. "Active"
  token?: string; // Auth token
  isVip?: boolean;
  vipExpireDate?: number;
  
  // RBAC & Groups
  permissions?: string[]; // e.g. ['model:sora', 'feature:editor', 'admin:access']
  groupId?: string; // e.g. 'group_free', 'group_vip'
  
  // Viral/Growth
  inviteCode?: string; // My invite code
  invitedCount?: number; // How many I invited
  points?: number; // Reward points
}

// --- NEW: Dynamic App Config (DIY) ---
export interface AppConfig {
    appName: string;       // Custom App Name (e.g. "My Studio")
    logoUrl?: string;      // Custom Logo
    themeColor: string;    // Primary HEX color
    features: {
        comic: boolean;    // Enable/Disable Comic
        video: boolean;    // Enable/Disable Video
        image: boolean;    // Enable/Disable Image
        payment: boolean;  // Enable/Disable Payment UI
        invite: boolean;   // Enable/Disable Viral Invite UI
    };
    announcement?: string; // System announcement
}

export interface PaymentPlan {
    id: string;
    name: string;
    price: number;
    originalPrice: number;
    duration: string; // "Month", "Year"
    features: string[];
    isPopular?: boolean;
}

// --- NEW: Admin & RBAC Types ---
export interface UserGroup {
    id: string;
    name: string; // e.g. "VIP 1", "SVIP"
    permissions: string[]; // e.g. ["model:gpt4", "video:gen"]
    maxDailyCredits: number;
    monthlyPrice: number;
}

// New: Dynamic Model Definition from Backend
export interface BackendModel {
    id: string;          // Model ID sent to API (e.g., 'veo-2')
    name: string;        // Display Name (e.g., 'Google Veo 2')
    provider: string;    // 'google', 'openai', 'kling'
    type: 'text' | 'image' | 'video' | 'audio';
    isLocked?: boolean;  // If true, user needs upgrade
    vipLevelRequired?: number; 
}
