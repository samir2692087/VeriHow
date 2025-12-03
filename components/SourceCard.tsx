import React from 'react';
import { ExternalLink, Globe } from 'lucide-react';
import { GroundingChunk } from '../types';

interface SourceCardProps {
  chunk: GroundingChunk;
  index: number;
}

const SourceCard: React.FC<SourceCardProps> = ({ chunk, index }) => {
  if (!chunk.web) return null;

  return (
    <a 
      href={chunk.web.uri}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center p-3 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 hover:border-blue-500/50 rounded-lg transition-all group"
    >
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center mr-3 group-hover:bg-blue-900/30 group-hover:text-blue-400 transition-colors">
        <Globe size={16} />
      </div>
      <div className="flex-grow min-w-0">
        <h4 className="text-sm font-medium text-slate-200 truncate pr-2">
          {chunk.web.title || "Unknown Source"}
        </h4>
        <p className="text-xs text-slate-400 truncate">
          {chunk.web.uri}
        </p>
      </div>
      <ExternalLink size={14} className="text-slate-500 group-hover:text-blue-400 flex-shrink-0" />
    </a>
  );
};

export default SourceCard;