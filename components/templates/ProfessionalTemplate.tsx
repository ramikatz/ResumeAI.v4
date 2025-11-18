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

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <section className="mt-6">
        <h2 className="text-sm font-bold text-[#008B8B] border-b-2 border-[#008B8B] pb-1 mb-3 uppercase tracking-widest">
            {title}
        </h2>
        {children}
    </section>
);

export const ProfessionalTemplate: React.FC<Props> = ({ data, onUpdate, onBlurRecalculate, profilePicture }) => {
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
    <div className="bg-white p-10 font-sans text-sm text-[#333]">
      <header className="flex items-start gap-8 mb-8">
        <div className="w-28 h-28 bg-slate-200 rounded-md flex-shrink-0">
          <img src={profilePicture || 'https://i.imgur.com/8bX5asj.png'} alt={content.fullName} className="rounded-md w-full h-full object-cover" />
        </div>
        <div className="flex-grow">
          <ContentEditable
            html={content.fullName}
            onChange={(e) => handleNestedChange(['fullName'], e.target.value)}
            onBlur={onBlurRecalculate}
            tagName="h1"
            className="text-4xl font-bold text-black uppercase outline-none focus:bg-slate-100"
          />
           <ContentEditable
            html={content.jobTitle}
            onChange={(e) => handleNestedChange(['jobTitle'], e.target.value)}
            onBlur={onBlurRecalculate}
            tagName="p"
            className="text-lg font-medium text-[#008B8B] tracking-wider mt-1 outline-none focus:bg-slate-100"
          />
          <div className="mt-3 space-y-1 text-xs">
              <p><strong>Address:</strong> <ContentEditable html={content.contact?.address || ''} onBlur={onBlurRecalculate} onChange={(e) => handleNestedChange(['contact', 'address'], e.target.value)} tagName="span" className="inline-block outline-none focus:bg-slate-100" /></p>
              <p><strong>Phone:</strong> <ContentEditable html={content.contact?.phone || ''} onBlur={onBlurRecalculate} onChange={(e) => handleNestedChange(['contact', 'phone'], e.target.value)} tagName="span" className="inline-block outline-none focus:bg-slate-100" /></p>
              <p><strong>Email:</strong> <ContentEditable html={content.contact?.email || ''} onBlur={onBlurRecalculate} onChange={(e) => handleNestedChange(['contact', 'email'], e.target.value)} tagName="span" className="inline-block outline-none focus:bg-slate-100" /></p>
              {content.contact?.website && <p><strong>Website:</strong> <ContentEditable html={content.contact?.website || ''} onBlur={onBlurRecalculate} onChange={(e) => handleNestedChange(['contact', 'website'], e.target.value)} tagName="span" className="inline-block outline-none focus:bg-slate-100" /></p>}
              {content.contact?.linkedinUrl && <p><strong>LinkedIn:</strong> <ContentEditable html={content.contact?.linkedinUrl || ''} onBlur={onBlurRecalculate} onChange={(e) => handleNestedChange(['contact', 'linkedinUrl'], e.target.value)} tagName="span" className="inline-block outline-none focus:bg-slate-100" /></p>}
          </div>
        </div>
      </header>

      <main>
        <Section title="Summary">
            <ContentEditable
                html={content.summary}
                onChange={(e) => handleNestedChange(['summary'], e.target.value)}
                onBlur={onBlurRecalculate}
                tagName="p"
                className="text-xs leading-relaxed outline-none focus:bg-slate-100"
            />
        </Section>
        
        <Section title="Work Experience">
          {(content.workExperience || []).map((exp, index) => (
            <div key={index} className={`mb-4 ${index > 0 ? 'mt-4' : ''}`}>
              <div className="flex justify-between items-baseline">
                <h3 className="text-sm font-bold">
                    <ContentEditable html={exp.jobTitle} onBlur={onBlurRecalculate} onChange={(e) => handleNestedChange(['workExperience', index, 'jobTitle'], e.target.value)} tagName="span" className="outline-none focus:bg-slate-100" />, 
                    <ContentEditable html={exp.company} onBlur={onBlurRecalculate} onChange={(e) => handleNestedChange(['workExperience', index, 'company'], e.target.value)} tagName="span" className="font-medium italic outline-none focus:bg-slate-100" />
                </h3>
                <p className="text-xs font-bold text-[#666]">
                    <ContentEditable html={exp.startDate} onBlur={onBlurRecalculate} onChange={(e) => handleNestedChange(['workExperience', index, 'startDate'], e.target.value)} tagName="span" className="outline-none focus:bg-slate-100" /> - 
                    <ContentEditable html={exp.endDate} onBlur={onBlurRecalculate} onChange={(e) => handleNestedChange(['workExperience', index, 'endDate'], e.target.value)} tagName="span" className="outline-none focus:bg-slate-100" />
                </p>
              </div>
               <ul className="list-disc list-outside pl-5 mt-1 text-xs space-y-1 leading-relaxed">
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
        </Section>

        {(content.projects && content.projects.length > 0) && (
            <Section title="Projects">
              {(content.projects || []).map((proj, index) => (
                <div key={index} className={`mb-4 ${index > 0 ? 'mt-4' : ''}`}>
                  <div className="flex justify-between items-baseline">
                    <h3 className="text-sm font-bold">
                        <ContentEditable html={proj.title} onBlur={onBlurRecalculate} onChange={(e) => handleNestedChange(['projects', index, 'title'], e.target.value)} tagName="span" className="outline-none focus:bg-slate-100" />
                    </h3>
                    <p className="text-xs font-bold text-[#666]">
                        <ContentEditable html={proj.date} onBlur={onBlurRecalculate} onChange={(e) => handleNestedChange(['projects', index, 'date'], e.target.value)} tagName="span" className="outline-none focus:bg-slate-100" />
                    </p>
                  </div>
                  <ContentEditable
                    html={proj.description}
                    onChange={(e) => handleNestedChange(['projects', index, 'description'], e.target.value)}
                    onBlur={onBlurRecalculate}
                    tagName="p"
                    className="text-xs leading-relaxed mt-1 outline-none focus:bg-slate-100"
                   />
                </div>
              ))}
            </Section>
        )}

        {(content.additionalExperience && content.additionalExperience.length > 0) && (
            <Section title="Additional Experience">
              {(content.additionalExperience || []).map((exp, index) => (
                <div key={index} className={`mb-4 ${index > 0 ? 'mt-4' : ''}`}>
                  <div className="flex justify-between items-baseline">
                    <h3 className="text-sm font-bold">
                        <ContentEditable html={exp.title} onBlur={onBlurRecalculate} onChange={(e) => handleNestedChange(['additionalExperience', index, 'title'], e.target.value)} tagName="span" className="outline-none focus:bg-slate-100" />
                    </h3>
                    <p className="text-xs font-bold text-[#666]">
                        <ContentEditable html={exp.date} onBlur={onBlurRecalculate} onChange={(e) => handleNestedChange(['additionalExperience', index, 'date'], e.target.value)} tagName="span" className="outline-none focus:bg-slate-100" />
                    </p>
                  </div>
                   <ContentEditable
                        html={exp.description}
                        onChange={(e) => handleNestedChange(['additionalExperience', index, 'description'], e.target.value)}
                        onBlur={onBlurRecalculate}
                        tagName="p"
                        className="text-xs leading-relaxed mt-1 outline-none focus:bg-slate-100"
                    />
                </div>
              ))}
            </Section>
        )}

        <Section title="Education">
           {(content.education || []).map((edu, index) => (
            <div key={index} className={`mb-2 ${index > 0 ? 'mt-2' : ''}`}>
                <div className="flex justify-between items-baseline">
                    <h3 className="text-sm font-bold">
                        <ContentEditable html={edu.degree} onBlur={onBlurRecalculate} onChange={(e) => handleNestedChange(['education', index, 'degree'], e.target.value)} tagName="span" className="outline-none focus:bg-slate-100" />
                    </h3>
                    <p className="text-xs font-bold text-[#666]">
                        <ContentEditable html={edu.graduationDate} onBlur={onBlurRecalculate} onChange={(e) => handleNestedChange(['education', index, 'graduationDate'], e.target.value)} tagName="span" className="outline-none focus:bg-slate-100" />
                    </p>
                </div>
                <ContentEditable html={edu.institution} onBlur={onBlurRecalculate} onChange={(e) => handleNestedChange(['education', index, 'institution'], e.target.value)} tagName="p" className="text-xs italic outline-none focus:bg-slate-100" />
                <ContentEditable html={edu.fieldOfStudy || ''} onBlur={onBlurRecalculate} onChange={(e) => handleNestedChange(['education', index, 'fieldOfStudy'], e.target.value)} tagName="p" className="text-xs outline-none focus:bg-slate-100" />
            </div>
           ))}
        </Section>
        
        <Section title="Skills">
             <div className="text-xs flex flex-wrap gap-x-2">
                {(content.skills || []).map((skill, index) => (
                    <React.Fragment key={index}>
                        <ContentEditable 
                            html={skill} 
                            onChange={(e) => handleNestedChange(['skills', index], e.target.value)} 
                            onBlur={onBlurRecalculate}
                            tagName="span"
                            className="inline-block outline-none focus:bg-slate-100"
                        />
                        {index < (content.skills || []).length - 1 && <span className="text-gray-400">,</span>}
                    </React.Fragment>
                ))}
             </div>
        </Section>

        {(content.certifications && content.certifications.length > 0) && (
            <Section title="Certifications">
                {(content.certifications || []).map((cert, index) => (
                    <div key={index} className="mb-2 text-xs">
                        <p className="font-bold">
                            <ContentEditable html={cert.name} onBlur={onBlurRecalculate} onChange={(e) => handleNestedChange(['certifications', index, 'name'], e.target.value)} tagName="span" className="outline-none focus:bg-slate-100" />
                        </p>
                        <p>
                            <ContentEditable html={cert.issuingOrganization} onBlur={onBlurRecalculate} onChange={(e) => handleNestedChange(['certifications', index, 'issuingOrganization'], e.target.value)} tagName="span" className="outline-none focus:bg-slate-100" /> - <ContentEditable html={cert.date} onBlur={onBlurRecalculate} onChange={(e) => handleNestedChange(['certifications', index, 'date'], e.target.value)} tagName="span" className="outline-none focus:bg-slate-100" />
                        </p>
                    </div>
                ))}
            </Section>
        )}

        {(content.references && content.references.length > 0) && (
            <Section title="References">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {(content.references || []).map((ref, index) => (
                    <div key={index}>
                        <p className="font-bold">
                            <ContentEditable html={ref.name} onBlur={onBlurRecalculate} onChange={(e) => handleNestedChange(['references', index, 'name'], e.target.value)} tagName="span" className="outline-none focus:bg-slate-100" />
                        </p>
                        <p className="italic">
                            <ContentEditable html={ref.title} onBlur={onBlurRecalculate} onChange={(e) => handleNestedChange(['references', index, 'title'], e.target.value)} tagName="span" className="outline-none focus:bg-slate-100" />, <ContentEditable html={ref.company} onBlur={onBlurRecalculate} onChange={(e) => handleNestedChange(['references', index, 'company'], e.target.value)} tagName="span" className="outline-none focus:bg-slate-100" />
                        </p>
                        <p>
                            <strong>P:</strong> <ContentEditable html={ref.phone} onBlur={onBlurRecalculate} onChange={(e) => handleNestedChange(['references', index, 'phone'], e.target.value)} tagName="span" className="outline-none focus:bg-slate-100" />
                        </p>
                        <p>
                            <strong>E:</strong> <ContentEditable html={ref.email} onBlur={onBlurRecalculate} onChange={(e) => handleNestedChange(['references', index, 'email'], e.target.value)} tagName="span" className="outline-none focus:bg-slate-100" />
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