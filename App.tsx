
import React, { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { collection, query, onSnapshot, orderBy, where, getDocs, limit, startAfter, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { auth, db } from './services/firebase';
import { User, Question } from './types';

import Header from './components/Header';
import AuthModal from './components/AuthModal';
import QuestionModal from './components/QuestionModal';
import QuestionFeed from './components/QuestionFeed';
import QuestionView from './components/QuestionView';
import LoadingSpinner from './components/LoadingSpinner';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showQuestionModal, setShowQuestionModal] = useState(false);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [currentView, setCurrentView] = useState<'feed' | 'question'>('feed');
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
        });
      } else {
        setUser(null);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    setQuestionsLoading(true);
    const questionsRef = collection(db, 'questions');
    let q;
    if (searchTerm.trim() !== '') {
        // Firestore doesn't support full-text search natively. 
        // This is a basic prefix search. For real apps, use Algolia/Typesense.
        q = query(questionsRef, 
            where('title', '>=', searchTerm),
            where('title', '<=', searchTerm + '\uf8ff'),
            orderBy('title'),
            orderBy('timestamp', 'desc'));
    } else {
        q = query(questionsRef, orderBy('timestamp', 'desc'));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedQuestions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Question));
        setQuestions(fetchedQuestions);
        setQuestionsLoading(false);
    }, (error) => {
        console.error("Error fetching questions: ", error);
        setQuestionsLoading(false);
    });

    return () => unsubscribe();
  }, [searchTerm]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const handleAddQuestionClick = () => {
    if (user) {
      setShowQuestionModal(true);
    } else {
      setShowAuthModal(true);
    }
  };

  const handleQuestionSelect = (questionId: string) => {
    const question = questions.find(q => q.id === questionId);
    if (question) {
        setSelectedQuestion(question);
        setCurrentView('question');
    }
  };

  const handleBackToFeed = () => {
      setSelectedQuestion(null);
      setCurrentView('feed');
  };
  
  const handleSearch = useCallback((term: string) => {
      setSearchTerm(term);
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner className="w-20 h-20" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Header
        user={user}
        onLoginClick={() => setShowAuthModal(true)}
        onAddQuestionClick={handleAddQuestionClick}
        onLogout={handleLogout}
        onSearch={handleSearch}
        onLogoClick={handleBackToFeed}
      />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {currentView === 'feed' && (
          <QuestionFeed 
            questions={questions}
            isLoading={questionsLoading}
            onQuestionSelect={handleQuestionSelect}
            user={user}
          />
        )}
        {currentView === 'question' && selectedQuestion && (
            <QuestionView 
                question={selectedQuestion}
                user={user}
                onBack={handleBackToFeed}
                onLoginRequest={() => setShowAuthModal(true)}
            />
        )}
      </main>

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
      {showQuestionModal && user && <QuestionModal user={user} onClose={() => setShowQuestionModal(false)} />}
    </div>
  );
};

export default App;
