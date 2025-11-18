

import React, { useRef, useCallback, useState } from 'react';
import { AnalysisResult, Template, TailoredResumeData } from '../types';
import { integrateKeyword, recalculateAtsScore } from '../services/geminiService';
import { Button } from './ui/Button';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { ChartPieIcon } from './icons/ChartPieIcon';
import { KeyIcon } from './icons/KeyIcon';
import { BookOpenIcon } from './icons/BookOpenIcon';
import { ClipboardIcon } from './icons/ClipboardIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { ProfessionalTemplate } from './templates/ProfessionalTemplate';
import { CreativeTemplate } from './templates/CreativeTemplate';
import { ElegantTemplate } from './templates/ElegantTemplate';
import { MinimalistTemplate } from './templates/MinimalistTemplate';
import { SparklesIcon } from './icons/SparklesIcon';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { UserCircleIcon } from './icons/UserCircleIcon';
import { BriefcaseIcon } from './icons/BriefcaseIcon';
import { CheckBadgeIcon } from './icons/CheckBadgeIcon';

interface ResultsDisplayProps {
  result: AnalysisResult;
  setResult: React.Dispatch<React.SetStateAction<AnalysisResult | null>>;
  onReset: () => void;
  template: Template;
  profilePicture: string | null | undefined;
  setIsIntegrating: React.Dispatch<React.SetStateAction<boolean>>;
  jobDescription: string;
  setIsRecalculating: React.Dispatch<React.SetStateAction<boolean>>;
}

type Tab = 'resume' | 'matches' | 'gaps' | 'learning';
type TargetSection = 'Summary' | 'Work Experience' | 'Skills';

// Helper function to convert structured resume data to plain text for clipboard
const generatePlainTextResume = (data: TailoredResumeData): string => {
    let text = '';
    text += `${data.fullName}\n`;
    text += `${data.jobTitle}\n`;
    text += `\nContact:\n${data.contact?.email || ''} | ${data.contact?.phone || ''}${data.contact?.website ? ' | ' + data.contact.website : ''}\n${data.contact?.address || ''}\n`;
    text += `\n--- SUMMARY ---\n${data.summary}\n`;

    text += `\n--- WORK EXPERIENCE ---\n`;
    (data.workExperience || []).forEach(exp => {
        text += `\n${exp.jobTitle.toUpperCase()} | ${exp.company}\n`;
        text += `${exp.startDate} - ${exp.endDate}\n`;
        (exp.responsibilities || []).forEach(r => text += `- ${r}\n`);
    });

    text += `\n--- EDUCATION ---\n`;
    (data.education || []).forEach(edu => {
        text += `\n${edu.degree}${edu.fieldOfStudy ? ' in ' + edu.fieldOfStudy : ''}\n`;
        text += `${edu.institution} | ${edu.graduationDate}\n`;
    });

    text += `\n--- SKILLS ---\n${(data.skills || []).join(', ')}\n`;
    
    if (data.additionalInfo && data.additionalInfo.length > 0) {
        text += `\n--- ADDITIONAL INFORMATION ---\n`;
        data.additionalInfo.forEach(info => {
            text += `\n${info.title.toUpperCase()}: ${info.details}\n`;
        });
    }

    return text;
};


const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ result, setResult, onReset, template, profilePicture, setIsIntegrating, jobDescription, setIsRecalculating }) => {
  const [activeTab, setActiveTab] = useState<Tab>('resume');
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [integrationTargets, setIntegrationTargets] = useState<{ [keyword: string]: TargetSection }>({});
  const resumeRef = useRef<HTMLDivElement>(null);

  const handleRecalculate = useCallback(async () => {
      setIsRecalculating(true);
      try {
        const { atsScore, atsScoreExplanation } = await recalculateAtsScore(result.tailoredResume, jobDescription);
        setResult(prev => (prev ? { ...prev, atsScore, atsScoreExplanation } : null));
      } catch (error) {
        console.error("Failed to recalculate ATS score:", error);
      } finally {
        setIsRecalculating(false);
      }
  }, [result.tailoredResume, jobDescription, setIsRecalculating, setResult]);


  const copyToClipboard = () => {
    const plainTextResume = generatePlainTextResume(result.tailoredResume);
    navigator.clipboard.writeText(plainTextResume);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPdf = async () => {
      if (!resumeRef.current) return;
      setIsDownloading(true);
      
      try {
        const canvas = await html2canvas(resumeRef.current, {
            scale: 2, 
            useCORS: true,
            logging: false,
        });
        
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'px',
            format: [canvas.width, canvas.height]
        });
        
        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save(`${result.tailoredResume.fullName.replace(' ', '_')}_Resume.pdf`);

      } catch(error) {
          console.error("Error generating PDF:", error);
          alert("Sorry, there was an error creating the PDF. Please try again.");
      } finally {
          setIsDownloading(false);
      }
  };
  
  const handleUpdateResume = (updatedResume: TailoredResumeData) => {
    setResult(prev => prev ? { ...prev, tailoredResume: updatedResume } : null);
  };

  const handleIntegrateKeyword = async (keyword: string, targetSection: TargetSection) => {
    setIsIntegrating(true);
    try {
        // Step 1: Integrate the keyword into the resume content.
        const updatedResume = await integrateKeyword(result.tailoredResume, keyword, targetSection);
        
        // Step 2: Immediately recalculate the ATS score with the updated resume.
        const { atsScore, atsScoreExplanation } = await recalculateAtsScore(updatedResume, jobDescription);

        // Step 3: Update the entire result state at once to ensure consistency.
        setResult(prev => {
            if (!prev) return null;
            // Remove the integrated keyword from the list of gaps.
            const newGaps = prev.keywordGaps.filter(g => g.keyword !== keyword);
            return {
                ...prev,
                tailoredResume: updatedResume,
                keywordGaps: newGaps,
                atsScore: atsScore,
                atsScoreExplanation: atsScoreExplanation,
            };
        });
    } catch (error) {
        console.error("Failed to integrate keyword:", error);
        alert(`An error occurred while trying to add "${keyword}" to your resume.`);
    } finally {
        setIsIntegrating(false);
    }
  };

  const handleFixJobTitle = async () => {
    if (!result.jobTitleMismatch) return;

    setIsIntegrating(true); // Re-using this loading state for consistency

    try {
        const updatedResume = {
            ...result.tailoredResume,
            jobTitle: result.jobTitleMismatch.suggestedTitle
        };
        
        const { atsScore, atsScoreExplanation } = await recalculateAtsScore(updatedResume, jobDescription);
        
        setResult(prev => {
            if (!prev) return null;
            return {
                ...prev,
                tailoredResume: updatedResume,
                jobTitleMismatch: null, // Clear the mismatch after successful update
                atsScore,
                atsScoreExplanation,
            };
        });
    } catch (error) {
        console.error("Failed to update job title and recalculate score:", error);
        alert("An error occurred while updating the job title.");
    } finally {
        setIsIntegrating(false);
    }
};


  const scoreColor = result.atsScore > 75 ? 'text-green-600' : result.atsScore > 50 ? 'text-yellow-600' : 'text-red-600';

  const ResumeContent = () => {
    const resumeKey = JSON.stringify(result.tailoredResume);
    const props = { 
        key: resumeKey,
        data: result.tailoredResume, 
        onUpdate: handleUpdateResume,
        onBlurRecalculate: handleRecalculate,
        profilePicture: profilePicture 
    };
    switch (template) {
        case 'professional':
            return <ProfessionalTemplate {...props} />;
        case 'creative':
            return <CreativeTemplate {...props} />;
        case 'elegant':
            return <ElegantTemplate {...props} />;
        case 'minimalist':
            return <MinimalistTemplate {...props} />;
        default:
            return <div className="p-8 border">Unsupported template selected.</div>;
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'resume':
        return (
          <div className="relative group">
             <div className="absolute top-4 right-4 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                 <Button variant="outline" size="sm" onClick={copyToClipboard} className="bg-white">
                    <ClipboardIcon className="w-4 h-4 mr-2" /> {copied ? 'Copied!' : 'Copy Text'}
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownloadPdf} disabled={isDownloading} className="bg-white">
                    <DownloadIcon className="w-4 h-4 mr-2" /> {isDownloading ? 'Downloading...' : 'Download PDF'}
                </Button>
             </div>
            <div className="shadow-lg" ref={resumeRef}>
                <ResumeContent />
            </div>
          </div>
        );
      case 'matches':
        return (
            <div className="space-y-4">
                <p className="text-sm text-slate-600">Here's a breakdown of how your qualifications align with the key requirements of the job.</p>
                {result.qualificationMatches.map((match, index) => (
                     <div key={index} className="p-4 border rounded-lg bg-white border-slate-200 shadow-sm">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                            <div className="flex items-start gap-3">
                                <UserCircleIcon className="w-6 h-6 text-blue-500 mt-1 flex-shrink-0" />
                                <div>
                                    <h4 className="text-sm font-semibold text-slate-600">From Your Profile</h4>
                                    <p className="font-medium text-slate-800 mt-1 text-sm italic">"{match.userQualification}"</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <BriefcaseIcon className="w-6 h-6 text-blue-500 mt-1 flex-shrink-0" />
                                <div>
                                    <h4 className="text-sm font-semibold text-slate-600">From The Job Description</h4>
                                    <p className="font-medium text-slate-800 mt-1 text-sm italic">"{match.jobRequirement}"</p>
                                </div>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-200 flex items-start gap-3">
                            <CheckBadgeIcon className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                            <div>
                                <h4 className="text-sm font-semibold text-green-700">How It's a Match</h4>
                                <p className="text-sm text-slate-600 mt-1">{match.explanation}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
      case 'gaps':
         return (
            <div className="space-y-4">
                {result.jobTitleMismatch && (
                    <div className="p-4 border rounded-lg bg-indigo-50 border-indigo-200">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-start">
                            <div className="flex-grow">
                                <p className="font-semibold text-indigo-800">🎯 Fix Job Role Name</p>
                                <p className="text-sm text-slate-600 mt-2">Your Title: <span className="font-medium">"{result.jobTitleMismatch.userTitle}"</span></p>
                                <p className="text-sm text-slate-600">Suggested: <span className="font-medium text-indigo-700">"{result.jobTitleMismatch.suggestedTitle}"</span></p>
                                <p className="text-xs text-slate-500 mt-1 italic">{result.jobTitleMismatch.reason}</p>
                            </div>
                            <Button 
                                size="sm" 
                                onClick={handleFixJobTitle}
                                className="mt-3 sm:mt-0 sm:ml-4 flex-shrink-0 bg-indigo-600 text-white hover:bg-indigo-700"
                            >
                                Update on Resume
                            </Button>
                        </div>
                    </div>
                )}
                {result.keywordGaps.map((gap, index) => {
                    const selectedTarget = integrationTargets[gap.keyword] || 'Work Experience';
                    return (
                        <div key={index} className="p-4 border rounded-lg bg-yellow-50 border-yellow-200">
                            <div className="flex flex-col sm:flex-row justify-between sm:items-center">
                                <div>
                                    <p className="font-semibold text-yellow-800">💡 Missing Keyword: "{gap.keyword}"</p>
                                    <p className="text-sm text-slate-600 mt-1">{gap.reason}</p>
                                </div>
                                <Button 
                                    size="sm" 
                                    onClick={() => handleIntegrateKeyword(gap.keyword, selectedTarget)}
                                    className="mt-3 sm:mt-0 flex-shrink-0"
                                >
                                <SparklesIcon className="w-4 h-4 mr-2" />
                                Add to Resume
                                </Button>
                            </div>
                            <div className="mt-4 pt-3 border-t border-yellow-200">
                                <fieldset>
                                    <legend className="text-xs font-semibold text-slate-600 mb-2">Add to which section?</legend>
                                    <div className="flex flex-wrap gap-x-4 gap-y-2">
                                        {(['Summary', 'Work Experience', 'Skills'] as TargetSection[]).map(section => (
                                            <div key={section} className="flex items-center">
                                                <input
                                                    id={`${gap.keyword}-${section}`}
                                                    name={`target-${gap.keyword}`}
                                                    type="radio"
                                                    value={section}
                                                    checked={selectedTarget === section}
                                                    onChange={() => setIntegrationTargets(prev => ({...prev, [gap.keyword]: section}))}
                                                    className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                                />
                                                <label htmlFor={`${gap.keyword}-${section}`} className="ml-2 block text-sm text-slate-700">
                                                    {section}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </fieldset>
                            </div>
                        </div>
                    )
                })}
                 {(result.keywordGaps.length === 0 && !result.jobTitleMismatch) && (
                    <p className="text-center text-slate-500 p-4">No significant gaps found. Great job!</p>
                )}
            </div>
        );
      case 'learning':
        return (
            <div className="space-y-4">
                <p className="text-sm text-slate-600">Here's a targeted guide to help you address the most important missing keywords from the job description.</p>
                {result.keywordGuide.map((item, index) => (
                    <div key={index} className="p-4 border rounded-lg bg-blue-50 border-blue-200">
                        <h3 className="font-semibold text-blue-800">Guide for: "{item.keyword}"</h3>
                        <p className="text-sm text-slate-700 mt-2">{item.guidance}</p>
                        <div className="mt-3 pt-3 border-t border-blue-200">
                            <span className="text-xs font-bold text-slate-500">Suggested Resource:</span>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs font-medium bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">{item.resource.type}</span>
                                <a href={item.resource.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-sm text-blue-600 hover:underline">{item.resource.title}</a>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }
  };

  const TabButton = ({ tabId, icon, label }: { tabId: Tab; icon: React.ReactNode; label: string }) => (
     <button
        onClick={() => setActiveTab(tabId)}
        className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
          activeTab === tabId ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
        }`}
      >
        {icon} {label}
    </button>
  );

  return (
    <div className="space-y-6">
        <div className="text-center p-6 bg-slate-100 rounded-lg">
            <h2 className="text-xl font-bold">Your Results Are Ready!</h2>
            <p className="text-slate-600 mt-2">ATS Compatibility Score</p>
            <p className={`text-6xl font-bold my-2 ${scoreColor}`}>{result.atsScore}<span className="text-3xl">%</span></p>
            <p className="text-sm text-slate-500 italic">"{result.atsScoreExplanation}"</p>
        </div>
      
      <div className="flex flex-wrap gap-2 border-b">
         <TabButton tabId="resume" icon={<DocumentTextIcon className="w-5 h-5"/>} label="Tailored Resume" />
         <TabButton tabId="matches" icon={<ChartPieIcon className="w-5 h-5"/>} label="Qualification Matches" />
         <TabButton tabId="gaps" icon={<KeyIcon className="w-5 h-5"/>} label="Keyword Gaps" />
         <TabButton tabId="learning" icon={<BookOpenIcon className="w-5 h-5"/>} label="Keywords Guide" />
      </div>

      <div>{renderContent()}</div>

      <div className="text-center pt-6 border-t">
        <Button onClick={onReset}>Start a New Analysis</Button>
      </div>
    </div>
  );
};

export default ResultsDisplay;