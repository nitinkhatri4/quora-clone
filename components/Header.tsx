
import React from 'react';
import { User } from '../types';

interface HeaderProps {
  user: User | null;
  onLoginClick: () => void;
  onAddQuestionClick: () => void;
  onLogout: () => void;
  onSearch: (term: string) => void;
  onLogoClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLoginClick, onAddQuestionClick, onLogout, onSearch, onLogoClick }) => {
  return (
    <header className="bg-white shadow-md sticky top-0 z-40">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h1 onClick={onLogoClick} className="text-2xl font-bold text-red-800 cursor-pointer">Quora</h1>
          <div className="relative hidden md:block">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"></path>
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search questions"
              onChange={(e) => onSearch(e.target.value)}
              className="bg-gray-100 focus:bg-white border border-gray-200 focus:border-primary-400 focus:ring focus:ring-primary-200 focus:ring-opacity-50 rounded-full py-2 pl-10 pr-4 transition duration-200"
            />
          </div>
        </div>
        <div className="flex items-center space-x-2 sm:space-x-4">
          <button
            onClick={onAddQuestionClick}
            className="bg-primary-600 text-white font-semibold px-4 py-2 rounded-full hover:bg-primary-700 transition duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50"
          >
            Add question
          </button>
          {user ? (
            <div className="relative group">
              <button className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-bold text-lg">
                {user.displayName ? user.displayName.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase()}
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 invisible group-hover:visible">
                <div className="px-4 py-2 text-sm text-gray-700">{user.displayName || user.email}</div>
                <div className="border-t border-gray-100"></div>
                <a href="#" onClick={(e) => { e.preventDefault(); onLogout(); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Logout</a>
              </div>
            </div>
          ) : (
            <button
              onClick={onLoginClick}
              className="bg-gray-100 text-gray-700 font-semibold px-4 py-2 rounded-full hover:bg-gray-200 transition duration-200"
            >
              Login
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
