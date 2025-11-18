import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export const Textarea: React.FC<TextareaProps> = ({ label, id, ...props }) => {
  const textareaId = id || props.name;
  return (
    <div className="w-full">
      {label && <label htmlFor={textareaId} className="block text-sm font-medium text-slate-700 mb-1">{label}</label>}
      <textarea
        id={textareaId}
        className="block w-full bg-white rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        rows={4}
        {...props}
      />
    </div>
  );
};