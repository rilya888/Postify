/**
 * Component to display character count information
 */

import { CharacterCountInfo } from '@/types/editor';

interface CharacterCountDisplayProps {
  info: CharacterCountInfo;
}

export default function CharacterCountDisplay({ info }: CharacterCountDisplayProps) {
  const percentage = (info.current / info.max) * 100;
  let barColor = 'bg-green-500';
  
  if (percentage > 90) {
    barColor = 'bg-red-500';
  } else if (percentage > 75) {
    barColor = 'bg-yellow-500';
  }

  return (
    <div className="mt-2">
      <div className="flex justify-between text-sm mb-1">
        <span>
          {info.current} / {info.max} characters
        </span>
        {!info.isValid && (
          <span className="text-red-500">
            Limit exceeded
          </span>
        )}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${barColor}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        ></div>
      </div>
    </div>
  );
}