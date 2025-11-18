
import React, { useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { Button } from './ui/Button';

const Header: React.FC = () => {
  const { currentUser, logout } = useContext(AuthContext);

  return (
    <header className="bg-white border-b border-slate-200">
      <div className="container mx-auto px-4 py-4 max-w-5xl flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            <span className="text-blue-600">Resume</span> Tailor AI
          </h1>
          <p className="text-sm text-slate-500">Craft the perfect resume for your dream job.</p>
        </div>
        {currentUser && (
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600 hidden sm:block">
              Welcome, <span className="font-semibold">{currentUser.email}</span>
            </span>
            <Button variant="outline" size="sm" onClick={logout}>Logout</Button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
