import React, { useState, DragEvent } from 'react';
import { Button } from './ui/Button';
import { Textarea } from './ui/Textarea';
import { Input } from './ui/Input';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { extractTextFromImage } from '../services/geminiService';
import { UploadIcon } from './icons/UploadIcon';
import { LinkIcon } from './icons/LinkIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { DocumentTextIcon } from './icons/DocumentTextIcon';

// Helper function to convert file to base64
const fileToBase64 = (file: File): Promise<{ base64: string; mimeType: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve({ base64, mimeType: file.type });
    };
    reader.onerror = (error) => reject(error);
  });
};

// Helper function to fetch image from URL and convert to base64
const urlToBase64 = async (url: string): Promise<{ base64: string; mimeType: string }> => {
    // Use a public CORS proxy to attempt to bypass browser security restrictions.
    // Note: Public proxies can be unreliable and are not recommended for production environments.
    // A dedicated backend proxy would be a more robust solution.
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;

    try {
        const response = await fetch(proxyUrl);
        if (!response.ok) {
            throw new Error(`The proxy server failed to fetch the image. Status: ${response.statusText}`);
        }
        const blob = await response.blob();
        if (!blob.type.startsWith('image/')) {
            throw new Error('The provided URL does not point to a valid image file.');
        }
        
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = () => {
                const result = reader.result as string;
                if (!result) {
                    return reject(new Error("Failed to read file as Base64."));
                }
                const base64 = result.split(',')[1];
                resolve({ base64, mimeType: blob.type });
            };
            reader.onerror = (error) => reject(error);
        });
    } catch (error) {
        console.error("Error fetching or converting URL to Base64 via proxy:", error);
        throw new Error("Could not load image from this URL. The link might be broken or the website's security policy (CORS) is blocking access. Please try downloading the image and using the 'Upload Image' tab instead.");
    }
};

interface JobFormProps {
  jobDescription: string;
  setJobDescription: (desc: string) => void;
  onNext: () => void;
  onBack: () => void;
}

type InputType = 'text' | 'upload' | 'url';

const JobForm: React.FC<JobFormProps> = ({ jobDescription, setJobDescription, onNext, onBack }) => {
  const [inputType, setInputType] = useState<InputType>('text');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const handleFileChange = (file: File | null) => {
    setError(null);
    if (file) {
      if (file.type.startsWith('image/')) {
        setImageFile(file);
        const previewUrl = URL.createObjectURL(file);
        setImagePreview(previewUrl);
      } else {
        setError("Please select a valid image file (e.g., PNG, JPG).");
        setImageFile(null);
        setImagePreview(null);
      }
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageUrl(e.target.value);
    setImagePreview(null); // Clear preview when URL changes, as optimistic preview can be misleading
    setError(null);
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
      handleFileChange(e.dataTransfer.files[0]);
    }
  };
  
  const handleExtractText = async () => {
    setError(null);
    setIsExtracting(true);
    try {
      let imageData: { base64: string; mimeType: string } | null = null;
      if (inputType === 'upload' && imageFile) {
        imageData = await fileToBase64(imageFile);
      } else if (inputType === 'url' && imageUrl) {
        imageData = await urlToBase64(imageUrl);
      }
      
      if (imageData) {
        const extractedText = await extractTextFromImage(imageData);
        setJobDescription(extractedText);
        setInputType('text'); // Switch to text view for review
      } else {
        throw new Error("No image data provided.");
      }
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "An unknown error occurred.";
      setError(`Failed to extract text. ${message}`);
    } finally {
      setIsExtracting(false);
    }
  };
  
  const TabButton = ({ type, label, icon }: { type: InputType; label: string; icon: React.ReactNode }) => (
     <button
        onClick={() => { setInputType(type); setError(null); }}
        className={`flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors w-full sm:w-auto
          ${inputType === type ? 'border-blue-600 text-blue-700 bg-blue-50' : 'border-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-800'}`}
      >
        {icon} {label}
    </button>
  );

  return (
    <div className="space-y-6">
       <div>
            <h2 className="text-xl font-bold text-slate-800">The Job</h2>
            <p className="text-sm text-slate-500">Provide the job description by pasting text or uploading an image.</p>
        </div>
        
        <div className="border-b border-slate-200 flex flex-col sm:flex-row">
            <TabButton type="text" label="Paste Text" icon={<DocumentTextIcon className="w-5 h-5" />} />
            <TabButton type="upload" label="Upload Image" icon={<UploadIcon className="w-5 h-5" />} />
            <TabButton type="url" label="Image URL" icon={<LinkIcon className="w-5 h-5" />} />
        </div>
        
        <div className="pt-4">
            {inputType === 'text' && (
                <Textarea
                    label="Job Description Text"
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    rows={15}
                    placeholder="Paste job description here..."
                />
            )}
            
            {inputType === 'upload' && (
                <div className="space-y-4">
                    <label htmlFor="file-upload" 
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`flex justify-center w-full px-6 py-10 border-2 border-dashed rounded-md cursor-pointer
                        ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}`}>
                        <div className="space-y-1 text-center">
                            <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
                            <div className="flex text-sm text-gray-600">
                                <span className="relative bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                                    <span>Upload a file</span>
                                    <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" onChange={(e) => handleFileChange(e.target.files ? e.target.files[0] : null)} />
                                </span>
                                <p className="pl-1">or drag and drop</p>
                            </div>
                            <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                        </div>
                    </label>
                    {imagePreview && (
                        <div className="text-center">
                            <img src={imagePreview} alt="Job description preview" className="max-h-60 mx-auto rounded-md border shadow-sm" />
                            <p className="text-xs text-slate-500 mt-2">{imageFile?.name}</p>
                        </div>
                    )}
                </div>
            )}
            
            {inputType === 'url' && (
                 <div className="space-y-4">
                    <Input
                        label="Image URL"
                        type="url"
                        value={imageUrl}
                        onChange={handleUrlChange}
                        placeholder="https://example.com/job-description.png"
                    />
                     <p className="text-xs text-slate-500 text-center px-4">
                        We'll attempt to fetch the image from the URL. If it fails due to website security policies,
                        please download the image to your computer and use the "Upload Image" tab.
                    </p>
                </div>
            )}
            
            {(inputType === 'upload' || inputType === 'url') && (
                <div className="mt-6 text-center">
                    <Button
                        onClick={handleExtractText}
                        disabled={isExtracting || (inputType === 'upload' && !imageFile) || (inputType === 'url' && !imageUrl.trim())}
                    >
                        <SparklesIcon className="w-4 h-4 mr-2" />
                        {isExtracting ? 'Extracting Text...' : 'Extract Text from Image'}
                    </Button>
                </div>
            )}
            
            {error && <p className="mt-4 text-sm text-red-600 text-center">{error}</p>}
        </div>

      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={onBack}><ChevronLeftIcon className="w-4 h-4 mr-2" /> Back</Button>
        <Button onClick={onNext} disabled={!jobDescription.trim()}>Next: Choose Style <ChevronRightIcon className="w-4 h-4 ml-2" /></Button>
      </div>
    </div>
  );
};

export default JobForm;