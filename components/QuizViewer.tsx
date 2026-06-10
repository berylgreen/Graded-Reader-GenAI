import React, { useState } from 'react';
import { QuizQuestion } from '../types';

interface QuizViewerProps {
  quiz: QuizQuestion[];
}

const QuizViewer: React.FC<QuizViewerProps> = ({ quiz }) => {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);

  if (!quiz || quiz.length === 0) return null;

  const handleSelect = (qIndex: number, option: string) => {
    if (showResults) return;
    setSelectedAnswers(prev => ({ ...prev, [qIndex]: option }));
  };

  const handleSubmit = () => {
    setShowResults(true);
  };

  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-slate-100 mt-8">
      <div className="bg-brand-50 px-8 py-4 border-b border-brand-100">
        <h3 className="text-xl font-bold text-slate-800">Reading Comprehension</h3>
        <p className="text-sm text-slate-600">Test your understanding of the story</p>
      </div>
      
      <div className="px-8 py-6 space-y-8">
        {quiz.map((q, qIndex) => {
          const isCorrect = selectedAnswers[qIndex] === q.answer;
          
          return (
            <div key={qIndex} className="space-y-3">
              <h4 className="font-semibold text-slate-800 text-lg">
                {qIndex + 1}. {q.question}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {q.options.map((opt, oIndex) => {
                  const isSelected = selectedAnswers[qIndex] === opt;
                  const isActuallyCorrect = opt === q.answer;
                  
                  let btnClass = "text-left px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none ";
                  
                  if (!showResults) {
                    btnClass += isSelected 
                      ? "border-brand-500 bg-brand-50 text-brand-700 font-medium" 
                      : "border-slate-200 bg-white text-slate-600 hover:border-brand-300 hover:bg-slate-50";
                  } else {
                    if (isActuallyCorrect) {
                      btnClass += "border-green-500 bg-green-50 text-green-700 font-medium";
                    } else if (isSelected && !isActuallyCorrect) {
                      btnClass += "border-red-500 bg-red-50 text-red-700 font-medium";
                    } else {
                      btnClass += "border-slate-200 bg-slate-50 text-slate-400 opacity-60";
                    }
                  }

                  return (
                    <button
                      key={oIndex}
                      onClick={() => handleSelect(qIndex, opt)}
                      disabled={showResults}
                      className={btnClass}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
              {showResults && (
                <div className={`text-sm font-medium ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                  {isCorrect ? '✓ Correct!' : `✗ Incorrect. The answer is: ${q.answer}`}
                </div>
              )}
            </div>
          );
        })}

        {!showResults ? (
          <button
            onClick={handleSubmit}
            disabled={Object.keys(selectedAnswers).length < quiz.length}
            className="w-full mt-4 py-3 rounded-xl font-bold text-white bg-brand-600 hover:bg-brand-700 disabled:bg-slate-300 transition-colors shadow-sm"
          >
            Check Answers
          </button>
        ) : (
          <div className="w-full mt-4 py-3 rounded-xl font-bold text-center bg-slate-100 text-slate-600">
            Score: {Object.values(selectedAnswers).filter((ans, i) => ans === quiz[i].answer).length} / {quiz.length}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizViewer;
