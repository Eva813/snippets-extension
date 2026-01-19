import React from 'react';
import type { LoadingStateProps } from '../types/sidePanel';
import { LOADING_MESSAGES } from '../constants/sidePanel';

const LoadingState: React.FC<LoadingStateProps> = ({ message = LOADING_MESSAGES.LOADING_PROMPTS }) => {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="text-gray-500 dark:text-gray-300">{message}</div>
    </div>
  );
};

export default LoadingState;
