import { memo } from 'react';

interface HighlightTextProps {
  text: string;
  searchQuery: string;
  className?: string;
}

const HighlightText = memo<HighlightTextProps>(({ text, searchQuery, className = '' }) => {
  // If no search query, return plain text
  if (!searchQuery.trim()) {
    return <span className={className}>{text}</span>;
  }

  // Split text by search query (case insensitive)
  const parts = text.split(new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));

  return (
    <span className={className}>
      {parts.map((part, index) => {
        // Check if this part matches the search query (case insensitive)
        if (part.toLowerCase() === searchQuery.toLowerCase()) {
          return (
            <mark
              key={index}
              className="rounded-sm bg-yellow-200 px-1 py-0.5 font-medium text-yellow-900 dark:bg-yellow-400 dark:text-black">
              {part}
            </mark>
          );
        }
        return part;
      })}
    </span>
  );
});

HighlightText.displayName = 'HighlightText';

export default HighlightText;
