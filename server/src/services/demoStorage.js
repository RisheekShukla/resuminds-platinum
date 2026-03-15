/**
 * In-memory storage for Demo Mode
 * Used when MongoDB is not available
 */

export const demoSessions = new Map();
export const demoReports = new Map();
export const demoResumes = new Map();

// Mock data for Phase 2 Verification
const GUEST_ID = '000000000000000000000001';

const mockSessions = [
    {
        _id: 'mock-1',
        userId: GUEST_ID,
        type: 'technical',
        status: 'completed',
        startedAt: new Date(Date.now() - 86400000 * 2), // 2 days ago
        questions: [{ text: 'Explain React hooks' }]
    },
    {
        _id: 'mock-2',
        userId: GUEST_ID,
        type: 'mixed',
        status: 'completed',
        startedAt: new Date(Date.now() - 86400000 * 1), // 1 day ago
        questions: [{ text: 'Tell me about a conflict' }]
    }
];

const mockReports = {
    'mock-1': {
        overallScore: 65,
        categoryScores: { technical: 70, communication: 60, problemSolving: 65 }
    },
    'mock-2': {
        overallScore: 82,
        categoryScores: { technical: 75, communication: 85, problemSolving: 85 }
    }
};

mockSessions.forEach(s => demoSessions.set(s._id, s));
Object.keys(mockReports).forEach(id => demoReports.set(id, mockReports[id]));

console.log('📦 Initialized in-memory demo storage with mock data');
