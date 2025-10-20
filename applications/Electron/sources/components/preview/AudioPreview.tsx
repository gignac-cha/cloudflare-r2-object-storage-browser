/**
 * Audio Preview Component
 * Displays audio files with playback controls
 * Uses react-player library
 */

import ReactPlayer from 'react-player';
import { useState, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Music } from 'lucide-react';

interface AudioPreviewProps {
  /** Audio source URL */
  src: string;
  /** Audio file name */
  fileName: string;
}

export function AudioPreview({ src, fileName }: AudioPreviewProps) {
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [played, setPlayed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [seeking, setSeeking] = useState(false);
  const playerRef = useRef<ReactPlayer>(null);

  const handlePlayPause = () => {
    setPlaying(!playing);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    setMuted(newVolume === 0);
  };

  const handleToggleMute = () => {
    setMuted(!muted);
  };

  const handleProgress = (state: { played: number; playedSeconds: number; loaded: number; loadedSeconds: number }) => {
    if (!seeking) {
      setPlayed(state.played);
    }
  };

  const handleSeekMouseDown = () => {
    setSeeking(true);
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPlayed(parseFloat(e.target.value));
  };

  const handleSeekMouseUp = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSeeking(false);
    playerRef.current?.seekTo(parseFloat(e.target.value));
  };

  const handleDuration = (duration: number) => {
    setDuration(duration);
  };

  const formatTime = (seconds: number): string => {
    const date = new Date(seconds * 1000);
    const hh = date.getUTCHours();
    const mm = date.getUTCMinutes();
    const ss = date.getUTCSeconds().toString().padStart(2, '0');
    if (hh) {
      return `${hh}:${mm.toString().padStart(2, '0')}:${ss}`;
    }
    return `${mm}:${ss}`;
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Hidden Player */}
      <div className="hidden">
        <ReactPlayer
          ref={playerRef}
          url={src}
          playing={playing}
          volume={volume}
          muted={muted}
          onProgress={handleProgress}
          onDuration={handleDuration}
          width="0"
          height="0"
        />
      </div>

      {/* Visual Display */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        {/* Audio Icon */}
        <div
          className={`mb-8 w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-2xl transition-transform ${
            playing ? 'scale-110 animate-pulse' : 'scale-100'
          }`}
        >
          <Music className="w-16 h-16 text-white" />
        </div>

        {/* File Name */}
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 text-center max-w-md truncate">
          {fileName}
        </h3>

        {/* Time Display */}
        <div className="text-sm text-gray-600 dark:text-gray-400 font-mono mb-8">
          {formatTime(duration * played)} / {formatTime(duration)}
        </div>

        {/* Progress Bar */}
        <div className="w-full max-w-md mb-8">
          <input
            type="range"
            min={0}
            max={0.999999}
            step="any"
            value={played}
            onMouseDown={handleSeekMouseDown}
            onChange={handleSeekChange}
            onMouseUp={handleSeekMouseUp}
            className="w-full h-2 bg-gray-300 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
            aria-label="Audio progress"
          />
          <div className="flex justify-between mt-2">
            <span className="text-xs text-gray-500 dark:text-gray-500 font-mono">
              {formatTime(duration * played)}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-500 font-mono">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-6">
          {/* Play/Pause Button */}
          <button
            onClick={handlePlayPause}
            className="p-4 rounded-full bg-blue-600 hover:bg-blue-700 transition-colors shadow-lg"
            title={playing ? 'Pause' : 'Play'}
            aria-label={playing ? 'Pause audio' : 'Play audio'}
          >
            {playing ? (
              <Pause className="w-6 h-6 text-white" />
            ) : (
              <Play className="w-6 h-6 text-white ml-0.5" />
            )}
          </button>

          {/* Volume Controls */}
          <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 rounded-full shadow-md">
            <button
              onClick={handleToggleMute}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title={muted ? 'Unmute' : 'Mute'}
              aria-label={muted ? 'Unmute audio' : 'Mute audio'}
            >
              {muted || volume === 0 ? (
                <VolumeX className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              ) : (
                <Volume2 className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.1}
              value={muted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-24 h-2 bg-gray-300 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              aria-label="Volume"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[36px]">
              {Math.round((muted ? 0 : volume) * 100)}%
            </span>
          </div>
        </div>
      </div>

      {/* Wave Animation (Visual Feedback) */}
      {playing && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-pulse" />
      )}

      <style>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .slider::-webkit-slider-thumb:hover {
          background: #2563eb;
          transform: scale(1.1);
        }

        .slider::-moz-range-thumb:hover {
          background: #2563eb;
          transform: scale(1.1);
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
}
