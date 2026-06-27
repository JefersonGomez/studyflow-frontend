import api from "./axios"

export const getNotesByCourse = (courseId) => api.get(`/courses/${courseId}/notes`)
export const createNote = (courseId, data) => api.post(`/courses/${courseId}/notes`, data)
export const deleteNote = (id) => api.delete(`/notes/${id}`)
export const updateNote = (id, data) => api.put(`/notes/${id}`, data)
export const getAllNotes = () => api.get("/notes");