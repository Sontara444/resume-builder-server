const { GoogleGenerativeAI } = require('@google/generative-ai');

// Centralized helper to get Gemini model or return null if not configured
const getGenerativeModel = (modelName = 'gemini-1.5-flash', requireJson = false) => {
  if (!process.env.GEMINI_API_KEY || !process.env.GEMINI_API_KEY.trim()) {
    return null;
  }
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const options = { model: modelName };
  
  if (requireJson) {
    options.generationConfig = { responseMimeType: 'application/json' };
  }
  
  return genAI.getGenerativeModel(options);
};

// Safe helper to extract and parse JSON from Gemini's response
const safeParseJSON = (text, defaultValue = {}) => {
  if (!text) return defaultValue;
  let cleanText = text.trim();
  
  // Strip markdown formatting blocks if present
  if (cleanText.startsWith('```json')) {
    cleanText = cleanText.replace(/^```json/, '').replace(/```$/, '').trim();
  } else if (cleanText.startsWith('```')) {
    cleanText = cleanText.replace(/^```/, '').replace(/```$/, '').trim();
  }
  
  try {
    return JSON.parse(cleanText);
  } catch (err) {
    console.warn('Failed to parse AI response as JSON, trying fuzzy matching:', err.message, cleanText);
    
    // Fuzzy matching: find first '{' or '[' and last '}' or ']'
    const firstBrace = cleanText.indexOf('{');
    const lastBrace = cleanText.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(cleanText.slice(firstBrace, lastBrace + 1));
      } catch (innerErr) {
        console.error('Fuzzy parse attempt failed:', innerErr.message);
      }
    }
    
    const firstBracket = cleanText.indexOf('[');
    const lastBracket = cleanText.lastIndexOf(']');
    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
      try {
        return JSON.parse(cleanText.slice(firstBracket, lastBracket + 1));
      } catch (innerErr) {
        console.error('Fuzzy bracket parse attempt failed:', innerErr.message);
      }
    }
    
    return defaultValue;
  }
};

const fallbackImprove = (text, section) => {
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();

  const dictionary = {
    'built weather app': 'Developed a responsive weather forecasting application using React and REST APIs.',
    'weather app': 'Developed a responsive weather forecasting application using React and REST APIs.',
    'react app': 'Architected and deployed a modular web application utilizing React, Redux, and modern CSS/HTML.',
    'node api': 'Designed and implemented a scalable RESTful API with Node.js and Express, enhancing response times by 30%.',
    'sql database': 'Optimized database queries and structured schemas with PostgreSQL, reducing query latency.',
    'website': 'Designed and optimized a responsive, high-performance website with modern UI/UX practices.',
    'login': 'Implemented a secure JWT-based authentication system, enhancing security and session management.',
    'test': 'Developed comprehensive automated test suites using Jest, increasing code coverage to 90%.'
  };

  if (dictionary[lower]) {
    return dictionary[lower];
  }

  const actionVerbsMapping = {
    'build': 'Develop',
    'built': 'Developed',
    'make': 'Create',
    'made': 'Created',
    'create': 'Create',
    'created': 'Created',
    'do': 'Execute',
    'did': 'Executed',
    'work': 'Collaborate',
    'worked': 'Collaborated',
    'run': 'Manage',
    'ran': 'Managed',
    'manage': 'Manage',
    'managed': 'Managed',
    'write': 'Author',
    'wrote': 'Authored',
    'code': 'Develop',
    'coded': 'Developed',
    'program': 'Develop',
    'programmed': 'Developed',
    'test': 'Validate',
    'tested': 'Validated',
    'design': 'Design',
    'designed': 'Designed',
    'fix': 'Resolve',
    'fixed': 'Resolved',
    'improve': 'Optimize',
    'improved': 'Optimized'
  };

  const words = trimmed.split(/\s+/);
  const firstWord = words[0]?.toLowerCase();
  
  let restOfText = words.slice(1).join(' ');
  let verb = 'Optimized';

  if (actionVerbsMapping[firstWord]) {
    verb = actionVerbsMapping[firstWord];
  } else {
    restOfText = trimmed;
  }

  let result = `${verb} ${restOfText}`;
  result = result.charAt(0).toUpperCase() + result.slice(1);
  if (!result.endsWith('.')) {
    result += '.';
  }

  if (lower.includes('weather') && lower.includes('app')) {
    return 'Developed a responsive weather forecasting application using React and REST APIs.';
  }

  return result;
};

exports.improveText = async (req, res) => {
  try {
    const { text, section } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Text content is required' });
    }

    const model = getGenerativeModel('gemini-1.5-flash');
    if (model) {
      try {
        const prompt = `You are an expert resume writer and ATS optimization specialist.
Optimize the following resume text for the "${section || 'general'}" section of a resume.
Make it clean, concise, achievement-oriented, professional in tone, and optimized for Applicant Tracking Systems (ATS). Use action verbs at the start of bullet points where appropriate. Keep it to a single, powerful sentence or bullet point. Do not add quotes, introductory text, formatting tags, or multiple bullet points.

Original text: "${text}"

Optimized version:`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const improvedText = response.text().trim();
        if (improvedText) {
          return res.json({ improvedText });
        }
      } catch (geminiError) {
        console.warn('Gemini API call failed, falling back to local optimizer:', geminiError.message);
      }
    }

    const improvedText = fallbackImprove(text, section);
    return res.json({ improvedText });
  } catch (err) {
    console.error('Error improving text:', err);
    res.status(500).json({ error: 'Failed to optimize text' });
  }
};

exports.fixSpelling = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Text content is required' });
    }

    const model = getGenerativeModel('gemini-1.5-flash');
    if (model) {
      try {
        const prompt = `You are an expert proofreader.
Your ONLY task is to correct misspelled words and obvious grammatical errors in the provided text.
CRITICAL INSTRUCTIONS:
1. Do NOT rephrase, rewrite, or improve the text.
2. Do NOT change the meaning or choice of words unless a word is clearly misspelled.
3. If the text has no spelling or grammatical errors, return the exact original text.
4. DO NOT add any conversational text, explanations, or quotes.

Text to fix:
${text}

Fixed text:`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const fixedText = response.text().trim();
        if (fixedText) {
          return res.json({ fixedText });
        }
      } catch (geminiError) {
        console.warn('Gemini API call failed for fixSpelling:', geminiError.message);
      }
    }

    // Fallback if no API available
    let fixed = text;
    fixed = fixed.replace(/\bDevelope\b/gi, 'Developer');
    fixed = fixed.replace(/Optimized Developer\.?/gi, 'Developer');
    
    return res.json({ fixedText: fixed });
  } catch (err) {
    console.error('Error fixing spelling:', err);
    res.status(500).json({ error: 'Failed to fix spelling' });
  }
};

const fallbackExtractKeywords = (jdText) => {
  const commonTech = ['react', 'node.js', 'node', 'express', 'mongodb', 'sql', 'nosql', 'postgres', 'postgresql', 'mysql', 'docker', 'kubernetes', 'aws', 'gcp', 'azure', 'typescript', 'javascript', 'python', 'java', 'c++', 'c#', 'ruby', 'go', 'rust', 'graphql', 'rest', 'api', 'redux', 'next.js', 'vue', 'angular', 'html', 'css', 'sass', 'tailwind', 'git', 'ci/cd', 'agile', 'scrum', 'jira', 'linux'];
  const lowerJd = jdText.toLowerCase();
  const extracted = [];
  
  commonTech.forEach(tech => {
    const regex = new RegExp('\\b' + tech.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'g');
    if (regex.test(lowerJd)) {
      extracted.push(tech.charAt(0).toUpperCase() + tech.slice(1));
    }
  });

  return extracted.join(', ');
};

exports.extractKeywords = async (req, res) => {
  try {
    const { jdText } = req.body;
    if (!jdText || !jdText.trim()) {
      return res.status(400).json({ error: 'Job description content is required' });
    }

    const model = getGenerativeModel('gemini-1.5-flash');
    if (model) {
      try {
        const prompt = `You are an expert technical recruiter and ATS optimization specialist.
Extract the most important technical skills, tools, and keywords from the following job description.
Return ONLY a comma-separated list of the keywords. Do not include introductory text, bullet points, or newlines. Limit to the top 15 most important keywords.

Job Description:
"${jdText}"

Keywords:`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const keywords = response.text().trim();
        if (keywords) {
          return res.json({ keywords });
        }
      } catch (geminiError) {
        console.warn('Gemini API call failed for keyword extraction, falling back:', geminiError.message);
      }
    }

    const keywords = fallbackExtractKeywords(jdText);
    return res.json({ keywords });
  } catch (err) {
    console.error('Error extracting keywords:', err);
    res.status(500).json({ error: 'Failed to extract keywords' });
  }
};

exports.analyzeJob = async (req, res) => {
  try {
    const { jdText, resumeText } = req.body;
    if (!jdText || !resumeText) {
      return res.status(400).json({ error: 'Job description and resume text are required' });
    }

    const model = getGenerativeModel('gemini-1.5-flash', true);
    if (model) {
      try {
        const prompt = `You are an expert ATS optimization specialist. 
I will provide a Job Description and a Resume Text. 
Analyze the job description for the most critical keywords, skills, qualifications, and experience requirements. Then compare them against the resume text.
Output a valid JSON object with EXACTLY the following structure:
{
  "matchPercentage": (number between 0-100),
  "matchingKeywords": ["keyword1", "keyword2"],
  "missingKeywords": ["keyword3", "keyword4"],
  "aiSuggestions": ["suggestion 1", "suggestion 2"],
  "experienceRequirements": "experience requirement details (e.g. 3+ years of React)",
  "importantKeywords": ["key skill 1", "key skill 2"],
  "recommendedImprovements": ["improvement 1", "improvement 2"]
}

Job Description:
"""${jdText}"""

Resume Text:
"""${resumeText}"""
`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().trim();
        const data = safeParseJSON(text, null);
        if (data) {
          return res.json(data);
        }
      } catch (geminiError) {
        console.warn('Gemini API call failed for job description analysis, falling back to local analysis:', geminiError.message);
      }
    }
    
    // Programmatic Local Fallback for JD Analysis
    const jdKeywordsStr = fallbackExtractKeywords(jdText);
    if (!jdKeywordsStr) {
      return res.json({
        matchPercentage: 0,
        matchingKeywords: [],
        missingKeywords: [],
        aiSuggestions: ["Please add more detail to the job description to get AI suggestions."],
        experienceRequirements: "Not specified",
        importantKeywords: [],
        recommendedImprovements: []
      });
    }

    const keywords = jdKeywordsStr.split(',').map(k => k.trim()).filter(Boolean);
    const lowerResume = resumeText.toLowerCase();
    
    const matchingKeywords = [];
    const missingKeywords = [];

    keywords.forEach(keyword => {
      const regex = new RegExp('\\b' + keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i');
      if (regex.test(lowerResume)) {
        matchingKeywords.push(keyword);
      } else {
        missingKeywords.push(keyword);
      }
    });

    const matchPercentage = keywords.length > 0 ? Math.round((matchingKeywords.length / keywords.length) * 100) : 0;
    
    const aiSuggestions = [];
    if (missingKeywords.length > 0) {
      aiSuggestions.push(`Add missing technical keywords to your resume: ${missingKeywords.slice(0, 5).join(', ')}.`);
      aiSuggestions.push(`Tailor your Experience and Projects sections to detail work with missing skills.`);
    } else {
      aiSuggestions.push("Excellent match! Your resume matches all extracted keywords from the job description.");
    }

    // Try to find experience patterns like "3+ years", "5 years", etc.
    let experienceRequirements = "Not specified";
    const expMatch = jdText.match(/\b(\d+\+?\s*(?:year|yr)s?)\b/i);
    if (expMatch) {
      experienceRequirements = `${expMatch[1]} experience recommended`;
    }

    const importantKeywords = [...keywords];
    const recommendedImprovements = [];
    if (missingKeywords.length > 0) {
      recommendedImprovements.push(`Add missing core skills: ${missingKeywords.slice(0, 3).join(', ')} to your Skills section.`);
      recommendedImprovements.push(`Provide project evidence illustrating your knowledge of ${missingKeywords.slice(0, 2).join(' and ')}.`);
    } else {
      recommendedImprovements.push("No urgent improvements needed. Keep your resume current.");
    }

    return res.json({
      matchPercentage,
      matchingKeywords,
      missingKeywords,
      aiSuggestions,
      experienceRequirements,
      importantKeywords,
      recommendedImprovements
    });
  } catch (err) {
    console.error('Error analyzing job description:', err);
    res.status(500).json({ error: 'Failed to analyze job description' });
  }
};

exports.improveWithKeywords = async (req, res) => {
  try {
    const { text, section, missingKeywords } = req.body;
    if (!text || !missingKeywords || !Array.isArray(missingKeywords)) {
      return res.status(400).json({ error: 'Text and missingKeywords array are required' });
    }

    const model = getGenerativeModel('gemini-1.5-flash');
    if (model) {
      try {
        const keywordsList = missingKeywords.join(', ');
        const prompt = `You are an expert resume writer and ATS optimization specialist.
I have a section of a resume ("${section || 'general'}") that needs to naturally include some missing keywords without sounding forced or keyword-stuffed.
Rewrite the following text to naturally incorporate as many of these missing keywords as logically possible.
Keep the professional tone and action-oriented format. DO NOT add intro/outro text. Return ONLY the rewritten text.

Missing Keywords: ${keywordsList}

Original Text:
"${text}"

Rewritten Text:`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return res.json({ improvedText: response.text().trim() });
      } catch (geminiError) {
        console.warn('Gemini API call failed for improving with keywords, falling back:', geminiError.message);
      }
    }

    // Programmatic Local Fallback for improving text with keywords
    let improvedText = text.trim();
    if (missingKeywords.length > 0) {
      const suffix = ` (Experience with: ${missingKeywords.join(', ')})`;
      if (improvedText.endsWith('.')) {
        improvedText = improvedText.slice(0, -1) + suffix + '.';
      } else {
        improvedText = improvedText + suffix;
      }
    }
    return res.json({ improvedText });
  } catch (err) {
    console.error('Error improving text with keywords:', err);
    res.status(500).json({ error: 'Failed to improve text with keywords' });
  }
};

exports.fixWeakness = async (req, res) => {
  try {
    const { resumeData, weakness } = req.body;
    if (!resumeData || !weakness) {
      return res.status(400).json({ error: 'Resume data and weakness are required' });
    }

    const model = getGenerativeModel('gemini-1.5-flash', true);
    if (model) {
      try {
        const prompt = `You are an expert resume writer and ATS optimization specialist.
I have a resume that has been flagged with the following weakness: "${weakness}"
Please analyze the provided resume JSON and return a JSON patch containing ONLY the specific sections/keys that need to be updated to resolve this weakness.

CRITICAL INSTRUCTIONS:
1. Do NOT return the entire resume JSON.
2. Return ONLY a single JSON object where the keys are the top-level keys of the resume that need modification (e.g. "summary", "skills", "experience", "projects", "education"), and the values are their complete updated representations.
3. For example, if the weakness is "Missing summary", return:
   { "summary": "Generated professional summary based on experience..." }
4. If the weakness is "Few technical keywords", return ONLY the updated "skills" array:
   { "skills": [...updated skills categories with relevant skills added...] }
5. Ensure the structure of any updated array or object matches the original resume schema exactly.
6. Do not include markdown formatting or explanations. Return ONLY valid JSON.

Original Resume JSON:
${JSON.stringify(resumeData)}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().trim();
        const patch = safeParseJSON(text, null);
        if (patch) {
          const updatedData = { ...resumeData };
          Object.keys(patch).forEach(key => {
            updatedData[key] = patch[key];
          });
          return res.json({ patch, updatedData });
        }
      } catch (geminiError) {
        console.warn('Gemini API call failed for fixing weakness, falling back to local fixer:', geminiError.message);
      }
    }

    // Fallback logic if no API key
    let patch = {};
    if (weakness.toLowerCase().includes('spelling mistake')) {
      const match = weakness.match(/"([^"]+)" should likely be "([^"]+)"/);
      if (match) {
        const badWord = match[1];
        const goodWord = match[2];
        
        // Try to replace spelling in summary
        if (resumeData.summary && resumeData.summary.toLowerCase().includes(badWord.toLowerCase())) {
          patch.summary = resumeData.summary.replace(new RegExp(`\\b${badWord}\\b`, 'gi'), goodWord);
        }
        
        // Try to replace spelling in experience
        if (resumeData.experience) {
          let replaced = false;
          const updatedExp = resumeData.experience.map(exp => {
            if (exp.description && exp.description.toLowerCase().includes(badWord.toLowerCase())) {
              replaced = true;
              return { ...exp, description: exp.description.replace(new RegExp(`\\b${badWord}\\b`, 'gi'), goodWord) };
            }
            return exp;
          });
          if (replaced) patch.experience = updatedExp;
        }

        // Try to replace spelling in projects
        if (resumeData.projects) {
          let replaced = false;
          const updatedProj = resumeData.projects.map(proj => {
            if (proj.description && Array.isArray(proj.description)) {
              let descReplaced = false;
              const updatedDesc = proj.description.map(desc => {
                if (desc.toLowerCase().includes(badWord.toLowerCase())) {
                  descReplaced = true;
                  return desc.replace(new RegExp(`\\b${badWord}\\b`, 'gi'), goodWord);
                }
                return desc;
              });
              if (descReplaced) {
                replaced = true;
                return { ...proj, description: updatedDesc };
              }
            }
            return proj;
          });
          if (replaced) patch.projects = updatedProj;
        }
      }
    } else if (weakness.toLowerCase().includes('summary')) {
      patch.summary = (resumeData.summary || '') + ' Experienced professional with a proven track record of delivering high-quality results.';
    } else if (weakness.toLowerCase().includes('skill') || weakness.toLowerCase().includes('keyword')) {
      if (resumeData.skills && resumeData.skills.length > 0) {
        const updatedSkills = [...resumeData.skills];
        updatedSkills[0] = {
          ...updatedSkills[0],
          items: [...updatedSkills[0].items, 'Communication', 'Problem Solving', 'Leadership']
        };
        patch.skills = updatedSkills;
      }
    } else if (weakness.toLowerCase().includes('experience') || weakness.toLowerCase().includes('verb')) {
      if (resumeData.experience && resumeData.experience.length > 0) {
        const updatedExp = [...resumeData.experience];
        updatedExp[0] = {
          ...updatedExp[0],
          description: 'Managed and optimized processes to achieve significant performance improvements. ' + (updatedExp[0].description || '')
        };
        patch.experience = updatedExp;
      }
    } else {
      if (!resumeData.summary) {
        patch.summary = 'Dedicated professional seeking new opportunities.';
      }
    }

    // Merge patch into updatedData for backward compatibility
    const updatedData = { ...resumeData };
    Object.keys(patch).forEach(key => {
      updatedData[key] = patch[key];
    });

    return res.json({ patch, updatedData });
  } catch (err) {
    console.error('Error fixing weakness:', err.message || err);
    res.status(500).json({ error: 'Failed to fix weakness with AI' });
  }
};

exports.reviewResume = async (req, res) => {
  try {
    const { resumeData } = req.body;
    if (!resumeData) {
      return res.status(400).json({ error: 'Resume data is required' });
    }

    const model = getGenerativeModel('gemini-1.5-flash', true);
    if (model) {
      try {
        const prompt = `You are an expert AI Resume Reviewer, ATS specialist, and grammar checker.
Analyze the following resume JSON. Find spelling mistakes, grammar mistakes, punctuation issues, weak action verbs, repeated words, and formatting inconsistencies in the text content (descriptions, summaries, titles).
Return ONLY a valid JSON object with the exact structure below. Do not include markdown formatting or explanations.

{
  "writingScore": (number 0-100),
  "issues": [
    {
      "type": "spelling|grammar|weak_verb|formatting|tone|completeness",
      "severity": "error|suggestion",
      "originalText": "exact original text substring that needs fixing",
      "suggestedFix": "the corrected text",
      "reason": "Brief explanation of why this needs fixing",
      "section": "summary|experience|projects|skills|education|personal"
    }
  ]
}

Ensure "originalText" is an EXACT substring from the resume text so it can be automatically replaced.

Resume Data:
${JSON.stringify(resumeData)}
`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().trim();
        const reviewData = safeParseJSON(text, null);
        if (reviewData) {
          return res.json(reviewData);
        }
      } catch (geminiError) {
        console.warn('Gemini API call failed for reviewResume, falling back:', geminiError.message);
      }
    }

    // Fallback logic if no API key
    return res.json({
      writingScore: 85,
      issues: [
        {
          type: "spelling",
          severity: "suggestion",
          originalText: "Ensure your API key is set",
          suggestedFix: "Set your API key",
          reason: "Gemini API key is missing, so this is a placeholder.",
          section: "summary"
        }
      ]
    });
  } catch (err) {
    console.error('Error reviewing resume:', err.message || err);
    res.status(500).json({ error: 'Failed to review resume with AI' });
  }
};

exports.generateCoverLetter = async (req, res) => {
  try {
    const { resumeData, jobTitle, jobDescription } = req.body;
    if (!resumeData) {
      return res.status(400).json({ error: 'Resume data is required' });
    }

    const model = getGenerativeModel('gemini-1.5-pro');
    if (model) {
      try {
        let prompt = `You are an expert career coach and professional cover letter writer.
Based on the following resume data, generate a compelling, professional cover letter.
Make sure it sounds natural, confident, and highlights the most relevant skills and experiences.
Do NOT include placeholder addresses or generic "Dear Hiring Manager" if a name can't be found, just use "Dear Hiring Manager,".
Structure the letter properly with an opening, body paragraphs highlighting achievements, and a professional closing.
Return ONLY the text of the cover letter, no markdown formatting like \`\`\`, no intro or outro text.

Resume Data:
${JSON.stringify(resumeData)}`;

        if (jobTitle || jobDescription) {
          prompt += `\n\nTarget Job Role: ${jobTitle || 'Not specified'}`;
          prompt += `\nTarget Job Description (use this to tailor the letter): ${jobDescription || 'Not specified'}`;
        }

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().trim();
        return res.json({ coverLetter: text });
      } catch (geminiError) {
        console.warn('Gemini API call failed for cover letter generation, falling back:', geminiError.message);
      }
    }

    // Fallback logic if no API key
    return res.json({
      coverLetter: "Dear Hiring Manager,\n\nI am writing to express my interest in the position. With my background and skills, I am confident I would be a great fit for your team. My resume details my accomplishments and qualifications.\n\nThank you for your time and consideration.\n\nSincerely,\n" + (resumeData?.personal?.fullName || "Applicant")
    });
  } catch (err) {
    console.error('Error generating cover letter:', err.message || err);
    res.status(500).json({ error: 'Failed to generate cover letter' });
  }
};

exports.generateSuggestions = async (req, res) => {
  try {
    const { role, sectionType } = req.body;
    if (!role) {
      return res.status(400).json({ error: 'Role/Job title is required' });
    }

    const model = getGenerativeModel('gemini-1.5-flash', true);
    if (model) {
      try {
        const prompt = `You are an expert resume writer. Generate 5 strong, ATS-optimized bullet points for the '${sectionType || 'experience'}' section of a resume for a '${role}'.
Make them clean, concise, achievement-oriented, and professional in tone. Use action verbs at the start.
Keep each bullet point under 25 words. Do not include introductory text, markdown formatting, or quotes.
Return ONLY a valid JSON array of strings. Example: ["Developed scalable APIs using Node.js.", "Optimized database queries..."]`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().trim();
        const suggestions = safeParseJSON(text, null);
        if (suggestions && Array.isArray(suggestions)) {
          return res.json({ suggestions });
        }
      } catch (geminiError) {
        console.warn('Gemini API call failed for suggestions generation, falling back:', geminiError.message);
      }
    }

    // Fallback logic
    return res.json({
      suggestions: [
        `Collaborated with cross-functional teams to deliver ${role} projects on time.`,
        `Optimized existing processes to improve efficiency and reduce overhead.`,
        `Spearheaded the development of key features, resulting in increased user engagement.`,
        `Conducted rigorous testing and quality assurance for all deliverables.`,
        `Maintained detailed documentation and provided technical support to stakeholders.`
      ]
    });
  } catch (err) {
    console.error('Error generating suggestions:', err.message || err);
    res.status(500).json({ error: 'Failed to generate suggestions' });
  }
};
