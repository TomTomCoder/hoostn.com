'use client';

import { Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ConfidenceBadgeProps {
  confidence: number;
}

export function ConfidenceBadge({ confidence }: ConfidenceBadgeProps) {
  const percentage = Math.round(confidence * 100);

  // Determine color based on confidence
  let colorClass = 'bg-red-100 text-red-800 border-red-300';
  let label = 'Low Confidence';

  if (confidence >= 0.8) {
    colorClass = 'bg-green-100 text-green-800 border-green-300';
    label = 'High Confidence';
  } else if (confidence >= 0.7) {
    colorClass = 'bg-yellow-100 text-yellow-800 border-yellow-300';
    label = 'Medium Confidence';
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border ${colorClass} cursor-help`}
          >
            <Info className="h-3 w-3" />
            <span>{percentage}% confidence</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="font-semibold mb-1">{label}</p>
          <p className="text-xs">
            {confidence >= 0.8 && (
              'This response is highly confident and should be accurate based on available information.'
            )}
            {confidence >= 0.7 && confidence < 0.8 && (
              'This response has medium confidence. The information should be generally accurate but may need verification.'
            )}
            {confidence < 0.7 && (
              'This response has low confidence. The property owner has been notified to review and follow up.'
            )}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
