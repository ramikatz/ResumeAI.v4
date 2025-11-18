import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input: React.FC<InputProps> = ({ label, id, ...props }) => {
  const inputId = id || props.name;
  return (
    <div className="w-full">
      {label && <label htmlFor={inputId} className="block text-sm font-medium text-slate-700 mb-1">{label}</label>}
      <input
        id={inputId}
        className="block w-full bg-white rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        {...props}
      />
    </div>
  );
};