import React, { useState, DragEvent, ChangeEvent } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { Button } from './ui/Button';
import { Textarea } from './ui/Textarea';
import { XIcon } from './icons/XIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { UploadIcon } from './icons/UploadIcon';

// Set up the PDF.js worker. This is required for the library to work in a web environment.
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://aistudiocdn.com/pdfjs-dist@^4.4.168/build/pdf.worker.mjs`;

interface LinkedInImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (text: string) => Promise<void>;
  isImporting: boolean;
  error: string | null;
}

export const LinkedInImportModal: React.FC<LinkedInImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
  isImporting,
  error,
}) => {
  const [profileText, setProfileText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [mode, setMode] = useState<'upload' | 'paste'>('upload');

  if (!isOpen) return null;

  const handleFileSelect = (file: File | null) => {
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setLocalError(null);
    } else {
      setLocalError('Please select a valid PDF file.');
    }
  };

  const handleDragOver = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };
  
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleImportClick = async () => {
    setLocalError(null);
    if (mode === 'upload' && selectedFile) {
        try {
            const arrayBuffer = await selectedFile.arrayBuffer();
            const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
            let fullText = '';
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map(item => ('str' in item ? item.str : '')).join(' ');
                fullText += pageText + '\n';
            }

            if (!fullText.trim()) {
                 throw new Error("No text could be extracted from this PDF. It might be an image-only file.");
            }
            onImport(fullText);
        } catch (e) {
            console.error("Failed to read PDF file:", e);
            const message = e instanceof Error && e.message.includes("No text")
              ? e.message
              : "Could not read this PDF. It might be corrupted or an image-only file. Please try the 'Paste Text' option instead.";
            setLocalError(message);
        }
    } else if (mode === 'paste') {
        onImport(profileText);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl transform transition-all">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800">Import from LinkedIn PDF</h2>
          <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <XIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 space-y-4">
            <div className="flex border-b">
                <button onClick={() => setMode('upload')} className={`px-4 py-2 text-sm font-semibold ${mode === 'upload' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500'}`}>Upload PDF</button>
                <button onClick={() => setMode('paste')} className={`px-4 py-2 text-sm font-semibold ${mode === 'paste' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500'}`}>Paste Text Instead</button>
            </div>
          
            {mode === 'upload' ? (
                 <div>
                    <h3 className="font-semibold text-slate-700 mb-2">Instructions:</h3>
                    <ol className="list-decimal list-inside text-sm text-slate-600 space-y-1 mb-4">
                        <li>Go to your LinkedIn profile, click "More", then "Save to PDF".</li>
                        <li>Upload that PDF file below.</li>
                    </ol>
                    <label htmlFor="file-upload" 
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`mt-2 flex justify-center w-full h-32 px-6 pt-5 pb-6 border-2 border-dashed rounded-md cursor-pointer
                        ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}>
                        <div className="space-y-1 text-center">
                            <UploadIcon className="mx-auto h-10 w-10 text-gray-400" />
                            {selectedFile ? (
                                <p className="text-sm font-semibold text-blue-600">{selectedFile.name}</p>
                            ) : (
                                <div className="flex text-sm text-gray-600">
                                    <p className="pl-1">Drag and drop, or <span className="text-blue-600 font-semibold">browse</span></p>
                                </div>
                            )}
                            <p className="text-xs text-gray-500">PDF up to 10MB</p>
                        </div>
                        <input id="file-upload" name="file-upload" type="file" className="sr-only" accept=".pdf" onChange={handleFileChange} />
                    </label>
                </div>
            ) : (
                <div>
                    <h3 className="font-semibold text-slate-700 mb-2">Instructions:</h3>
                    <ol className="list-decimal list-inside text-sm text-slate-600 space-y-1">
                        <li>Open your LinkedIn PDF, select all text (Ctrl/Cmd + A), and copy it.</li>
                        <li>Paste the copied text into the text area below.</li>
                    </ol>
                    <Textarea
                        value={profileText}
                        onChange={(e) => setProfileText(e.target.value)}
                        rows={12}
                        placeholder="Paste your LinkedIn profile text here..."
                        className="text-xs mt-4"
                    />
                </div>
            )}
            
          {(error || localError) && <p className="text-sm text-red-600">{error || localError}</p>}
        </div>
        <div className="px-6 py-4 bg-slate-50 rounded-b-2xl flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleImportClick}
            disabled={isImporting || (mode === 'upload' && !selectedFile) || (mode === 'paste' && !profileText.trim())}
          >
            <SparklesIcon className="w-4 h-4 mr-2" />
            {isImporting ? 'Importing...' : 'Import Profile'}
          </Button>
        </div>
      </div>
    </div>
  );
};