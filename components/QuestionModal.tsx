
import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { User } from '../types';
import LoadingSpinner from './LoadingSpinner';

interface QuestionModalProps {
  user: User;
  onClose: () => void;
}

const QuestionModal: React.FC<QuestionModalProps> = ({ user, onClose }) => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim().length < 10) {
      setError('Question title must be at least 10 characters long.');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      await addDoc(collection(db, 'questions'), {
        title: title.trim(),
        body: body.trim(),
        authorId: user.uid,
        authorName: user.displayName || user.email,
        timestamp: serverTimestamp(),
        answerCount: 0,
      });
      onClose();
    } catch (err) {
      console.error("Error adding document: ", err);
      setError('Failed to post question. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-2xl relative transform transition-all duration-300 scale-95 animate-scale-in">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Ask a Public Question</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="title">
              Title
              <p className="font-normal text-xs text-gray-500">Be specific and imagine you’re asking a question to another person.</p>
            </label>
            <input 
              id="title" 
              type="text" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              placeholder="e.g. How does React's virtual DOM work?"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" required 
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="body">
              Body (Optional)
              <p className="font-normal text-xs text-gray-500">Include all the information someone would need to answer your question.</p>
            </label>
            <textarea 
              id="body" 
              value={body} 
              onChange={(e) => setBody(e.target.value)} 
              rows={6}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            ></textarea>
          </div>
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <div className="flex justify-end">
            <button type="button" onClick={onClose} className="text-gray-600 font-bold py-2 px-4 rounded-lg mr-2">Cancel</button>
            <button type="submit" disabled={loading} className="bg-primary-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-700 transition duration-300 disabled:bg-primary-300 flex items-center justify-center">
              {loading ? <LoadingSpinner className="w-6 h-6" /> : 'Post Your Question'}
            </button>
          </div>
        </form>
      </div>
       <style>{`
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-scale-in { animation: scale-in 0.2s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default QuestionModal;
