import { memo } from 'react';

interface CenteredContainerProps {
  children: React.ReactNode;
}

const CenteredContainer = memo<CenteredContainerProps>(({ children }) => (
  <div className="flex h-32 items-center justify-center">{children}</div>
));

CenteredContainer.displayName = 'CenteredContainer';

export default CenteredContainer;
