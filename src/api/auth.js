import api from "./axios"

export const getMe = () => api.get("/me")
export const getStats = () => api.get("/stats")
export const getUpcomingTasks = () => api.get("/upcoming-tasks")