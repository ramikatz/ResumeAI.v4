

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { produce } from 'immer';
import { User, ProfileData, TemplateEntry } from '../types';

type LoginResult = {
    success: boolean;
    user?: User;
    error?: 'not_found' | 'unverified';
}

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  login: (email: string, pass: string) => LoginResult;
  logout: () => void;
  signup: (email: string, pass: string) => { success: boolean, user?: User };
  updateUserProfile: (profileData: ProfileData) => void;
  saveTemplate: (name: string, data: ProfileData) => void;
  verifyUser: (email: string) => void;
}

export const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  users: [],
  login: () => ({ success: false, error: 'not_found' }),
  logout: () => {},
  signup: () => ({ success: false }),
  updateUserProfile: () => {},
  saveTemplate: () => {},
  verifyUser: () => {},
});

const USERS_STORAGE_KEY = 'resume-ai-users';
const CURRENT_USER_STORAGE_KEY = 'resume-ai-current-user';

const initialProfileData: ProfileData = {
  fullName: '',
  email: '',
  phone: '',
  linkedinUrl: '',
  summary: '',
  roleAppliedFor: '',
  profilePicture: null,
  workExperience: [],
  education: [],
  skills: [],
  certifications: [],
  references: [],
  projects: [],
  additionalExperience: [],
};

const getInitialUsers = (): User[] => {
  try {
    const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
    if (storedUsers) {
      return JSON.parse(storedUsers);
    }
  } catch (error) {
    console.error("Failed to parse users from localStorage", error);
  }
  
  // Seed with default users if none exist
  const defaultUsers: User[] = [
    {
      id: 'admin-1',
      email: 'admin@app.com',
      password: 'admin',
      role: 'Admin',
      profileData: { ...initialProfileData, fullName: 'Admin User', email: 'admin@app.com' },
      templates: [],
      isVerified: true,
    },
    {
      id: 'client-1',
      email: 'client@app.com',
      password: 'client',
      role: 'Client',
      profileData: { ...initialProfileData, fullName: 'Client User', email: 'client@app.com' },
      templates: [],
      isVerified: true,
    },
  ];
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(defaultUsers));
  return defaultUsers;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(getInitialUsers);
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const storedUser = localStorage.getItem(CURRENT_USER_STORAGE_KEY);
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (error) {
      return null;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    } catch (error) {
      console.error("Failed to save users to localStorage", error);
    }
  }, [users]);

  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
      }
    } catch (error) {
      console.error("Failed to save current user to localStorage", error);
    }
  }, [currentUser]);

  const login = (email: string, pass: string): LoginResult => {
    const user = users.find(u => u.email === email && u.password === pass);
    if (!user) {
      return { success: false, error: 'not_found' };
    }
    if (!user.isVerified) {
      return { success: false, error: 'unverified', user };
    }
    setCurrentUser(user);
    return { success: true, user };
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const signup = (email: string, pass: string): { success: boolean, user?: User } => {
    if (users.some(u => u.email === email)) {
      return { success: false }; // User already exists
    }
    const newUser: User = {
      id: `user-${Date.now()}`,
      email,
      password: pass,
      role: 'Client',
      profileData: { ...initialProfileData, email },
      templates: [],
      isVerified: false, // Start as unverified
    };
    setUsers(prevUsers => [...prevUsers, newUser]);
    // Do not log in automatically, require verification
    return { success: true, user: newUser };
  };

  const verifyUser = (email: string) => {
    setUsers(prevUsers =>
      prevUsers.map(user =>
        user.email === email ? { ...user, isVerified: true } : user
      )
    );
  };
  
  const updateUserProfile = (profileData: ProfileData) => {
    if (!currentUser) return;
    
    const updatedUser = { ...currentUser, profileData };
    setCurrentUser(updatedUser);
    
    setUsers(prevUsers => 
      prevUsers.map(u => (u.id === currentUser.id ? updatedUser : u))
    );
  };

  const saveTemplate = (name: string, data: ProfileData) => {
    if (!currentUser) return;

    const updatedUser = produce(currentUser, draftUser => {
        if (!draftUser.templates) {
            draftUser.templates = [];
        }
        
        const existingTemplateIndex = draftUser.templates.findIndex(t => t.name === name);

        if (existingTemplateIndex > -1) {
            // Update existing template
            draftUser.templates[existingTemplateIndex].data = data;
        } else {
            // Add new template
            draftUser.templates.push({ id: `template-${Date.now()}`, name, data });
        }
    });

    setCurrentUser(updatedUser);
    
    setUsers(prevUsers => 
      prevUsers.map(u => (u.id === currentUser.id ? updatedUser : u))
    );
  };

  const value = { currentUser, users, login, logout, signup, updateUserProfile, saveTemplate, verifyUser };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};