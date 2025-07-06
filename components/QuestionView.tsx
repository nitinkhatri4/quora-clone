
import React, { useState, useEffect, useCallback } from 'react';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, increment, getDoc, runTransaction } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Question, Answer, User } from '../types';
import LoadingSpinner from './LoadingSpinner';
import { generateAnswerWithGemini } from '../services/geminiService';

interface QuestionViewProps {
  question: Question;
  user: User | null;
  onBack: () => void;
  onLoginRequest: () => void;
}

const VoteIcon: React.FC<{ type: 'up' | 'down', filled: boolean }> = ({ type, filled }) => {
    const path = type === 'up' ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7";
    const color = filled ? (type === 'up' ? 'text-green-500' : 'text-red-500') : 'text-gray-400';
    return (
        <svg xmlns="http://www.w3.org/2000/svg" className={`w-6 h-6 ${color} hover:text-gray-600`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d={path} />
        </svg>
    );
};

const AnswerCard: React.FC<{ answer: Answer, user: User | null, onVote: (answerId: string, voteType: 'up' | 'down') => void }> = ({ answer, user, onVote }) => {
    const userVote = user ? answer.votedBy?.[user.uid] : undefined;
    
    return (
        <div className={`p-4 rounded-lg flex space-x-4 ${answer.authorId === 'gemini-ai' ? 'bg-primary-50 border-l-4 border-primary-400' : 'bg-white border'}`}>
            <div className="flex flex-col items-center space-y-1">
                <button onClick={() => onVote(answer.id, 'up')} disabled={!user}>
                    <VoteIcon type="up" filled={userVote === 'up'} />
                </button>
                <span className="font-bold text-lg text-gray-700">{answer.upvotes - answer.downvotes}</span>
                <button onClick={() => onVote(answer.id, 'down')} disabled={!user}>
                    <VoteIcon type="down" filled={userVote === 'down'} />
                </button>
            </div>
            <div className="flex-1">
                <p className="text-gray-800 whitespace-pre-wrap">{answer.body}</p>
                <div className="text-sm text-gray-500 mt-4 flex justify-end items-center">
                    <span>
                        {answer.authorId === 'gemini-ai' ? 
                            <span className="font-bold text-primary-600">Gemini AI</span> : 
                            answer.authorName
                        }
                    </span>
                    <span className="mx-2">&middot;</span>
                    <span>{answer.timestamp ? new Date(answer.timestamp.toDate()).toLocaleDateString() : 'Just now'}</span>
                </div>
            </div>
        </div>
    );
};


const QuestionView: React.FC<QuestionViewProps> = ({ question, user, onBack, onLoginRequest }) => {
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newAnswer, setNewAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    const q = query(collection(db, 'answers'), where('questionId', '==', question.id));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const answersData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Answer));
      answersData.sort((a, b) => (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes));
      setAnswers(answersData);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [question.id]);

  const handleAnswerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
        onLoginRequest();
        return;
    }
    if (newAnswer.trim().length < 15) return;
    setIsSubmitting(true);
    try {
        const answerData = {
            questionId: question.id,
            body: newAnswer,
            authorId: user.uid,
            authorName: user.displayName || user.email,
            timestamp: serverTimestamp(),
            upvotes: 0,
            downvotes: 0,
            votedBy: {},
        };
        await addDoc(collection(db, 'answers'), answerData);

        const questionRef = doc(db, 'questions', question.id);
        await updateDoc(questionRef, {
            answerCount: increment(1)
        });
        setNewAnswer('');
    } catch (error) {
        console.error("Error adding answer: ", error);
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleVote = useCallback(async (answerId: string, voteType: 'up' | 'down') => {
      if (!user) {
        onLoginRequest();
        return;
      }

      const answerRef = doc(db, "answers", answerId);
      try {
        await runTransaction(db, async (transaction) => {
            const answerDoc = await transaction.get(answerRef);
            if (!answerDoc.exists()) {
                throw "Document does not exist!";
            }

            const data = answerDoc.data() as Answer;
            const currentVote = data.votedBy?.[user.uid];

            let upvoteIncrement = 0;
            let downvoteIncrement = 0;
            const newVotedBy = { ...(data.votedBy || {}) };

            if (currentVote === voteType) { // Undoing vote
                if (voteType === 'up') upvoteIncrement = -1;
                else downvoteIncrement = -1;
                delete newVotedBy[user.uid];
            } else if (currentVote) { // Changing vote
                if (voteType === 'up') {
                    upvoteIncrement = 1;
                    downvoteIncrement = -1;
                } else {
                    upvoteIncrement = -1;
                    downvoteIncrement = 1;
                }
                newVotedBy[user.uid] = voteType;
            } else { // New vote
                if (voteType === 'up') upvoteIncrement = 1;
                else downvoteIncrement = 1;
                newVotedBy[user.uid] = voteType;
            }

            transaction.update(answerRef, {
                upvotes: increment(upvoteIncrement),
                downvotes: increment(downvoteIncrement),
                votedBy: newVotedBy
            });
        });
      } catch (e) {
        console.error("Vote transaction failed: ", e);
      }
  }, [user, onLoginRequest]);

  const handleAIGenerate = async () => {
    setIsGeneratingAI(true);
    try {
        const aiAnswerBody = await generateAnswerWithGemini(question.title);
        const aiAnswerData = {
            questionId: question.id,
            body: aiAnswerBody,
            authorId: 'gemini-ai',
            authorName: 'Gemini AI',
            timestamp: serverTimestamp(),
            upvotes: 0,
            downvotes: 0,
            votedBy: {},
        };
        await addDoc(collection(db, 'answers'), aiAnswerData);
        const questionRef = doc(db, 'questions', question.id);
        await updateDoc(questionRef, {
            answerCount: increment(1)
        });

    } catch (error) {
        console.error("Error generating AI answer:", error);
    } finally {
        setIsGeneratingAI(false);
    }
  };

  return (
    <div>
      <button onClick={onBack} className="flex items-center text-sm text-primary-600 font-semibold mb-4 hover:text-primary-800">
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
        Back to all questions
      </button>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{question.title}</h1>
        <p className="text-sm text-gray-500 mt-2">Asked by {question.authorName} on {question.timestamp ? new Date(question.timestamp.toDate()).toLocaleDateString() : ''}</p>
        {question.body && <p className="mt-4 text-gray-700 whitespace-pre-wrap">{question.body}</p>}
      </div>

      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">{answers.length} Answers</h2>
        <button onClick={handleAIGenerate} disabled={isGeneratingAI} className="bg-indigo-100 text-indigo-700 font-semibold px-4 py-2 rounded-full hover:bg-indigo-200 transition duration-200 disabled:bg-indigo-50 disabled:text-indigo-300 flex items-center">
            {isGeneratingAI ? <LoadingSpinner className="w-5 h-5 mr-2" /> : 
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 00-1 1v1.333A6.992 6.992 0 003 10a1 1 0 102 0 5 5 0 015-5 1 1 0 00-1-1zM10 17a1 1 0 001-1v-1.333a6.992 6.992 0 007-5.667 1 1 0 10-2 0 5 5 0 01-5 5 1 1 0 001 1z" clipRule="evenodd" />
                </svg>
            }
            {isGeneratingAI ? 'Generating...' : 'Get AI Insight'}
        </button>
      </div>

      <div className="space-y-4 mb-8">
        {isLoading ? <LoadingSpinner className="mx-auto" /> : answers.map(ans => <AnswerCard key={ans.id} answer={ans} user={user} onVote={handleVote} />)}
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="font-bold text-lg mb-4">Your Answer</h3>
        <form onSubmit={handleAnswerSubmit}>
            <textarea
                value={newAnswer}
                onChange={(e) => setNewAnswer(e.target.value)}
                placeholder="Write your answer here..."
                rows={6}
                className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                disabled={!user}
            ></textarea>
            {!user && <p className="text-sm text-red-500 mt-2">Please <button type="button" onClick={onLoginRequest} className="underline font-semibold">login</button> to post an answer.</p>}
            <button type="submit" disabled={isSubmitting || !user || newAnswer.trim().length < 15} className="mt-4 bg-primary-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-700 transition duration-300 disabled:bg-primary-300 flex items-center">
                {isSubmitting && <LoadingSpinner className="w-5 h-5 mr-2"/>}
                Post Your Answer
            </button>
        </form>
      </div>
    </div>
  );
};

export default QuestionView;
