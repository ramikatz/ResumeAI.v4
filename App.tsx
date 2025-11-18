

import React, { useState, useCallback, useContext, useEffect } from 'react';
import { ProfileData, Template, AnalysisResult, User } from './types';
import { generateResumeAndAnalysis } from './services/geminiService';
import { AuthContext } from './contexts/AuthContext';

import Header from './components/Header';
import StepIndicator from './components/StepIndicator';
import ProfileForm from './components/ProfileForm';
import JobForm from './components/JobForm';
import TemplateSelector from './components/TemplateSelector';
import ResultsDisplay from './components/ResultsDisplay';
import AuthPage from './components/auth/AuthPage';
import AdminDashboard from './components/admin/AdminDashboard';
import { SparklesIcon } from './components/icons/SparklesIcon';
import VerifyEmailPage from './components/auth/VerifyEmailPage';

const App: React.FC = () => {
  const { currentUser, users } = useContext(AuthContext);

  const [step, setStep] = useState(1);
  const [profileData, setProfileData] = useState<ProfileData>({
    fullName: '',
    email: '',
    phone: '',
    linkedinUrl: '',
    summary: '',
    roleAppliedFor: '',
    profilePicture: null,
    workExperience: [{ jobTitle: '', company: '', startDate: '', endDate: '', responsibilities: '' }],
    education: [{ institution: '', degree: '', fieldOfStudy: '', graduationDate: '' }],
    skills: [],
    certifications: [],
    references: [],
    projects: [],
    additionalExperience: [],
  });
  const [jobDescription, setJobDescription] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<Template>('professional');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isIntegrating, setIsIntegrating] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userToVerify, setUserToVerify] = useState<User | null>(null);

  useEffect(() => {
    if (currentUser?.role === 'Client' && currentUser.profileData) {
      // Ensure nested arrays are not undefined
      const userProfile = currentUser.profileData;
      const sanitizedProfile = {
        ...userProfile,
        roleAppliedFor: userProfile.roleAppliedFor || '',
        linkedinUrl: userProfile.linkedinUrl || '',
        workExperience: userProfile.workExperience?.length > 0 ? userProfile.workExperience : [{ jobTitle: '', company: '', startDate: '', endDate: '', responsibilities: '' }],
        education: userProfile.education?.length > 0 ? userProfile.education : [{ institution: '', degree: '', fieldOfStudy: '', graduationDate: '' }],
        skills: userProfile.skills || [],
        certifications: userProfile.certifications || [],
        references: userProfile.references || [],
        projects: userProfile.projects || [],
        additionalExperience: userProfile.additionalExperience || [],
      };
      setProfileData(sanitizedProfile);
    }
  }, [currentUser]);

  const handleNextStep = () => setStep(prev => prev + 1);
  const handlePrevStep = () => setStep(prev => prev - 1);

  const handleGenerate = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);
    try {
      const result = await generateResumeAndAnalysis(profileData, jobDescription, profileData.roleAppliedFor, selectedTemplate);
      setAnalysisResult(result);
      handleNextStep();
    } catch (err) {
      setError('An error occurred while generating the analysis. Please check your API key and try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [profileData, jobDescription, selectedTemplate]);

  const resetApp = () => {
    setStep(1);
    // When resetting, keep the user's saved profile data, but clear the job-specific parts
    setJobDescription('');
    setProfileData(prev => ({ ...prev, roleAppliedFor: '' }));
    setSelectedTemplate('professional');
    setAnalysisResult(null);
    setError(null);
  };
  
  const STEPS = [
    { number: 1, title: 'Your Profile' },
    { number: 2, title: 'The Job' },
    { number: 3, title: 'Choose Style' },
    { number: 4, title: 'Get Results' },
  ];

  if (userToVerify) {
    return <VerifyEmailPage user={userToVerify} onVerified={() => setUserToVerify(null)} />;
  }

  if (!currentUser) {
    return <AuthPage onSignupSuccess={(user) => setUserToVerify(user)} />;
  }

  if (currentUser.role === 'Admin') {
    return (
       <div className="bg-slate-50 min-h-screen text-slate-800">
          <Header />
          <main className="container mx-auto px-4 py-8 max-w-5xl">
            <AdminDashboard />
          </main>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <StepIndicator steps={STEPS} currentStep={step} />
        
        <div className="mt-8 bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200">
          {step === 1 && <ProfileForm 
              profileData={profileData} 
              setProfileData={setProfileData} 
              onNext={handleNextStep}
            />}
          {step === 2 && <JobForm 
              jobDescription={jobDescription} 
              setJobDescription={setJobDescription} 
              onNext={handleNextStep} 
              onBack={handlePrevStep} 
            />}
          {step === 3 && (
            <div>
              <TemplateSelector selectedTemplate={selectedTemplate} setSelectedTemplate={setSelectedTemplate} />
              <div className="mt-8 flex justify-between items-center">
                <button onClick={handlePrevStep} className="px-6 py-2 text-sm font-semibold text-slate-600 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors">Back</button>
                <button
                  onClick={handleGenerate}
                  disabled={isLoading}
                  className="px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                >
                  {isLoading ? 'Generating...' : 'Generate Resume'}
                  <SparklesIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
          {step === 4 && analysisResult && (
            <ResultsDisplay 
                result={analysisResult} 
                setResult={setAnalysisResult} 
                template={selectedTemplate} 
                onReset={resetApp} 
                profilePicture={profileData.profilePicture} 
                setIsIntegrating={setIsIntegrating}
                jobDescription={jobDescription}
                setIsRecalculating={setIsRecalculating}
            />
           )}
        </div>
        {(isLoading || isIntegrating || isRecalculating) && (
            <div className="fixed inset-0 bg-white bg-opacity-80 backdrop-blur-sm flex flex-col items-center justify-center z-50">
                <div className="w-16 h-16 border-4 border-blue-500 border-dashed rounded-full animate-spin"></div>
                <p className="mt-4 text-lg font-semibold text-slate-700">
                    {isLoading ? 'AI is tailoring your resume...' : 
                     isIntegrating ? 'AI is updating your resume...' : 
                     'Recalculating ATS score...'}
                </p>
                <p className="text-sm text-slate-500">This might take a moment.</p>
            </div>
        )}
        {error && step === 3 && (
          <div className="mt-4 text-center p-4 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;