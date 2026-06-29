// api/ai.js
import api from "./axios"

export const summarizeNote = (noteId) => api.get(`/ai/summarize/${noteId}`)
export const generateQuestions = (noteId) => api.get(`/ai/questions/${noteId}`)
export const generateStudyPlan = (courseId, days) => api.get(`/ai/studyplan/course/${courseId}?days=${days}`)
export const generateStudyPlanByFile = (fileId, days) => api.get(`/ai/studyplan/${fileId}?days=${days}`)
export const getSavedStudyPlan = (courseId) => api.get(`/ai/studyplan/course/${courseId}/saved`)
export const analyzePDF = (fileId) => api.get(`/ai/analyze/${fileId}`)