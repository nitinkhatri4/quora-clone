
import React from 'react';
import { Question, User } from '../types';
import LoadingSpinner from './LoadingSpinner';

interface QuestionFeedProps {
  questions: Question[];
  isLoading: boolean;
  onQuestionSelect: (questionId: string) => void;
  user: User | null;
}

const QuestionCard: React.FC<{ question: Question; onQuestionSelect: (questionId: string) => void; }> = ({ question, onQuestionSelect }) => (
    <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-lg transition-shadow duration-200 border border-gray-200">
        <p className="text-sm text-gray-500">Posted by {question.authorName}</p>
        <h3 
            className="text-xl font-bold text-gray-800 mt-1 mb-3 cursor-pointer hover:text-primary-700"
            onClick={() => onQuestionSelect(question.id)}
        >
            {question.title}
        </h3>
        {question.body && <p className="text-gray-600 mb-4 line-clamp-2">{question.body}</p>}
        <div className="flex justify-between items-center text-sm text-gray-500">
            <button 
                onClick={() => onQuestionSelect(question.id)} 
                className="font-semibold text-primary-600 hover:text-primary-800"
            >
                {question.answerCount || 0} Answers
            </button>
            <p>{question.timestamp ? new Date(question.timestamp.toDate()).toLocaleDateString() : 'Just now'}</p>
        </div>
    </div>
);

const QuestionFeed: React.FC<QuestionFeedProps> = ({ questions, isLoading, onQuestionSelect }) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner className="w-16 h-16" />
      </div>
    );
  }

  if (questions.length === 0) {
    return (
        <div className="text-center py-16 px-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">No questions found</h3>
            <p className="mt-1 text-sm text-gray-500">
              There are no questions matching your search. Try asking one!
            </p>
        </div>
    );
  }

  return (
    <div className="space-y-4">
      {questions.map(q => (
        <QuestionCard key={q.id} question={q} onQuestionSelect={onQuestionSelect} />
      ))}
    </div>
  );
};

export default QuestionFeed;
