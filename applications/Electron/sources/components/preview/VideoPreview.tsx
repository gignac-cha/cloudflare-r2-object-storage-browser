/**
 * Video Preview Component
 * Displays video files with playback controls
 * Uses react-player library
 */

import ReactPlayer from 'react-player';
import { useState, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize2 } from 'lucide-react';

interface VideoPreviewProps {
  /** Video source URL */
  src: string;
  /** Video file name */
  fileName: string;
}

export function VideoPreview({ src, fileName }: VideoPreviewProps) {
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

  const handleFullscreen = () => {
    const playerElement = playerRef.current?.wrapper;
    if (playerElement) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        playerElement.requestFullscreen();
      }
    }
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
    <div className="relative flex flex-col h-full bg-gray-900">
      {/* Video Player Container */}
      <div className="flex-1 flex items-center justify-center bg-black">
        <div className="relative w-full h-full">
          <ReactPlayer
            ref={playerRef}
            url={src}
            playing={playing}
            volume={volume}
            muted={muted}
            onProgress={handleProgress}
            onDuration={handleDuration}
            width="100%"
            height="100%"
            style={{ maxHeight: '100%' }}
            config={{
              file: {
                attributes: {
                  controlsList: 'nodownload',
                },
              },
            }}
          />
        </div>
      </div>

      {/* Custom Controls */}
      <div className="bg-gray-800 p-4 space-y-3">
        {/* Progress Bar */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400 font-mono min-w-[48px]">
            {formatTime(duration * played)}
          </span>
          <input
            type="range"
            min={0}
            max={0.999999}
            step="any"
            value={played}
            onMouseDown={handleSeekMouseDown}
            onChange={handleSeekChange}
            onMouseUp={handleSeekMouseUp}
            className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
            aria-label="Video progress"
          />
          <span className="text-xs text-gray-400 font-mono min-w-[48px]">
            {formatTime(duration)}
          </span>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Play/Pause Button */}
            <button
              onClick={handlePlayPause}
              className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
              title={playing ? 'Pause' : 'Play'}
              aria-label={playing ? 'Pause video' : 'Play video'}
            >
              {playing ? (
                <Pause className="w-5 h-5 text-white" />
              ) : (
                <Play className="w-5 h-5 text-white" />
              )}
            </button>

            {/* Volume Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleMute}
                className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
                title={muted ? 'Unmute' : 'Mute'}
                aria-label={muted ? 'Unmute video' : 'Mute video'}
              >
                {muted || volume === 0 ? (
                  <VolumeX className="w-5 h-5 text-white" />
                ) : (
                  <Volume2 className="w-5 h-5 text-white" />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.1}
                value={muted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-24 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                aria-label="Volume"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* File Name */}
            <span className="text-sm text-gray-400 truncate max-w-xs">
              {fileName}
            </span>

            {/* Fullscreen Button */}
            <button
              onClick={handleFullscreen}
              className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
              title="Fullscreen"
              aria-label="Enter fullscreen"
            >
              <Maximize2 className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
        }

        .slider::-moz-range-thumb {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: none;
        }

        .slider::-webkit-slider-thumb:hover {
          background: #2563eb;
        }

        .slider::-moz-range-thumb:hover {
          background: #2563eb;
        }
      `}</style>
    </div>
  );
}
