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

const SidebarSection: React.FC<{title: string, children: React.ReactNode}> = ({ title, children }) => (
    <section className="mb-6">
        <h2 className="text-white text-sm font-bold uppercase tracking-wider border-b border-gray-500 pb-2 mb-3">{title}</h2>
        {children}
    </section>
);

const MainSection: React.FC<{title: string, children: React.ReactNode}> = ({ title, children }) => (
    <section className="mb-6">
        <h2 className="text-blue-900 text-lg font-bold uppercase tracking-wider pb-2 mb-3">{title}</h2>
        {children}
    </section>
);


export const ElegantTemplate: React.FC<Props> = ({ data, onUpdate, onBlurRecalculate, profilePicture }) => {
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
    <div className="flex font-sans text-gray-800 min-h-[1123px]">
      <aside className="w-1/3 bg-gray-800 text-gray-300 p-8">
        <div className="w-32 h-32 mx-auto mb-8">
            <img src={profilePicture || 'https://i.imgur.com/8bX5asj.png'} alt={content.fullName} className="rounded-full w-full h-full object-cover border-4 border-gray-500" />
        </div>
        
        <SidebarSection title="Contact">
            <div className="text-xs space-y-2">
                <p><strong>Phone:</strong><br /><ContentEditable html={content.contact?.phone || ''} onChange={e => handleNestedChange(['contact', 'phone'], e.target.value)} onBlur={onBlurRecalculate} tagName="span" className="block outline-none focus:bg-gray-700" /></p>
                <p><strong>Email:</strong><br /><ContentEditable html={content.contact?.email || ''} onChange={e => handleNestedChange(['contact', 'email'], e.target.value)} onBlur={onBlurRecalculate} tagName="span" className="block outline-none focus:bg-gray-700" /></p>
                <p><strong>Address:</strong><br /><ContentEditable html={content.contact?.address || ''} onChange={e => handleNestedChange(['contact', 'address'], e.target.value)} onBlur={onBlurRecalculate} tagName="span" className="block outline-none focus:bg-gray-700" /></p>
                {content.contact?.linkedinUrl && <p><strong>LinkedIn:</strong><br /><ContentEditable html={content.contact.linkedinUrl} onChange={e => handleNestedChange(['contact', 'linkedinUrl'], e.target.value)} onBlur={onBlurRecalculate} tagName="span" className="block outline-none focus:bg-gray-700" /></p>}
            </div>
        </SidebarSection>
        
        <SidebarSection title="Education">
            {(content.education || []).map((edu, index) => (
                <div key={index} className="mb-3 text-xs">
                    <ContentEditable html={edu.degree} onChange={e => handleNestedChange(['education', index, 'degree'], e.target.value)} onBlur={onBlurRecalculate} tagName="h3" className="font-bold text-white outline-none focus:bg-gray-700" />
                    <ContentEditable html={edu.institution} onChange={e => handleNestedChange(['education', index, 'institution'], e.target.value)} onBlur={onBlurRecalculate} tagName="p" className="outline-none focus:bg-gray-700" />
                    <ContentEditable html={edu.graduationDate} onChange={e => handleNestedChange(['education', index, 'graduationDate'], e.target.value)} onBlur={onBlurRecalculate} tagName="p" className="text-gray-400 outline-none focus:bg-gray-700" />
                </div>
            ))}
        </SidebarSection>

        <SidebarSection title="Skills">
            <ul className="text-xs list-disc list-inside space-y-1">
                {(content.skills || []).map((skill, index) => (
                    <li key={index}>
                        <ContentEditable html={skill} onChange={e => handleNestedChange(['skills', index], e.target.value)} onBlur={onBlurRecalculate} tagName="span" className="outline-none focus:bg-gray-700" />
                    </li>
                ))}
            </ul>
        </SidebarSection>

         {(content.certifications && content.certifications.length > 0) && (
            <SidebarSection title="Certifications">
                {(content.certifications || []).map((cert, index) => (
                    <div key={index} className="mb-3 text-xs">
                        <ContentEditable html={cert.name} onChange={e => handleNestedChange(['certifications', index, 'name'], e.target.value)} onBlur={onBlurRecalculate} tagName="h3" className="font-bold text-white outline-none focus:bg-gray-700" />
                        <ContentEditable html={cert.issuingOrganization} onChange={e => handleNestedChange(['certifications', index, 'issuingOrganization'], e.target.value)} onBlur={onBlurRecalculate} tagName="p" className="outline-none focus:bg-gray-700" />
                    </div>
                ))}
            </SidebarSection>
        )}
      </aside>

      <main className="w-2/3 p-10 bg-white">
        <header className="mb-8">
            <ContentEditable html={content.fullName} onChange={e => handleNestedChange(['fullName'], e.target.value)} onBlur={onBlurRecalculate} tagName="h1" className="text-5xl font-bold text-blue-900 outline-none focus:bg-slate-100" />
            <ContentEditable html={content.jobTitle} onChange={e => handleNestedChange(['jobTitle'], e.target.value)} onBlur={onBlurRecalculate} tagName="p" className="text-xl text-gray-600 font-medium mt-1 outline-none focus:bg-slate-100" />
        </header>

        <MainSection title="Professional Summary">
            <ContentEditable
                html={content.summary}
                onChange={(e) => handleNestedChange(['summary'], e.target.value)}
                onBlur={onBlurRecalculate}
                tagName="p"
                className="text-sm leading-relaxed outline-none focus:bg-slate-100"
            />
        </MainSection>

        <MainSection title="Work Experience">
            {(content.workExperience || []).map((exp, index) => (
                <div key={index} className="mb-5">
                    <div className="flex justify-between items-baseline mb-1">
                        <ContentEditable html={exp.jobTitle} onChange={e => handleNestedChange(['workExperience', index, 'jobTitle'], e.target.value)} onBlur={onBlurRecalculate} tagName="h3" className="text-md font-bold text-gray-900 outline-none focus:bg-slate-100" />
                        <p className="text-sm text-gray-600">
                            <ContentEditable html={exp.startDate} onChange={e => handleNestedChange(['workExperience', index, 'startDate'], e.target.value)} onBlur={onBlurRecalculate} tagName="span" className="outline-none focus:bg-slate-100" /> - <ContentEditable html={exp.endDate} onChange={e => handleNestedChange(['workExperience', index, 'endDate'], e.target.value)} onBlur={onBlurRecalculate} tagName="span" className="outline-none focus:bg-slate-100" />
                        </p>
                    </div>
                    <ContentEditable html={exp.company} onChange={e => handleNestedChange(['workExperience', index, 'company'], e.target.value)} onBlur={onBlurRecalculate} tagName="p" className="italic text-sm text-gray-700 outline-none focus:bg-slate-100" />
                    <ul className="list-disc list-outside pl-5 mt-2 text-sm space-y-1 text-gray-700">
                        {(exp.responsibilities || []).map((resp, i) => (
                            <li key={i}>
                                <ContentEditable
                                    html={resp}
                                    onChange={(e) => handleNestedChange(['workExperience', index, 'responsibilities', i], e.target.value)}
                                    onBlur={onBlurRecalculate}
                                    tagName="span"
                                    className="block outline-none focus:bg-slate-100"
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
                    <div key={index} className="mb-5">
                        <div className="flex justify-between items-baseline mb-1">
                            <ContentEditable html={proj.title} onChange={e => handleNestedChange(['projects', index, 'title'], e.target.value)} onBlur={onBlurRecalculate} tagName="h3" className="text-md font-bold text-gray-900 outline-none focus:bg-slate-100" />
                            <p className="text-sm text-gray-600">
                                <ContentEditable html={proj.date} onChange={e => handleNestedChange(['projects', index, 'date'], e.target.value)} onBlur={onBlurRecalculate} tagName="span" className="outline-none focus:bg-slate-100" />
                            </p>
                        </div>
                        <ContentEditable html={proj.description} onChange={e => handleNestedChange(['projects', index, 'description'], e.target.value)} onBlur={onBlurRecalculate} tagName="p" className="text-sm leading-relaxed outline-none focus:bg-slate-100" />
                    </div>
                ))}
            </MainSection>
        )}
      </main>
    </div>
  );
};