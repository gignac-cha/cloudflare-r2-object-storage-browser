import { create } from 'zustand';
import { TransferTask, TransferType, TransferStatus } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface TransferState {
  activeTasks: TransferTask[];
  completedTasks: TransferTask[];
  failedTasks: TransferTask[];
  maxConcurrentUploads: number;
  maxConcurrentDownloads: number;
  autoRetryOnFailure: boolean;
  maxRetryAttempts: number;
}

interface TransferActions {
  addUploadTask: (task: Omit<TransferTask, 'id' | 'createdAt' | 'status' | 'transferredSize' | 'speed' | 'progress' | 'progressPercentage'>) => string;
  addDownloadTask: (task: Omit<TransferTask, 'id' | 'createdAt' | 'status' | 'transferredSize' | 'speed' | 'progress' | 'progressPercentage'>) => string;
  addDeleteTask: (task: Omit<TransferTask, 'id' | 'createdAt' | 'status' | 'transferredSize' | 'speed' | 'progress' | 'progressPercentage'>) => string;
  updateTaskProgress: (id: string, transferredSize: number, speed: number) => void;
  updateTaskStatus: (id: string, status: TransferStatus, error?: string) => void;
  pauseTransfer: (id: string) => void;
  resumeTransfer: (id: string) => void;
  cancelTransfer: (id: string) => void;
  retryTransfer: (id: string) => void;
  clearCompletedTasks: () => void;
  clearFailedTasks: () => void;
  removeTask: (id: string) => void;
}

export const useTransferStore = create<TransferState & TransferActions>((set, get) => ({
  // State
  activeTasks: [],
  completedTasks: [],
  failedTasks: [],
  maxConcurrentUploads: 3,
  maxConcurrentDownloads: 5,
  autoRetryOnFailure: true,
  maxRetryAttempts: 1,

  // Actions
  addUploadTask: (task) => {
    const id = uuidv4();
    const newTask: TransferTask = {
      ...task,
      id,
      createdAt: new Date(),
      status: TransferStatus.QUEUED,
      transferredSize: 0,
      speed: 0,
      progress: 0,
      progressPercentage: 0,
    };

    set((state) => ({
      activeTasks: [...state.activeTasks, newTask],
    }));

    return id;
  },

  addDownloadTask: (task) => {
    const id = uuidv4();
    const newTask: TransferTask = {
      ...task,
      id,
      createdAt: new Date(),
      status: TransferStatus.QUEUED,
      transferredSize: 0,
      speed: 0,
      progress: 0,
      progressPercentage: 0,
    };

    set((state) => ({
      activeTasks: [...state.activeTasks, newTask],
    }));

    return id;
  },

  addDeleteTask: (task) => {
    const id = uuidv4();
    const newTask: TransferTask = {
      ...task,
      id,
      createdAt: new Date(),
      status: TransferStatus.QUEUED,
      transferredSize: 0,
      speed: 0,
      progress: 0,
      progressPercentage: 0,
    };

    set((state) => ({
      activeTasks: [...state.activeTasks, newTask],
    }));

    return id;
  },

  updateTaskProgress: (id, transferredSize, speed) => {
    set((state) => ({
      activeTasks: state.activeTasks.map((task) => {
        if (task.id === id) {
          const progress = task.totalSize > 0 ? transferredSize / task.totalSize : 0;
          return {
            ...task,
            transferredSize,
            speed,
            progress,
            progressPercentage: Math.round(progress * 100),
          };
        }
        return task;
      }),
    }));
  },

  updateTaskStatus: (id, status, error) => {
    set((state) => {
      const task = state.activeTasks.find((t) => t.id === id);
      if (!task) return state;

      const updatedTask = {
        ...task,
        status,
        error,
        ...(status === TransferStatus.COMPLETED && { completedAt: new Date() }),
        ...(status === TransferStatus.UPLOADING || status === TransferStatus.DOWNLOADING || status === TransferStatus.DELETING) && !task.startedAt && { startedAt: new Date() },
      };

      if (status === TransferStatus.COMPLETED) {
        return {
          activeTasks: state.activeTasks.filter((t) => t.id !== id),
          completedTasks: [...state.completedTasks, updatedTask].slice(-50), // Keep last 50
        };
      } else if (status === TransferStatus.FAILED || status === TransferStatus.CANCELLED) {
        return {
          activeTasks: state.activeTasks.filter((t) => t.id !== id),
          failedTasks: [...state.failedTasks, updatedTask].slice(-50), // Keep last 50
        };
      } else {
        return {
          activeTasks: state.activeTasks.map((t) => (t.id === id ? updatedTask : t)),
        };
      }
    });
  },

  pauseTransfer: (id) => {
    get().updateTaskStatus(id, TransferStatus.PAUSED);
  },

  resumeTransfer: (id) => {
    set((state) => ({
      activeTasks: state.activeTasks.map((task) => {
        if (task.id === id && task.status === TransferStatus.PAUSED) {
          return { ...task, status: TransferStatus.QUEUED };
        }
        return task;
      }),
    }));
  },

  cancelTransfer: (id) => {
    get().updateTaskStatus(id, TransferStatus.CANCELLED);
  },

  retryTransfer: (id) => {
    set((state) => {
      const failedTask = state.failedTasks.find((t) => t.id === id);
      if (!failedTask) return state;

      const retriedTask: TransferTask = {
        ...failedTask,
        id: uuidv4(), // New ID for retry
        status: TransferStatus.QUEUED,
        transferredSize: 0,
        speed: 0,
        progress: 0,
        progressPercentage: 0,
        error: undefined,
        createdAt: new Date(),
        startedAt: undefined,
        completedAt: undefined,
      };

      return {
        failedTasks: state.failedTasks.filter((t) => t.id !== id),
        activeTasks: [...state.activeTasks, retriedTask],
      };
    });
  },

  clearCompletedTasks: () => {
    set({ completedTasks: [] });
  },

  clearFailedTasks: () => {
    set({ failedTasks: [] });
  },

  removeTask: (id) => {
    set((state) => ({
      activeTasks: state.activeTasks.filter((t) => t.id !== id),
      completedTasks: state.completedTasks.filter((t) => t.id !== id),
      failedTasks: state.failedTasks.filter((t) => t.id !== id),
    }));
  },
}));
