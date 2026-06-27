import api from "./axios";

export const getCourseWhiteboards = (courseId) => 
  api.get(`/courses/${courseId}/whiteboards`);

export const createWhiteboard = (data) => 
  api.post("/whiteboards", data);

export const updateWhiteboard = (id, data) => 
  api.put(`/whiteboards/${id}`, data);

export const deleteWhiteboard = (id) => 
  api.delete(`/whiteboards/${id}`);