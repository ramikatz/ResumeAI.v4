import React from 'react';
import { Template } from '../types';

interface TemplateSelectorProps {
  selectedTemplate: Template;
  setSelectedTemplate: (template: Template) => void;
}

const templates = [
  { id: 'professional', name: 'Professional', imageUrl: 'https://i.imgur.com/8QpWqT5.png' },
  { id: 'creative', name: 'Creative Dark', imageUrl: 'https://i.imgur.com/sC5p4sJ.png' },
  { id: 'elegant', name: 'Elegant Sidebar', imageUrl: 'https://i.imgur.com/3Z6w7dY.png' },
  { id: 'minimalist', name: 'Minimalist', imageUrl: 'https://i.imgur.com/5uAfzF8.png' },
] as const;


const TemplateSelector: React.FC<TemplateSelectorProps> = ({ selectedTemplate, setSelectedTemplate }) => {
  return (
    <div className="space-y-6">
       <div>
            <h2 className="text-xl font-bold text-slate-800">Choose Your Style</h2>
            <p className="text-sm text-slate-500">Select a template for your tailored resume.</p>
        </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {templates.map((template) => (
          <div
            key={template.id}
            onClick={() => setSelectedTemplate(template.id)}
            className={`cursor-pointer rounded-lg border-2 transition-all duration-200 ${
              selectedTemplate === template.id ? 'border-blue-600 ring-2 ring-blue-600 ring-offset-2' : 'border-slate-300 hover:border-blue-500'
            }`}
          >
            <img src={template.imageUrl} alt={template.name} className="rounded-md w-full h-auto object-cover" />
            <p className="text-center font-semibold py-3 bg-slate-50 rounded-b-md">{template.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TemplateSelector;