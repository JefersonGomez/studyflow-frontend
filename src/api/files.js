import api from "./axios"

export const getFilesByCourse = (courseId) =>api.get(`/courses/${courseId}/files`)
export const uploadFile = (courseId,FormData)=>api.post(`/courses/${courseId}/files`,FormData,{
    headers : {"Content-Type":"multipart/form-data"}
})

export const deleteFile = (id) =>api.delete(`/files/${id}`)

