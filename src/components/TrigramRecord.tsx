import React from 'react';
import { Trigram } from '../utils/guaData';

interface TrigramRecordProps {
  trigrams: Trigram[];
}

const TrigramRecord: React.FC<TrigramRecordProps> = ({ trigrams }) => {
  const renderYao = (trigram: Trigram | null, index: number) => {
    if (!trigram) {
      return (
        <div key={index} className="flex items-center justify-center h-16 opacity-30">
          <div className="w-24 h-1 bg-gray-600 rounded"></div>
        </div>
      );
    }

    const isYang = trigram.yinYang === 'yang';

    return (
      <div key={index} className="flex items-center justify-center h-16 animate-pulse">
        <div className="relative flex items-center">
          {isYang ? (
            <div className="w-24 h-2 bg-amber-500 rounded"></div>
          ) : (
            <div className="flex gap-4">
              <div className="w-10 h-2 bg-gray-300 rounded"></div>
              <div className="w-10 h-2 bg-gray-300 rounded"></div>
            </div>
          )}

          {trigram.changing && (
            <div className="absolute -right-8">
              {trigram.yinYang === 'yang' ? (
                <div className="w-6 h-6 border-2 border-red-500 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                </div>
              ) : (
                <div className="w-6 h-6 flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="green" strokeWidth="3">
                    <line x1="4" y1="4" x2="20" y2="20"></line>
                    <line x1="20" y1="4" x2="4" y2="20"></line>
                  </svg>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const displayTrigrams = [...trigrams];
  while (displayTrigrams.length < 6) {
    displayTrigrams.push(null);
  }
  const reversedTrigrams = [...displayTrigrams].reverse();

  return (
    <div className="w-64 p-6 bg-gradient-to-b from-amber-50 to-amber-100 border-l-4 border-amber-600">
      <h2 className="text-2xl font-bold text-amber-800 mb-6 text-center">爻记录</h2>
      <div className="flex flex-col gap-2">
        {reversedTrigrams.map((trigram, index) => renderYao(trigram, index))}
      </div>
    </div>
  );
};

export default TrigramRecord;
