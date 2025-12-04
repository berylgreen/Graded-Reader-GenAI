import React from 'react';
import { VocabItem } from '../types';

interface VocabListProps {
  items: VocabItem[];
  type: 'target' | 'out-of-scope';
  title: string;
}

const VocabList: React.FC<VocabListProps> = ({ items, type, title }) => {
  const dotColor = type === 'target' ? 'bg-blue-500' : 'bg-orange-500';
  const wordColor = type === 'target' ? 'text-blue-700' : 'text-orange-700';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/50">
        <h4 className="flex items-center text-xs font-bold text-slate-500 uppercase tracking-wider">
          <span className={`w-2 h-2 rounded-full ${dotColor} mr-2`}></span>
          {title}
        </h4>
      </div>
      
      {items.length > 0 ? (
        <ul className="divide-y divide-slate-100">
          {items.map((item, i) => (
            <li key={i} className="px-4 py-2 hover:bg-slate-50 transition-colors">
              <div className="flex justify-between items-start">
                <div className="text-sm leading-snug">
                  <span className={`font-bold mr-2 ${wordColor}`}>
                    {item.word}
                  </span>
                  <span className="font-mono text-xs text-slate-500 mr-2 bg-slate-100 px-1.5 py-0.5 rounded inline-block">
                    {item.pronunciation}
                  </span>
                  <span className="text-slate-600">
                    {item.meaning}
                  </span>
                </div>
                {item.count !== undefined && item.count > 0 && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600" title={`Used ${item.count} times previously`}>
                    x{item.count}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="px-4 py-6 text-center">
          <p className="text-slate-400 text-xs italic">None found in this story.</p>
        </div>
      )}
    </div>
  );
};

export default VocabList;