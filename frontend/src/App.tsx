import React, { useState } from 'react';
import { Routes, Route, Link, Navigate } from 'react-router-dom';
import CreatePoll from './components/CreatePoll';
import PollList from './components/PollList';
import SharedPoll from './components/SharedPoll';
import About from './components/About'; // Import the About component
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="flex flex-col group relative">
                <div className="flex items-center">
                  <img
                    src="/logo-easyvote-slogan.svg"
                    alt="EasyVote"
                    className="h-16 w-auto transition-transform group-hover:scale-105"
                  />
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex md:items-center md:space-x-4">
              <Link
                to="/polls"
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Mes Sondages
              </Link>
              <div className="relative">
                <button
                  onClick={toggleDropdown}
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium flex items-center"
                >
                  Plus
                  <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                    <div className="py-1">
                      <Link
                        to="/about"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        À propos
                      </Link>
                      <a
                        href="https://hacf.fr"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        HACF
                      </a>
                      <a
                        href="https://github.com/barto95100/easyvote"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        GitHub
                      </a>
                    </div>
                  </div>
                )}
              </div>
              <Link
                to="/create"
                className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-md text-sm font-medium"
              >
                Créer un sondage
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={toggleMenu}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-100 focus:outline-none"
              >
                {isMenuOpen ? (
                  <XMarkIcon className="block h-6 w-6" />
                ) : (
                  <Bars3Icon className="block h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <Link
                to="/polls"
                className="block text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-base font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Mes Sondages
              </Link>
              <Link
                to="/create"
                className="block bg-blue-600 text-white hover:bg-blue-700 px-3 py-2 rounded-md text-base font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Créer un sondage
              </Link>
            </div>
          </div>
        )}
      </nav>

      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Navigate to="/polls" replace />} />
          <Route path="/polls" element={<PollList />} />
          <Route path="/create" element={<CreatePoll />} />
          <Route path="/poll/:shareId" element={<SharedPoll />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </main>

      <footer className="bg-white shadow-lg mt-auto">
        <div className="max-w-7xl mx-auto py-3 px-4">
          <div className="text-center text-sm text-gray-500">
            2024 EasyVote • Développé par Barto_95 pour <a href="https://hacf.fr" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">HACF</a> • v1.0.0
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
