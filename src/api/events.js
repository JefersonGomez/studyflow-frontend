import api from "./axios"

export const getEventsByCourse = (courseId) => api.get(`/courses/${courseId}/events`)
export const createEvent = (data) => api.post(`/events`, data)
export const deleteEvent = (id) => api.delete(`/events/${id}`)