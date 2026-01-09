
import { EditorTrack, EditorClip, TrackType } from '../types';

// JianYing uses microseconds (1s = 1,000,000us)
const US_MULTIPLIER = 1000000;

interface JianYingMaterial {
    id: string;
    type: string;
    path?: string;
    duration?: number;
    width?: number;
    height?: number;
    extra_info?: string;
}

interface JianYingTrack {
    id: string;
    type: string;
    segments: JianYingSegment[];
}

interface JianYingSegment {
    id: string;
    material_id: string;
    source_timerange: { start: number; duration: number };
    target_timerange: { start: number; duration: number };
}

// Generate a random ID closer to JianYing format
const generateId = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

export const createDraft = (tracks: EditorTrack[], resources: any[]): string => {
    const materials: { videos: any[]; audios: any[]; transitions: any[]; effects: any[] } = {
        videos: [],
        audios: [],
        transitions: [],
        effects: []
    };
    
    const draftTracks: JianYingTrack[] = [];
    
    // Map resources to materials map for quick lookup
    const resourceMap = new Map(resources.map(r => [r.id, r]));

    // Calculate total duration for config
    let totalDuration = 0;

    tracks.forEach(track => {
        const jyTrack: JianYingTrack = {
            id: generateId(),
            type: track.type === TrackType.VIDEO ? 'video' : (track.type === TrackType.AUDIO ? 'audio' : 'text'),
            segments: []
        };

        track.clips.forEach(clip => {
            const res = resourceMap.get(clip.resourceId);
            if (!res && track.type !== TrackType.TEXT) return; // Skip if resource missing (except text)

            const materialId = generateId();
            
            // Create Material Entry
            if (track.type === TrackType.VIDEO) {
                materials.videos.push({
                    id: materialId,
                    type: "video",
                    path: res.url, // In real draft, this should be local path. We put URL for reference or prompt user to replace.
                    duration: clip.duration * US_MULTIPLIER,
                    width: 1920, // Default assume 1080p
                    height: 1080,
                    category_name: "local"
                });
            } else if (track.type === TrackType.AUDIO) {
                materials.audios.push({
                    id: materialId,
                    type: "audio",
                    path: res ? res.url : "",
                    duration: clip.duration * US_MULTIPLIER
                });
            }

            // Create Segment
            const startUs = Math.round(clip.startOffset * US_MULTIPLIER);
            const durationUs = Math.round(clip.duration * US_MULTIPLIER);
            const srcStartUs = Math.round(clip.srcStart * US_MULTIPLIER);

            jyTrack.segments.push({
                id: generateId(),
                material_id: materialId,
                source_timerange: {
                    start: srcStartUs,
                    duration: durationUs
                },
                target_timerange: {
                    start: startUs,
                    duration: durationUs
                }
            });

            // Handle Transitions (Basic logic: if clip has transition, we'd add a transition object)
            // Note: JianYing transitions are usually separate segments or attached properties. 
            // For simple draft export, we focus on cuts.
            
            const endUs = startUs + durationUs;
            if (endUs > totalDuration) totalDuration = endUs;
        });

        if (jyTrack.segments.length > 0) {
            draftTracks.push(jyTrack);
        }
    });

    const draftContent = {
        canvas_config: {
            width: 1920,
            height: 1080,
            ratio: "16:9",
            pixel_ratio: 1
        },
        duration: totalDuration,
        materials: materials,
        tracks: draftTracks,
        version: 3 // Draft version
    };

    return JSON.stringify(draftContent, null, 2);
};

export const downloadDraft = (content: string, filename: string = 'draft_content.json') => {
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};
