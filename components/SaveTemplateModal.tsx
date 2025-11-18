import React, { useState } from 'react';
import { ProfileData } from '../types';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { XIcon } from './icons/XIcon';
import { SaveIcon } from './icons/SaveIcon';

interface SaveTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (templateName: string) => void;
  initialData: ProfileData;
}

export const SaveTemplateModal: React.FC<SaveTemplateModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
    const [templateName, setTemplateName] = useState('');

    if (!isOpen) return null;

    const handleSaveClick = () => {
        if (templateName.trim()) {
            onSave(templateName.trim());
        }
    };

    const DataSummary = () => (
        <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-md border max-h-48 overflow-y-auto space-y-1">
            <p><strong>Full Name:</strong> {initialData.fullName || 'N/A'}</p>
            <p><strong>Summary:</strong> {initialData.summary ? `${initialData.summary.substring(0, 70)}...` : 'N/A'}</p>
            <p><strong>Work Experience entries:</strong> {initialData.workExperience?.filter(e => e.jobTitle).length || 0}</p>
            <p><strong>Education entries:</strong> {initialData.education?.filter(e => e.institution).length || 0}</p>
            <p><strong>Skills:</strong> {initialData.skills?.filter(s => s).length || 0}</p>
            <p><strong>Certifications:</strong> {initialData.certifications?.filter(c => c.name).length || 0}</p>
            <p><strong>References:</strong> {initialData.references?.filter(r => r.name).length || 0}</p>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg transform transition-all">
                <div className="p-6 border-b flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-800">Save Profile as Template</h2>
                    <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    <p className="text-sm text-slate-600">Give this template a name to easily load it later.</p>
                    <Input
                        label="Template Name"
                        value={templateName}
                        onChange={(e) => setTemplateName(e.target.value)}
                        placeholder="e.g., Senior Developer Profile"
                        autoFocus
                    />
                    <div>
                        <h4 className="text-sm font-medium text-slate-700 mb-1">Template Data Summary:</h4>
                        <DataSummary />
                    </div>
                </div>
                <div className="px-6 py-4 bg-slate-50 rounded-b-2xl flex justify-end gap-3">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSaveClick} disabled={!templateName.trim()}>
                        <SaveIcon className="w-4 h-4 mr-2" />
                        Save Template
                    </Button>
                </div>
            </div>
        </div>
    );
};
