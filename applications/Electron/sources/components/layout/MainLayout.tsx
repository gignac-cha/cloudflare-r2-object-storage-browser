import React, { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import FileList from './FileList';
import TransferPanel from './TransferPanel';
import DebugPanel from './DebugPanel';

interface MainLayoutProps {
  serverStatus: {
    isRunning: boolean;
    port: number | null;
  };
  serverLogs: string[];
}

const MainLayout: React.FC<MainLayoutProps> = ({ serverStatus, serverLogs }) => {
  const [selectedBucket, setSelectedBucket] = useState<string | null>(null);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [isTransferPanelVisible, setIsTransferPanelVisible] = useState(true);
  const [isDebugPanelVisible, setIsDebugPanelVisible] = useState(false);

  // Split pane state
  const [sidebarWidth, setSidebarWidth] = useState(240);
  const [transferPanelHeight, setTransferPanelHeight] = useState(200);
  const [debugPanelHeight, setDebugPanelHeight] = useState(200);

  const handleBucketSelect = (bucketName: string) => {
    setSelectedBucket(bucketName);
    setCurrentPath('');
  };

  const handlePathChange = (path: string) => {
    setCurrentPath(path);
  };

  const toggleTransferPanel = () => {
    setIsTransferPanelVisible((prev) => !prev);
  };

  const toggleDebugPanel = () => {
    setIsDebugPanelVisible((prev) => !prev);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header - Fixed at top */}
      <Header
        serverStatus={serverStatus}
        onToggleTransferPanel={toggleTransferPanel}
        onToggleDebugPanel={toggleDebugPanel}
        isTransferPanelVisible={isTransferPanelVisible}
        isDebugPanelVisible={isDebugPanelVisible}
      />

      {/* Main Content Area - Horizontal Split */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Resizable */}
        <div
          className="relative flex-shrink-0 border-r border-gray-200 dark:border-gray-700"
          style={{ width: `${sidebarWidth}px` }}
        >
          <Sidebar
            selectedBucket={selectedBucket}
            onBucketSelect={handleBucketSelect}
            serverStatus={serverStatus}
          />

          {/* Resize Handle */}
          <div
            className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 transition-colors"
            onMouseDown={(e) => {
              e.preventDefault();
              const startX = e.clientX;
              const startWidth = sidebarWidth;

              const handleMouseMove = (moveEvent: MouseEvent) => {
                const delta = moveEvent.clientX - startX;
                const newWidth = Math.max(180, Math.min(400, startWidth + delta));
                setSidebarWidth(newWidth);
              };

              const handleMouseUp = () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
              };

              document.addEventListener('mousemove', handleMouseMove);
              document.addEventListener('mouseup', handleMouseUp);
            }}
          />
        </div>

        {/* Main Content - File List */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <FileList
            selectedBucket={selectedBucket}
            currentPath={currentPath}
            onPathChange={handlePathChange}
            serverStatus={serverStatus}
          />
        </div>
      </div>

      {/* Bottom Panels - Transfer Queue */}
      {isTransferPanelVisible && (
        <div
          className="relative border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
          style={{ height: `${transferPanelHeight}px` }}
        >
          <TransferPanel />

          {/* Resize Handle */}
          <div
            className="absolute top-0 left-0 right-0 h-1 cursor-row-resize hover:bg-blue-500 transition-colors"
            onMouseDown={(e) => {
              e.preventDefault();
              const startY = e.clientY;
              const startHeight = transferPanelHeight;

              const handleMouseMove = (moveEvent: MouseEvent) => {
                const delta = startY - moveEvent.clientY;
                const newHeight = Math.max(120, Math.min(500, startHeight + delta));
                setTransferPanelHeight(newHeight);
              };

              const handleMouseUp = () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
              };

              document.addEventListener('mousemove', handleMouseMove);
              document.addEventListener('mouseup', handleMouseUp);
            }}
          />
        </div>
      )}

      {/* Bottom Panels - Debug Panel */}
      {isDebugPanelVisible && (
        <div
          className="relative border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
          style={{ height: `${debugPanelHeight}px` }}
        >
          <DebugPanel serverLogs={serverLogs} />

          {/* Resize Handle */}
          <div
            className="absolute top-0 left-0 right-0 h-1 cursor-row-resize hover:bg-blue-500 transition-colors"
            onMouseDown={(e) => {
              e.preventDefault();
              const startY = e.clientY;
              const startHeight = debugPanelHeight;

              const handleMouseMove = (moveEvent: MouseEvent) => {
                const delta = startY - moveEvent.clientY;
                const newHeight = Math.max(120, Math.min(500, startHeight + delta));
                setDebugPanelHeight(newHeight);
              };

              const handleMouseUp = () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
              };

              document.addEventListener('mousemove', handleMouseMove);
              document.addEventListener('mouseup', handleMouseUp);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default MainLayout;
