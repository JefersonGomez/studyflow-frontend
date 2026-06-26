import api from "./axios"; // ← Asegúrate de que esta importación exista

export const getEventsByCourse = (courseId) => {
  console.log("API: Obteniendo eventos para curso:", courseId);
  return api.get(`/events?courseID=${courseId}`); // ← Cambiado de axios.get a api.get
};
export const getUserEvents = () => api.get("/events")
export const createEvent = (data) => api.post(`/events`, data);
export const deleteEvent = (id) => api.delete(`/events/${id}`);

export const updateEvent = (id, data) => api.put(`/events/${id}`, data);