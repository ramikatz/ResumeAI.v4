

import React, { useState, useEffect } from 'react';
import { TailoredResumeData } from '../../types';
import ContentEditable from 'react-contenteditable';
import { produce } from 'immer';

interface Props {
  data: TailoredResumeData;
  onUpdate: (data: TailoredResumeData) => void;
  onBlurRecalculate: () => void;
  profilePicture?: string | null; // Not used in this template, but kept for consistency
}

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <section className="mt-8">
        <h2 className="text-center text-sm font-bold text-blue-700 border-b border-gray-300 pb-1 mb-4 uppercase tracking-widest">
            {title}
        </h2>
        {children}
    </section>
);


export const MinimalistTemplate: React.FC<Props> = ({ data, onUpdate, onBlurRecalculate }) => {
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

  const contactItems = [
    { key: 'address', value: content.contact?.address },
    { key: 'phone', value: content.contact?.phone },
    { key: 'email', value: content.contact?.email },
    { key: 'website', value: content.contact?.website },
    { key: 'linkedinUrl', value: content.contact?.linkedinUrl },
  ].filter(item => item.value);
  
  return (
    <div className="bg-white p-12 font-sans text-gray-800 text-sm">
      <header className="text-center mb-10">
        <ContentEditable html={content.fullName} onBlur={onBlurRecalculate} onChange={e => handleNestedChange(['fullName'], e.target.value)} tagName="h1" className="text-4xl font-bold uppercase tracking-wider outline-none focus:bg-slate-100" />
        <ContentEditable html={content.jobTitle} onBlur={onBlurRecalculate} onChange={e => handleNestedChange(['jobTitle'], e.target.value)} tagName="p" className="text-lg mt-1 text-gray-600 outline-none focus:bg-slate-100" />
        <div className="text-xs text-gray-500 mt-3">
          {contactItems.map((item, index) => (
            <React.Fragment key={item.key}>
                <ContentEditable
                    html={item.value || ''}
                    onChange={e => handleNestedChange(['contact', item.key as keyof TailoredResumeData['contact']], e.target.value)}
                    onBlur={onBlurRecalculate}
                    tagName="span"
                    className="outline-none focus:bg-slate-100"
                />
                {index < contactItems.length - 1 && <span className="mx-2">|</span>}
            </React.Fragment>
          ))}
        </div>
      </header>

      <main>
        <Section title="Summary">
          <ContentEditable html={content.summary} onBlur={onBlurRecalculate} onChange={e => handleNestedChange(['summary'], e.target.value)} tagName="p" className="text-center text-xs leading-relaxed outline-none focus:bg-slate-100" />
        </Section>

        <Section title="Professional Experience">
           {(content.workExperience || []).map((exp, index) => (
            <div key={index} className="mb-5">
              <div className="flex justify-between items-baseline">
                <ContentEditable html={exp.jobTitle} onBlur={onBlurRecalculate} onChange={e => handleNestedChange(['workExperience', index, 'jobTitle'], e.target.value)} tagName="h3" className="text-md font-bold outline-none focus:bg-slate-100" />
                <p className="text-xs text-gray-600">
                    <ContentEditable html={exp.startDate} onBlur={onBlurRecalculate} onChange={e => handleNestedChange(['workExperience', index, 'startDate'], e.target.value)} tagName="span" className="outline-none focus:bg-slate-100" /> - <ContentEditable html={exp.endDate} onBlur={onBlurRecalculate} onChange={e => handleNestedChange(['workExperience', index, 'endDate'], e.target.value)} tagName="span" className="outline-none focus:bg-slate-100" />
                </p>
              </div>
              <ContentEditable html={exp.company} onBlur={onBlurRecalculate} onChange={e => handleNestedChange(['workExperience', index, 'company'], e.target.value)} tagName="p" className="italic text-sm text-gray-700 outline-none focus:bg-slate-100" />
              <ul className="list-disc list-outside pl-5 mt-2 text-xs space-y-1 text-gray-600">
                {(exp.responsibilities || []).map((resp, i) => <li key={i}><ContentEditable html={resp} onBlur={onBlurRecalculate} onChange={e => handleNestedChange(['workExperience', index, 'responsibilities', i], e.target.value)} tagName="span" className="block outline-none focus:bg-slate-100" /></li>)}
              </ul>
            </div>
           ))}
        </Section>

        {(content.projects && content.projects.length > 0) && (
            <Section title="Projects">
                {(content.projects || []).map((proj, index) => (
                    <div key={index} className="mb-5">
                        <div className="flex justify-between items-baseline">
                            <ContentEditable html={proj.title} onBlur={onBlurRecalculate} onChange={e => handleNestedChange(['projects', index, 'title'], e.target.value)} tagName="h3" className="text-md font-bold outline-none focus:bg-slate-100" />
                            <p className="text-xs text-gray-600">
                                <ContentEditable html={proj.date} onBlur={onBlurRecalculate} onChange={e => handleNestedChange(['projects', index, 'date'], e.target.value)} tagName="span" className="outline-none focus:bg-slate-100" />
                            </p>
                        </div>
                        <ContentEditable html={proj.description} onBlur={onBlurRecalculate} onChange={e => handleNestedChange(['projects', index, 'description'], e.target.value)} tagName="p" className="mt-2 text-xs text-gray-600 outline-none focus:bg-slate-100" />
                    </div>
                ))}
            </Section>
        )}
        
        {(content.additionalExperience && content.additionalExperience.length > 0) && (
            <Section title="Additional Experience">
                {(content.additionalExperience || []).map((exp, index) => (
                     <div key={index} className="mb-5">
                        <div className="flex justify-between items-baseline">
                            <ContentEditable html={exp.title} onBlur={onBlurRecalculate} onChange={e => handleNestedChange(['additionalExperience', index, 'title'], e.target.value)} tagName="h3" className="text-md font-bold outline-none focus:bg-slate-100" />
                            <p className="text-xs text-gray-600">
                                <ContentEditable html={exp.date} onBlur={onBlurRecalculate} onChange={e => handleNestedChange(['additionalExperience', index, 'date'], e.target.value)} tagName="span" className="outline-none focus:bg-slate-100" />
                            </p>
                        </div>
                        <ContentEditable html={exp.description} onBlur={onBlurRecalculate} onChange={e => handleNestedChange(['additionalExperience', index, 'description'], e.target.value)} tagName="p" className="mt-2 text-xs text-gray-600 outline-none focus:bg-slate-100" />
                    </div>
                ))}
            </Section>
        )}
        
        <Section title="Education">
           {(content.education || []).map((edu, index) => (
            <div key={index} className="text-center mb-3">
                <ContentEditable html={edu.institution} onBlur={onBlurRecalculate} onChange={e => handleNestedChange(['education', index, 'institution'], e.target.value)} tagName="h3" className="text-md font-bold outline-none focus:bg-slate-100" />
                <p className="text-sm">
                    <ContentEditable html={edu.degree} onBlur={onBlurRecalculate} onChange={(e) => handleNestedChange(['education', index, 'degree'], e.target.value)} tagName="span" className="outline-none focus:bg-slate-100" />{edu.fieldOfStudy && ' in '}<ContentEditable html={edu.fieldOfStudy || ''} onBlur={onBlurRecalculate} onChange={(e) => handleNestedChange(['education', index, 'fieldOfStudy'], e.target.value)} tagName="span" className="outline-none focus:bg-slate-100" />
                </p>
                <ContentEditable html={edu.graduationDate} onBlur={onBlurRecalculate} onChange={e => handleNestedChange(['education', index, 'graduationDate'], e.target.value)} tagName="p" className="text-xs text-gray-500 outline-none focus:bg-slate-100" />
            </div>
           ))}
        </Section>
        
         <Section title="Technical Skills">
            <div className="text-center text-xs">
                {(content.skills || []).map((skill, index) => (
                    <React.Fragment key={index}>
                        <ContentEditable 
                            html={skill} 
                            onChange={e => handleNestedChange(['skills', index], e.target.value)}
                            onBlur={onBlurRecalculate}
                            tagName="span"
                            className="inline-block outline-none focus:bg-slate-100"
                        />
                        {index < (content.skills || []).length - 1 && <span className="mx-2 text-gray-400">•</span>}
                    </React.Fragment>
                ))}
            </div>
        </Section>

        {(content.certifications && content.certifications.length > 0) && (
            <Section title="Certifications">
                {(content.certifications || []).map((cert, index) => (
                    <div key={index} className="text-center mb-2 text-xs">
                        <p className="font-bold">
                            <ContentEditable html={cert.name} onBlur={onBlurRecalculate} onChange={(e) => handleNestedChange(['certifications', index, 'name'], e.target.value)} tagName="span" className="outline-none focus:bg-slate-100" />
                        </p>
                        <p className="text-gray-600">
                             <ContentEditable html={cert.issuingOrganization} onBlur={onBlurRecalculate} onChange={(e) => handleNestedChange(['certifications', index, 'issuingOrganization'], e.target.value)} tagName="span" className="outline-none focus:bg-slate-100" /> - <ContentEditable html={cert.date} onBlur={onBlurRecalculate} onChange={(e) => handleNestedChange(['certifications', index, 'date'], e.target.value)} tagName="span" className="outline-none focus:bg-slate-100" />
                        </p>
                    </div>
                ))}
            </Section>
        )}

        {(content.references && content.references.length > 0) && (
            <Section title="References">
                <div className="text-center text-xs grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(content.references || []).map((ref, index) => (
                        <div key={index}>
                            <p className="font-bold">
                                <ContentEditable html={ref.name} onBlur={onBlurRecalculate} onChange={(e) => handleNestedChange(['references', index, 'name'], e.target.value)} tagName="span" className="outline-none focus:bg-slate-100" />
                            </p>
                            <p className="text-gray-600">
                                <ContentEditable html={ref.title} onBlur={onBlurRecalculate} onChange={(e) => handleNestedChange(['references', index, 'title'], e.target.value)} tagName="span" className="outline-none focus:bg-slate-100" />
                            </p>
                             <p className="text-gray-600">
                                <ContentEditable html={ref.phone} onBlur={onBlurRecalculate} onChange={(e) => handleNestedChange(['references', index, 'phone'], e.target.value)} tagName="span" className="outline-none focus:bg-slate-100" />
                            </p>
                             <p className="text-gray-600">
                                <ContentEditable html={ref.email} onBlur={onBlurRecalculate} onChange={(e) => handleNestedChange(['references', index, 'email'], e.target.value)} tagName="span" className="outline-none focus:bg-slate-100" />
                            </p>
                        </div>
                    ))}
                </div>
            </Section>
        )}
      </main>
    </div>
  );
};