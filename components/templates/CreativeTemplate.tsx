import React, { useState, useEffect } from 'react';
import { TailoredResumeData } from '../../types';
import ContentEditable from 'react-contenteditable';
import { produce } from 'immer';

interface Props {
  data: TailoredResumeData;
  onUpdate: (data: TailoredResumeData) => void;
  onBlurRecalculate: () => void;
  profilePicture: string | null | undefined;
}

const SkillBar: React.FC<{ skill: string, onUpdate: (val: string) => void, onBlur: () => void }> = ({ skill, onUpdate, onBlur }) => (
    <div>
        <ContentEditable html={skill} onChange={e => onUpdate(e.target.value)} onBlur={onBlur} tagName="p" className="text-xs mb-1 outline-none focus:bg-gray-700" />
        <div className="h-1.5 w-full bg-gray-600 rounded-full">
            <div className="h-1.5 bg-green-400 rounded-full" style={{ width: `${70 + Math.random() * 25}%` }}></div>
        </div>
    </div>
);

const MainSection: React.FC<{title: string, children: React.ReactNode}> = ({ title, children }) => (
    <div className="mb-8">
        <h2 className="text-lg font-bold uppercase border-b-2 border-green-400 pb-2 mb-4">{title}</h2>
        <div className="space-y-6">
            {children}
        </div>
    </div>
);

export const CreativeTemplate: React.FC<Props> = ({ data, onUpdate, onBlurRecalculate, profilePicture }) => {
  const [content, setContent] = useState(data);

  useEffect(() => {
    setContent(data);
  }, [data]);

  const handleNestedChange = (path: (string|number)[], value: any) => {
    const newState = produce(content, draft => {
        let current: any = draft;
        for (let i = 0; i < path.length - 1; i++) {
            current = current[path[i]];
        }
        current[path[path.length-1]] = value;
    });
    setContent(newState);
    onUpdate(newState);
  };
  
  return (
    <div className="flex font-sans bg-[#1A2E29] text-white min-h-[1123px]">
      <main className="w-2/3 p-8">
        <div className="mb-8">
            <ContentEditable html={content.fullName} onChange={e => handleNestedChange(['fullName'], e.target.value)} onBlur={onBlurRecalculate} tagName="h1" className="text-5xl font-bold outline-none focus:bg-gray-700" />
            <ContentEditable html={content.jobTitle} onChange={e => handleNestedChange(['jobTitle'], e.target.value)} onBlur={onBlurRecalculate} tagName="p" className="text-green-400 text-xl font-medium mt-1 outline-none focus:bg-gray-700" />
            <ContentEditable
                html={content.summary}
                onChange={(e) => handleNestedChange(['summary'], e.target.value)}
                onBlur={onBlurRecalculate}
                tagName="div"
                className="text-xs text-gray-300 mt-4 leading-relaxed outline-none focus:bg-gray-700"
            />
        </div>
        
        <MainSection title="Work Experience">
            {(content.workExperience || []).map((exp, index) => (
                <div key={index}>
                    <ContentEditable html={exp.jobTitle} onChange={e => handleNestedChange(['workExperience', index, 'jobTitle'], e.target.value)} onBlur={onBlurRecalculate} tagName="h3" className="text-md font-semibold outline-none focus:bg-gray-700" />
                    <ContentEditable html={exp.company} onChange={e => handleNestedChange(['workExperience', index, 'company'], e.target.value)} onBlur={onBlurRecalculate} tagName="p" className="text-sm text-gray-300 outline-none focus:bg-gray-700" />
                    <p className="text-xs text-gray-400 mb-2">
                        <ContentEditable html={exp.startDate} onChange={e => handleNestedChange(['workExperience', index, 'startDate'], e.target.value)} onBlur={onBlurRecalculate} tagName="span" className="outline-none focus:bg-gray-700" /> - <ContentEditable html={exp.endDate} onChange={e => handleNestedChange(['workExperience', index, 'endDate'], e.target.value)} onBlur={onBlurRecalculate} tagName="span" className="outline-none focus:bg-gray-700" />
                    </p>
                     <ul className="list-disc list-outside pl-5 text-xs text-gray-300 space-y-1">
                        {(exp.responsibilities || []).map((resp, i) => (
                            <li key={i}>
                                <ContentEditable
                                    html={resp}
                                    onChange={(e) => handleNestedChange(['workExperience', index, 'responsibilities', i], e.target.value)}
                                    onBlur={onBlurRecalculate}
                                    tagName="span"
                                    className="block outline-none focus:bg-gray-700"
                                />
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
        </MainSection>

        {(content.projects && content.projects.length > 0) && (
            <MainSection title="Projects">
                {(content.projects || []).map((proj, index) => (
                    <div key={index}>
                        <ContentEditable html={proj.title} onChange={e => handleNestedChange(['projects', index, 'title'], e.target.value)} onBlur={onBlurRecalculate} tagName="h3" className="text-md font-semibold outline-none focus:bg-gray-700" />
                        <p className="text-xs text-gray-400 mb-2">
                           <ContentEditable html={proj.date} onChange={e => handleNestedChange(['projects', index, 'date'], e.target.value)} onBlur={onBlurRecalculate} tagName="span" className="outline-none focus:bg-gray-700" />
                        </p>
                        <ContentEditable
                            html={proj.description}
                            onChange={(e) => handleNestedChange(['projects', index, 'description'], e.target.value)}
                            onBlur={onBlurRecalculate}
                            tagName="div"
                            className="text-xs text-gray-300 leading-relaxed outline-none focus:bg-gray-700"
                        />
                    </div>
                ))}
            </MainSection>
        )}

        {(content.additionalExperience && content.additionalExperience.length > 0) && (
            <MainSection title="Additional Experience">
                {(content.additionalExperience || []).map((exp, index) => (
                    <div key={index}>
                        <ContentEditable html={exp.title} onChange={e => handleNestedChange(['additionalExperience', index, 'title'], e.target.value)} onBlur={onBlurRecalculate} tagName="h3" className="text-md font-semibold outline-none focus:bg-gray-700" />
                        <p className="text-xs text-gray-400 mb-2">
                           <ContentEditable html={exp.date} onChange={e => handleNestedChange(['additionalExperience', index, 'date'], e.target.value)} onBlur={onBlurRecalculate} tagName="span" className="outline-none focus:bg-gray-700" />
                        </p>
                        <ContentEditable
                            html={exp.description}
                            onChange={(e) => handleNestedChange(['additionalExperience', index, 'description'], e.target.value)}
                            onBlur={onBlurRecalculate}
                            tagName="div"
                            className="text-xs text-gray-300 leading-relaxed outline-none focus:bg-gray-700"
                        />
                    </div>
                ))}
            </MainSection>
        )}

        {(content.references && content.references.length > 0) && (
            <div>
                <h2 className="text-lg font-bold uppercase border-b-2 border-green-400 pb-2 mb-4">References</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {(content.references || []).map((ref, index) => (
                        <div key={index} className="text-xs">
                            <ContentEditable html={ref.name} onChange={e => handleNestedChange(['references', index, 'name'], e.target.value)} onBlur={onBlurRecalculate} tagName="h3" className="text-md font-semibold text-green-400 outline-none focus:bg-gray-700" />
                            <ContentEditable html={ref.title} onChange={e => handleNestedChange(['references', index, 'title'], e.target.value)} onBlur={onBlurRecalculate} tagName="p" className="text-gray-300 outline-none focus:bg-gray-700" />
                            <ContentEditable html={ref.company} onChange={e => handleNestedChange(['references', index, 'company'], e.target.value)} onBlur={onBlurRecalculate} tagName="p" className="text-gray-300 outline-none focus:bg-gray-700" />
                            <p className="text-gray-400 mt-2">
                                P: <ContentEditable html={ref.phone} onChange={e => handleNestedChange(['references', index, 'phone'], e.target.value)} onBlur={onBlurRecalculate} tagName="span" className="outline-none focus:bg-gray-700" />
                            </p>
                            <p className="text-gray-400">
                                E: <ContentEditable html={ref.email} onChange={e => handleNestedChange(['references', index, 'email'], e.target.value)} onBlur={onBlurRecalculate} tagName="span" className="outline-none focus:bg-gray-700" />
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        )}
      </main>
      <aside className="w-1/3 bg-[#11201D] p-8">
        <div className="w-32 h-32 mx-auto mb-8">
            <img src={profilePicture || 'https://i.imgur.com/8bX5asj.png'} alt={content.fullName} className="rounded-full w-full h-full object-cover border-4 border-green-400" />
        </div>
        
        <section className="mb-8">
            <h2 className="text-lg font-bold uppercase mb-3">Education</h2>
            {(content.education || []).map((edu, index) => (
                <div key={index} className="mb-3">
                    <ContentEditable html={edu.degree} onChange={e => handleNestedChange(['education', index, 'degree'], e.target.value)} onBlur={onBlurRecalculate} tagName="h3" className="text-sm font-semibold outline-none focus:bg-gray-700" />
                    <ContentEditable html={edu.institution} onChange={e => handleNestedChange(['education', index, 'institution'], e.target.value)} onBlur={onBlurRecalculate} tagName="p" className="text-xs text-gray-300 outline-none focus:bg-gray-700" />
                    <ContentEditable html={edu.graduationDate} onChange={e => handleNestedChange(['education', index, 'graduationDate'], e.target.value)} onBlur={onBlurRecalculate} tagName="p" className="text-xs text-gray-400 outline-none focus:bg-gray-700" />
                </div>
            ))}
        </section>

        <section className="mb-8">
            <h2 className="text-lg font-bold uppercase mb-4">Skills</h2>
            <div className="space-y-3">
               {(content.skills || []).map((skill, index) => <SkillBar key={index} skill={skill} onUpdate={val => handleNestedChange(['skills', index], val)} onBlur={onBlurRecalculate} />)}
            </div>
        </section>
        
        {(content.certifications && content.certifications.length > 0) && (
            <section className="mb-8">
                <h2 className="text-lg font-bold uppercase mb-3">Certifications</h2>
                {(content.certifications || []).map((cert, index) => (
                    <div key={index} className="mb-3 text-xs">
                        <ContentEditable html={cert.name} onChange={e => handleNestedChange(['certifications', index, 'name'], e.target.value)} onBlur={onBlurRecalculate} tagName="h3" className="font-semibold outline-none focus:bg-gray-700" />
                        <ContentEditable html={cert.issuingOrganization} onChange={e => handleNestedChange(['certifications', index, 'issuingOrganization'], e.target.value)} onBlur={onBlurRecalculate} tagName="p" className="text-gray-300 outline-none focus:bg-gray-700" />
                        <ContentEditable html={cert.date} onChange={e => handleNestedChange(['certifications', index, 'date'], e.target.value)} onBlur={onBlurRecalculate} tagName="p" className="text-gray-400 outline-none focus:bg-gray-700" />
                    </div>
                ))}
            </section>
        )}

        <section>
            <h2 className="text-lg font-bold uppercase mb-3">Contact Info</h2>
            <div className="text-xs space-y-2 text-gray-300">
                <p><strong>Phone:</strong> <ContentEditable html={content.contact?.phone || ''} onChange={e => handleNestedChange(['contact', 'phone'], e.target.value)} onBlur={onBlurRecalculate} tagName="span" className="outline-none focus:bg-gray-700" /></p>
                <p><strong>Email:</strong> <ContentEditable html={content.contact?.email || ''} onChange={e => handleNestedChange(['contact', 'email'], e.target.value)} onBlur={onBlurRecalculate} tagName="span" className="outline-none focus:bg-gray-700" /></p>
                {content.contact?.website && <p><strong>Website:</strong> <ContentEditable html={content.contact?.website || ''} onChange={e => handleNestedChange(['contact', 'website'], e.target.value)} onBlur={onBlurRecalculate} tagName="span" className="outline-none focus:bg-gray-700" /></p>}
                {content.contact?.linkedinUrl && <p><strong>LinkedIn:</strong> <ContentEditable html={content.contact?.linkedinUrl || ''} onChange={e => handleNestedChange(['contact', 'linkedinUrl'], e.target.value)} onBlur={onBlurRecalculate} tagName="span" className="outline-none focus:bg-gray-700" /></p>}
                <p><strong>Address:</strong> <ContentEditable html={content.contact?.address || ''} onChange={e => handleNestedChange(['contact', 'address'], e.target.value)} onBlur={onBlurRecalculate} tagName="span" className="outline-none focus:bg-gray-700" /></p>
            </div>
        </section>
      </aside>
    </div>
  );
};