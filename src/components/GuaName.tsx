import React from 'react';
import { Trigram, getGuaName } from '../utils/guaData';

interface GuaNameProps {
  trigrams: Trigram[];
}

const GuaName: React.FC<GuaNameProps> = ({ trigrams }) => {
  if (trigrams.length < 6) {
    return (
      <div className="text-center text-amber-700 p-4">
        <p className="text-lg">继续起卦，完成6爻...</p>
        <p className="text-sm mt-2">({trigrams.length}/6)</p>
      </div>
    );
  }

  const guaName = getGuaName(trigrams);

  return (
    <div className="text-center p-6 bg-gradient-to-r from-amber-200 to-amber-300 rounded-lg shadow-lg border-2 border-amber-500">
      <p className="text-amber-800 text-sm mb-2">本卦</p>
      <h3 className="text-4xl font-bold text-amber-900">{guaName}</h3>
    </div>
  );
};

export default GuaName;
