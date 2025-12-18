import React from 'react';
import { AiOutlineWarning } from 'react-icons/ai';
import type { ErrorStateProps } from '../types/sidePanel';
import { ERROR_MESSAGES, UI_TEXT } from '../constants/sidePanel';

const ErrorState: React.FC<ErrorStateProps> = ({ error, onRetry }) => {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <AiOutlineWarning className="mb-4 text-4xl text-gray-500 dark:text-gray-400" />
      <div className="mb-2 text-center text-gray-500 dark:text-gray-300">{ERROR_MESSAGES.SOMETHING_WRONG}</div>
      <div className="mb-2 text-center text-sm text-gray-400 dark:text-gray-400">{ERROR_MESSAGES.LOADING_TROUBLE}</div>
      <div className="mb-4 text-center text-xs text-red-500 dark:text-red-400">{error}</div>
      <button
        onClick={onRetry}
        className="rounded bg-slate-500 px-4 py-2 text-white hover:bg-slate-600 dark:bg-gray-600 dark:hover:bg-gray-500">
        {UI_TEXT.TRY_AGAIN}
      </button>
    </div>
  );
};

export default ErrorState;
