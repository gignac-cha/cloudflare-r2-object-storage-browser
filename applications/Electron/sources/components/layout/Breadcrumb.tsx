import React, { useRef, useEffect } from 'react';
import { Home, ChevronRight } from 'lucide-react';
import { useBucketStore } from '../../stores/useBucketStore';
import { useFileStore } from '../../stores/useFileStore';

export const Breadcrumb: React.FC = () => {
  const { selectedBucket } = useBucketStore();
  const { currentPath, navigateToPath } = useFileStore();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the end when path changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft =
        scrollContainerRef.current.scrollWidth;
    }
  }, [currentPath]);

  if (!selectedBucket) {
    return (
      <div className="flex items-center border-b border-gray-200 bg-gray-50 px-4 py-2.5 dark:border-gray-700 dark:bg-gray-900">
        <span className="text-sm text-gray-500 dark:text-gray-400">
          No bucket selected
        </span>
      </div>
    );
  }

  const pathSegments = currentPath
    .split('/')
    .filter(Boolean)
    .map((segment, index, array) => {
      const path = array.slice(0, index + 1).join('/');
      return { name: segment, path };
    });

  const handleSegmentClick = (path: string) => {
    navigateToPath(path);
  };

  const handleHomeClick = () => {
    navigateToPath('');
  };

  return (
    <div className="flex items-center border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      <div
        ref={scrollContainerRef}
        className="flex flex-1 items-center gap-1 overflow-x-auto px-4 py-2.5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600"
      >
        {/* Home / Bucket root */}
        <BreadcrumbSegment
          icon={Home}
          label={selectedBucket.name}
          onClick={handleHomeClick}
          isFirst
        />

        {/* Path segments */}
        {pathSegments.map((segment, index) => (
          <React.Fragment key={segment.path}>
            <ChevronRight className="h-4 w-4 flex-shrink-0 text-gray-400 dark:text-gray-500" />
            <BreadcrumbSegment
              label={segment.name}
              onClick={() => handleSegmentClick(segment.path)}
              isLast={index === pathSegments.length - 1}
            />
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

interface BreadcrumbSegmentProps {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  isFirst?: boolean;
  isLast?: boolean;
}

const BreadcrumbSegment: React.FC<BreadcrumbSegmentProps> = ({
  icon: Icon,
  label,
  onClick,
  isFirst = false,
  isLast = false,
}) => {
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`group flex items-center gap-1.5 rounded-md px-2 py-1 font-mono text-sm transition-all ${
        isLast
          ? 'cursor-default bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
          : 'cursor-pointer text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-gray-100'
      }`}
      disabled={isLast}
      aria-current={isLast ? 'page' : undefined}
      title={label}
    >
      {Icon && (
        <Icon
          className={`h-4 w-4 flex-shrink-0 ${
            isLast
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-gray-500 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-gray-200'
          }`}
        />
      )}
      <span
        className={`max-w-[200px] truncate ${
          isFirst ? 'font-semibold' : 'font-medium'
        }`}
      >
        {label}
      </span>
    </button>
  );
};
