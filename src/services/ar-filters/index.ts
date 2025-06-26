/**
 * @file index.ts
 * @description Export all AR filter services
 */

export { ARFilterEngine, arFilterEngine } from './ARFilterEngine';
export { ScreenRecorder, screenRecorder } from './ScreenRecorder';

export type {
    FilterConfig,
    GamingFilterType,
    GamingOverlayConfig
} from './ARFilterEngine';

export type {
    RecordingOptions,
    RecordingResult
} from './ScreenRecorder';
