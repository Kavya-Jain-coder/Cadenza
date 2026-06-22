'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const SignupContext = createContext();

export function SignupProvider({ children }) {
  const [signupData, setSignupData] = useState({
    username: '',
    email: '',
    password: '',
    genres: []
  });

  // Load from sessionStorage on client load
  useEffect(() => {
    const cached = sessionStorage.getItem('cadenza_signup_data');
    if (cached) {
      try {
        setSignupData(JSON.parse(cached));
      } catch (e) {
        // ignore
      }
    }
  }, []);

  const updateSignupData = (fields) => {
    setSignupData((prev) => {
      const next = { ...prev, ...fields };
      sessionStorage.setItem('cadenza_signup_data', JSON.stringify(next));
      return next;
    });
  };

  const clearSignupData = () => {
    setSignupData({
      username: '',
      email: '',
      password: '',
      genres: []
    });
    sessionStorage.removeItem('cadenza_signup_data');
  };

  return (
    <SignupContext.Provider value={{ signupData, updateSignupData, clearSignupData }}>
      {children}
    </SignupContext.Provider>
  );
}

export function useSignup() {
  const context = useContext(SignupContext);
  if (!context) {
    throw new Error('useSignup must be used within a SignupProvider');
  }
  return context;
}
