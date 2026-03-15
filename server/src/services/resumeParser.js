import fs from 'fs/promises'
import path from 'path'

/**
 * Parse resume file and extract structured data
 * Enhanced version with better extraction logic
 */
export const parseResume = async (filePath) => {
    try {
        const ext = path.extname(filePath).toLowerCase()
        let rawText = ''

        // Read file based on type
        if (ext === '.txt') {
            rawText = await fs.readFile(filePath, 'utf-8')
        } else if (ext === '.pdf') {
            // For PDF, try to use pdf-parse if available
            try {
                const pdfParse = (await import('pdf-parse')).default
                const dataBuffer = await fs.readFile(filePath)
                const data = await pdfParse(dataBuffer)
                rawText = data.text
            } catch (err) {
                console.log('PDF parsing not available, using placeholder')
                rawText = '[PDF content - install pdf-parse for full parsing]'
            }
        } else {
            rawText = '[Unsupported format]'
        }

        // Extract structured data
        const parsedData = {
            name: extractName(rawText),
            email: extractEmail(rawText),
            phone: extractPhone(rawText),
            skills: extractSkills(rawText),
            experience: extractExperience(rawText),
            education: extractEducation(rawText),
            projects: extractProjects(rawText),
            summary: extractSummary(rawText),
            rawText,
        }

        console.log('📄 Resume parsed:', {
            name: parsedData.name,
            skills: parsedData.skills.length,
            experience: parsedData.experience.length,
            projects: parsedData.projects.length,
        })

        return parsedData
    } catch (error) {
        console.error('Resume parsing error:', error)
        throw new Error('Failed to parse resume')
    }
}

// Extract name (usually first line or after "Name:")
const extractName = (text) => {
    const lines = text.split('\n').filter(l => l.trim())

    // Look for "Name:" pattern
    const nameMatch = text.match(/(?:Name|NAME)[\s:]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i)
    if (nameMatch) return nameMatch[1].trim()

    // First line if it looks like a name (2-4 words, capitalized)
    const firstLine = lines[0]?.trim()
    if (firstLine && /^[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3}$/.test(firstLine)) {
        return firstLine
    }

    return 'Candidate'
}

// Extract email
const extractEmail = (text) => {
    const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i)
    return emailMatch ? emailMatch[0] : null
}

// Extract phone
const extractPhone = (text) => {
    const phoneMatch = text.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/)
    return phoneMatch ? phoneMatch[0] : null
}

// Extract skills with better detection
const extractSkills = (text) => {
    const skills = new Set()

    // Common tech skills to look for
    const techSkills = [
        // Languages
        'javascript', 'python', 'java', 'c++', 'c#', 'ruby', 'go', 'rust', 'php', 'swift', 'kotlin', 'typescript',
        // Frontend
        'react', 'vue', 'angular', 'svelte', 'html', 'css', 'sass', 'tailwind', 'bootstrap', 'jquery',
        // Backend
        'node.js', 'express', 'django', 'flask', 'spring', 'laravel', 'rails', 'fastapi', 'nest.js',
        // Databases
        'mongodb', 'postgresql', 'mysql', 'redis', 'sqlite', 'firebase', 'dynamodb', 'cassandra',
        // Cloud/DevOps
        'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'terraform', 'ansible',
        // Tools
        'git', 'github', 'gitlab', 'jira', 'figma', 'postman', 'webpack', 'vite',
        // Other
        'rest api', 'graphql', 'websocket', 'microservices', 'agile', 'scrum', 'ci/cd',
    ]

    const textLower = text.toLowerCase()

    // Find skills in text
    techSkills.forEach(skill => {
        if (textLower.includes(skill.toLowerCase())) {
            skills.add(skill)
        }
    })

    // Look for skills section
    const skillsSection = text.match(/(?:Skills|SKILLS|Technical Skills)[\s:]+([^\n]+(?:\n[^\n]+){0,5})/i)
    if (skillsSection) {
        const skillText = skillsSection[1]
        // Extract comma/bullet separated items
        const items = skillText.split(/[,•\n]/).map(s => s.trim()).filter(s => s.length > 2 && s.length < 30)
        items.forEach(item => skills.add(item))
    }

    return Array.from(skills)
}

// Extract work experience
const extractExperience = (text) => {
    const experience = []

    // Look for experience section
    const expSection = text.match(/(?:Experience|EXPERIENCE|Work Experience|WORK EXPERIENCE)([\s\S]*?)(?=Education|EDUCATION|Projects|PROJECTS|Skills|SKILLS|$)/i)

    if (expSection) {
        const expText = expSection[1]

        // Try to find company/role patterns
        const lines = expText.split('\n').filter(l => l.trim())

        let currentExp = null
        lines.forEach(line => {
            line = line.trim()

            // Look for role/company patterns
            if (line.match(/^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:at|@|-)\s+/i)) {
                if (currentExp) experience.push(currentExp)

                const parts = line.split(/\s+(?:at|@|-)\s+/i)
                currentExp = {
                    role: parts[0]?.trim() || 'Role',
                    company: parts[1]?.trim() || 'Company',
                    duration: '',
                    highlights: [],
                }
            } else if (currentExp && line.match(/\d{4}|\d+\s+(?:months?|years?)/i)) {
                currentExp.duration = line
            } else if (currentExp && (line.startsWith('•') || line.startsWith('-') || line.length > 20)) {
                currentExp.highlights.push(line.replace(/^[•\-]\s*/, ''))
            }
        })

        if (currentExp) experience.push(currentExp)
    }

    return experience
}

// Extract education
const extractEducation = (text) => {
    const education = []

    const eduSection = text.match(/(?:Education|EDUCATION)([\s\S]*?)(?=Experience|EXPERIENCE|Projects|PROJECTS|Skills|SKILLS|$)/i)

    if (eduSection) {
        const eduText = eduSection[1]
        const lines = eduText.split('\n').filter(l => l.trim())

        let currentEdu = null
        lines.forEach(line => {
            line = line.trim()

            if (line.match(/(?:Bachelor|Master|PhD|B\.S\.|M\.S\.|B\.Tech|M\.Tech)/i)) {
                if (currentEdu) education.push(currentEdu)
                currentEdu = {
                    degree: line,
                    institution: '',
                    year: '',
                }
            } else if (currentEdu && !currentEdu.institution && line.length > 5) {
                currentEdu.institution = line
            } else if (currentEdu && line.match(/\d{4}/)) {
                currentEdu.year = line
            }
        })

        if (currentEdu) education.push(currentEdu)
    }

    return education
}

// Extract projects
const extractProjects = (text) => {
    const projects = []

    const projSection = text.match(/(?:Projects|PROJECTS)([\s\S]*?)(?=Experience|EXPERIENCE|Education|EDUCATION|Skills|SKILLS|$)/i)

    if (projSection) {
        const projText = projSection[1]
        const lines = projText.split('\n').filter(l => l.trim())

        let currentProj = null
        lines.forEach(line => {
            line = line.trim()

            // Project title (usually bold or first line)
            if (line.length > 5 && line.length < 100 && !line.startsWith('•') && !line.startsWith('-')) {
                if (currentProj) projects.push(currentProj)
                currentProj = {
                    name: line,
                    description: '',
                    tech: [],
                }
            } else if (currentProj && line.length > 10) {
                if (!currentProj.description) {
                    currentProj.description = line
                }
                // Extract tech from description
                const techMatches = line.match(/(?:using|with|built with|technologies?:?)\s+([^.]+)/i)
                if (techMatches) {
                    const tech = techMatches[1].split(/[,&]/).map(t => t.trim())
                    currentProj.tech.push(...tech)
                }
            }
        })

        if (currentProj) projects.push(currentProj)
    }

    return projects
}

// Extract summary/objective
const extractSummary = (text) => {
    const summaryMatch = text.match(/(?:Summary|SUMMARY|Objective|OBJECTIVE|About|ABOUT)[\s:]+([^\n]+(?:\n[^\n]+){0,3})/i)
    return summaryMatch ? summaryMatch[1].trim() : ''
}
