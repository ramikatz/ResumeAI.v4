import React, { ChangeEvent, useCallback, useState, useContext } from 'react';
import { ProfileData, WorkExperience, Education, Certification, Reference, TemplateEntry, Project, AdditionalExperience } from '../types';
import { parseLinkedInProfile } from '../services/geminiService';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import { LinkedInIcon } from './icons/LinkedInIcon';
import { BriefcaseIcon } from './icons/BriefcaseIcon';
import { EducationIcon } from './icons/EducationIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
import { LinkedInImportModal } from './LinkedInImportModal';
import { KeyIcon } from './icons/KeyIcon';
import { CertificationIcon } from './icons/CertificationIcon';
import { UserCircleIcon } from './icons/UserCircleIcon';
import { SaveTemplateModal } from './SaveTemplateModal';
import { AuthContext } from '../contexts/AuthContext';
import { SaveIcon } from './icons/SaveIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { ProjectIcon } from './icons/ProjectIcon';
import { PlusCircleIcon } from './icons/PlusCircleIcon';


interface ProfileFormProps {
  profileData: ProfileData;
  setProfileData: React.Dispatch<React.SetStateAction<ProfileData>>;
  onNext: () => void;
}

const ProfileForm: React.FC<ProfileFormProps> = ({ profileData, setProfileData, onNext }) => {
  const { currentUser, saveTemplate } = useContext(AuthContext);
  const [isLinkedInModalOpen, setIsLinkedInModalOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isTemplateDropdownOpen, setIsTemplateDropdownOpen] = useState(false);

  const handleChange = <T,>(
    section: keyof ProfileData,
    index: number,
    field: keyof T,
    value: string
  ) => {
    const updatedSection = [...(profileData[section] as T[])] as T[];
    updatedSection[index] = { ...updatedSection[index], [field]: value };
    setProfileData({ ...profileData, [section]: updatedSection });
  };

  const handleSimpleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const handleSkillChange = (index: number, value: string) => {
    const updatedSkills = [...profileData.skills];
    updatedSkills[index] = value;
    setProfileData({ ...profileData, skills: updatedSkills });
  };
  
  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const reader = new FileReader();
        reader.onload = (event) => {
            setProfileData({ ...profileData, profilePicture: event.target?.result as string });
        };
        reader.readAsDataURL(e.target.files[0]);
    }
  };

  const addField = <T,>(section: keyof ProfileData, newItem: T) => {
    setProfileData({
      ...profileData,
      [section]: [...(profileData[section] as T[]), newItem],
    });
  };

  const removeField = (section: keyof ProfileData, index: number) => {
    const updatedSection = (profileData[section] as any[]).filter((_, i) => i !== index);
    setProfileData({ ...profileData, [section]: updatedSection });
  };
  
  const addWorkExperience = () => addField<WorkExperience>('workExperience', { jobTitle: '', company: '', startDate: '', endDate: '', responsibilities: '' });
  const addEducation = () => addField<Education>('education', { institution: '', degree: '', fieldOfStudy: '', graduationDate: '' });
  const addSkill = () => addField<string>('skills', '');
  const addCertification = () => addField<Certification>('certifications', { name: '', issuingOrganization: '', date: '' });
  const addReference = () => addField<Reference>('references', { name: '', title: '', company: '', phone: '', email: '' });
  const addProject = () => addField<Project>('projects', { title: '', date: '', description: '' });
  const addAdditionalExperience = () => addField<AdditionalExperience>('additionalExperience', { title: '', date: '', description: '' });

  const handleLinkedInConnect = () => {
    setIsLinkedInModalOpen(true);
    setImportError(null);
  };
  
  const handleImportFromLinkedIn = async (profileText: string) => {
    setIsImporting(true);
    setImportError(null);
    try {
        const parsedData = await parseLinkedInProfile(profileText);
        
        setProfileData(currentData => {
            const parsedWorkExp = parsedData.workExperience && parsedData.workExperience.length > 0
                ? parsedData.workExperience.map(exp => ({ 
                    jobTitle: exp.jobTitle || '', 
                    company: exp.company || '', 
                    startDate: exp.startDate || '', 
                    endDate: exp.endDate || '', 
                    responsibilities: String(exp.responsibilities || '')
                })) 
                : currentData.workExperience;
            
            const parsedEducation = parsedData.education && parsedData.education.length > 0
                ? parsedData.education.map(edu => ({
                    institution: edu.institution || '',
                    degree: edu.degree || '',
                    fieldOfStudy: edu.fieldOfStudy || '',
                    graduationDate: edu.graduationDate || '',
                }))
                : currentData.education;
            
            const parsedCerts = parsedData.certifications && parsedData.certifications.length > 0
                ? parsedData.certifications.map(cert => ({
                    name: cert.name || '',
                    issuingOrganization: cert.issuingOrganization || '',
                    date: cert.date || '',
                }))
                : currentData.certifications;

            return {
                ...currentData,
                fullName: parsedData.fullName || currentData.fullName,
                email: parsedData.email || currentData.email,
                phone: parsedData.phone || currentData.phone,
                summary: parsedData.summary || currentData.summary,
                workExperience: parsedWorkExp,
                education: parsedEducation,
                skills: parsedData.skills && parsedData.skills.length > 0 ? parsedData.skills : currentData.skills,
                certifications: parsedCerts,
                references: parsedData.references && parsedData.references.length > 0 ? parsedData.references : currentData.references,
            };
        });

        setIsLinkedInModalOpen(false);
    } catch (error) {
        console.error("Failed to parse LinkedIn profile:", error);
        setImportError("Sorry, we couldn't parse that profile. Please check the copied text and try again.");
    } finally {
        setIsImporting(false);
    }
  };

  const handleSaveTemplate = (templateName: string) => {
    if (templateName.trim()) {
        saveTemplate(templateName.trim(), profileData);
        setIsSaveModalOpen(false);
    }
  };

  const handleSelectTemplate = (template: TemplateEntry) => {
    // Sanitize loaded data to prevent errors with empty arrays
    const sanitizedData = {
        ...template.data,
        roleAppliedFor: template.data.roleAppliedFor || '',
        linkedinUrl: template.data.linkedinUrl || '',
        workExperience: template.data.workExperience?.length > 0 ? template.data.workExperience : [{ jobTitle: '', company: '', startDate: '', endDate: '', responsibilities: '' }],
        education: template.data.education?.length > 0 ? template.data.education : [{ institution: '', degree: '', fieldOfStudy: '', graduationDate: '' }],
        skills: template.data.skills || [],
        certifications: template.data.certifications || [],
        references: template.data.references || [],
        projects: template.data.projects || [],
        additionalExperience: template.data.additionalExperience || [],
    };
    setProfileData(sanitizedData);
    setIsTemplateDropdownOpen(false);
  };

  return (
    <>
      <div className="space-y-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
              <h2 className="text-xl font-bold text-slate-800">Your Professional Profile</h2>
              <p className="text-sm text-slate-500">Enter your details or load a saved template.</p>
          </div>
          <div className="flex-shrink-0">
            <div className="flex flex-wrap gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsSaveModalOpen(true)}><SaveIcon className="w-4 h-4 mr-2" /> Save Template</Button>
                
                <div className="relative inline-block text-left">
                  <div>
                    <Button variant="outline" onClick={() => setIsTemplateDropdownOpen(prev => !prev)}>
                      Choose Template
                      <ChevronDownIcon className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                  {isTemplateDropdownOpen && (
                     <div 
                        className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10" 
                        role="menu" 
                        aria-orientation="vertical"
                      >
                      <div className="py-1" role="none">
                        {(currentUser?.templates && currentUser.templates.length > 0) ? currentUser.templates.map(template => (
                          <button
                            key={template.id}
                            onClick={() => handleSelectTemplate(template)}
                            className="text-slate-700 block w-full text-left px-4 py-2 text-sm hover:bg-slate-100"
                            role="menuitem"
                          >
                            {template.name}
                          </button>
                        )) : (
                           <p className="px-4 py-2 text-sm text-slate-500">No saved templates.</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <Button onClick={handleLinkedInConnect}><LinkedInIcon className="w-4 h-4 mr-2" /> Connect LinkedIn</Button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">Personal Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            <Input label="Full Name" name="fullName" value={profileData.fullName} onChange={handleSimpleChange} />
            <Input label="Email" name="email" type="email" value={profileData.email} onChange={handleSimpleChange} />
            <Input label="Phone" name="phone" value={profileData.phone} onChange={handleSimpleChange} />
            <Input label="LinkedIn Profile URL" name="linkedinUrl" value={profileData.linkedinUrl} onChange={handleSimpleChange} placeholder="e.g., https://linkedin.com/in/yourname" />
            <div className="flex items-center gap-4 md:col-span-2">
              {profileData.profilePicture && <img src={profileData.profilePicture} alt="Profile" className="w-16 h-16 rounded-full object-cover" />}
              <Input label="Profile Picture" name="profilePicture" type="file" accept="image/*" onChange={handleImageChange} />
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">Role Information</h3>
          <Input
            label="The Role You Are Applying For"
            name="roleAppliedFor"
            value={profileData.roleAppliedFor || ''}
            onChange={(e) => setProfileData({ ...profileData, roleAppliedFor: e.target.value })}
            placeholder="e.g., Senior Software Engineer"
            required
          />
        </div>

        <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Professional Summary</h3>
            <Textarea
                label="Why you're a great fit for the role"
                name="summary"
                value={profileData.summary}
                onChange={(e) => setProfileData({ ...profileData, summary: e.target.value })}
                placeholder="Write a brief summary of your qualifications and career goals..."
                rows={5}
            />
        </div>
        
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2 flex items-center gap-2"><ProjectIcon className="w-5 h-5" /> Projects</h3>
          {profileData.projects.map((project, index) => (
            <div key={index} className="p-4 border rounded-lg space-y-4 relative">
              {profileData.projects.length > 0 && <button onClick={() => removeField('projects', index)} className="absolute top-2 right-2 text-slate-400 hover:text-red-500">&times;</button>}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Project Title" value={project.title} onChange={(e) => handleChange('projects', index, 'title', e.target.value)} />
                <Input label="Date or Duration" placeholder="e.g., Oct 2023 or 2022-2023" value={project.date} onChange={(e) => handleChange('projects', index, 'date', e.target.value)} />
              </div>
              <Textarea
                label="Description"
                value={project.description}
                onChange={(e) => handleChange('projects', index, 'description', e.target.value)}
                placeholder="Describe your project..."
                rows={4}
              />
            </div>
          ))}
          <Button variant="secondary" onClick={addProject}>+ Add Project</Button>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2 flex items-center gap-2"><BriefcaseIcon className="w-5 h-5" /> Work Experience</h3>
          {profileData.workExperience.map((exp, index) => (
            <div key={index} className="p-4 border rounded-lg space-y-4 relative">
              {profileData.workExperience.length > 1 && <button onClick={() => removeField('workExperience', index)} className="absolute top-2 right-2 text-slate-400 hover:text-red-500">&times;</button>}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Job Title" value={exp.jobTitle} onChange={(e) => handleChange('workExperience', index, 'jobTitle', e.target.value)} />
                <Input label="Company" value={exp.company} onChange={(e) => handleChange('workExperience', index, 'company', e.target.value)} />
                <Input label="Start Date" type="text" placeholder="e.g., Jan 2020" value={exp.startDate} onChange={(e) => handleChange('workExperience', index, 'startDate', e.target.value)} />
                <Input label="End Date" type="text" placeholder="e.g., Present" value={exp.endDate} onChange={(e) => handleChange('workExperience', index, 'endDate', e.target.value)} />
              </div>
              <Textarea
                label="Responsibilities"
                value={exp.responsibilities as string}
                onChange={(e) => handleChange('workExperience', index, 'responsibilities', e.target.value)}
                placeholder="Describe your responsibilities and achievements in bullet points..."
                rows={5}
              />
            </div>
          ))}
          <Button variant="secondary" onClick={addWorkExperience}>+ Add Experience</Button>
        </div>
        
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2 flex items-center gap-2"><PlusCircleIcon className="w-5 h-5" /> Additional Experience</h3>
          {profileData.additionalExperience.map((exp, index) => (
            <div key={index} className="p-4 border rounded-lg space-y-4 relative">
              {profileData.additionalExperience.length > 0 && <button onClick={() => removeField('additionalExperience', index)} className="absolute top-2 right-2 text-slate-400 hover:text-red-500">&times;</button>}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Title" placeholder="e.g., Volunteer Work, Leadership" value={exp.title} onChange={(e) => handleChange('additionalExperience', index, 'title', e.target.value)} />
                <Input label="Date or Duration" placeholder="e.g., Aug 2023" value={exp.date} onChange={(e) => handleChange('additionalExperience', index, 'date', e.target.value)} />
              </div>
              <Textarea
                label="Description"
                value={exp.description}
                onChange={(e) => handleChange('additionalExperience', index, 'description', e.target.value)}
                placeholder="Describe your experience..."
                rows={4}
              />
            </div>
          ))}
          <Button variant="secondary" onClick={addAdditionalExperience}>+ Add More Experience</Button>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2 flex items-center gap-2"><EducationIcon className="w-5 h-5" /> Education</h3>
          {profileData.education.map((edu, index) => (
            <div key={index} className="p-4 border rounded-lg space-y-4 relative">
              {profileData.education.length > 1 && <button onClick={() => removeField('education', index)} className="absolute top-2 right-2 text-slate-400 hover:text-red-500">&times;</button>}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Institution" value={edu.institution} onChange={(e) => handleChange('education', index, 'institution', e.target.value)} />
                <Input label="Degree" value={edu.degree} onChange={(e) => handleChange('education', index, 'degree', e.target.value)} />
                <Input label="Field of Study" value={edu.fieldOfStudy} onChange={(e) => handleChange('education', index, 'fieldOfStudy', e.target.value)} />
                <Input label="Graduation Date" type="text" placeholder="e.g., May 2021 or 2017 - 2021" value={edu.graduationDate} onChange={(e) => handleChange('education',index, 'graduationDate', e.target.value)} />
              </div>
            </div>
          ))}
          <Button variant="secondary" onClick={addEducation}>+ Add Education</Button>
        </div>

        <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2 flex items-center gap-2"><KeyIcon className="w-5 h-5" /> Skills</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {profileData.skills.map((skill, index) => (
                    <div key={index} className="relative flex items-center">
                        <Input 
                            value={skill} 
                            onChange={(e) => handleSkillChange(index, e.target.value)}
                            placeholder="e.g., JavaScript"
                            className="pr-8"
                        />
                        <button onClick={() => removeField('skills', index)} className="absolute top-1/2 right-2 -translate-y-1/2 text-slate-400 hover:text-red-500 text-lg font-bold">&times;</button>
                    </div>
                ))}
            </div>
            <Button variant="secondary" onClick={addSkill}>+ Add Skill</Button>
        </div>

        <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2 flex items-center gap-2"><CertificationIcon className="w-5 h-5" /> Licenses & Certifications</h3>
            {profileData.certifications.map((cert, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-4 relative">
                    {profileData.certifications.length > 1 && <button onClick={() => removeField('certifications', index)} className="absolute top-2 right-2 text-slate-400 hover:text-red-500">&times;</button>}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="Certification Name" value={cert.name} onChange={(e) => handleChange('certifications', index, 'name', e.target.value)} />
                        <Input label="Issuing Organization" value={cert.issuingOrganization} onChange={(e) => handleChange('certifications', index, 'issuingOrganization', e.target.value)} />
                        <Input label="Date Issued" type="text" placeholder="e.g., Aug 2022" value={cert.date} onChange={(e) => handleChange('certifications', index, 'date', e.target.value)} />
                    </div>
                </div>
            ))}
            <Button variant="secondary" onClick={addCertification}>+ Add Certification</Button>
        </div>

         <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2 flex items-center gap-2"><UserCircleIcon className="w-5 h-5" /> References</h3>
            {profileData.references.map((ref, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-4 relative">
                    {profileData.references.length > 1 && <button onClick={() => removeField('references', index)} className="absolute top-2 right-2 text-slate-400 hover:text-red-500">&times;</button>}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="Full Name" value={ref.name} onChange={(e) => handleChange('references', index, 'name', e.target.value)} />
                        <Input label="Title" value={ref.title} onChange={(e) => handleChange('references', index, 'title', e.target.value)} />
                        <Input label="Company" value={ref.company} onChange={(e) => handleChange('references', index, 'company', e.target.value)} />
                        <Input label="Phone" value={ref.phone} onChange={(e) => handleChange('references', index, 'phone', e.target.value)} />
                        <Input label="Email" value={ref.email} onChange={(e) => handleChange('references', index, 'email', e.target.value)} className="md:col-span-2"/>
                    </div>
                </div>
            ))}
            <Button variant="secondary" onClick={addReference}>+ Add Reference</Button>
        </div>
        
        <div className="text-right">
          <Button 
            onClick={onNext}
            disabled={!profileData.fullName.trim() || !profileData.roleAppliedFor?.trim()}
          >
            Next: The Job <ChevronRightIcon className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
      <LinkedInImportModal
        isOpen={isLinkedInModalOpen}
        onClose={() => setIsLinkedInModalOpen(false)}
        onImport={handleImportFromLinkedIn}
        isImporting={isImporting}
        error={importError}
      />
      <SaveTemplateModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        onSave={handleSaveTemplate}
        initialData={profileData}
      />
    </>
  );
};

export default ProfileForm;