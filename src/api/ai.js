import api from "./axios"

export const summarizeNote = (noteId) => api.get(`/ai/summarize/${noteId}`)
export const generateQuestions = (noteId) => api.get(`/ai/questions/${noteId}`)
export const generateStudyPlan = (fileId, days) => api.get(`/ai/studyplan/${fileId}?days=${days}`)
export const analyzePDF = (fileId) => api.get(`/ai/analyze/${fileId}`)