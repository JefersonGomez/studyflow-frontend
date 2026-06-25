import { data } from "react-router-dom"
import api from "./axios"

export const getTasksByCourse = (courseId) => api.get(`/courses/${courseId}/tasks`)
export const createTask = (courseId, data) => api.post(`/courses/${courseId}/tasks`, data)
export const deleteTask = (id) => api.delete(`/tasks/${id}`)
export const updateTask = (id, data) => api.put(`/tasks/${id}`, data)