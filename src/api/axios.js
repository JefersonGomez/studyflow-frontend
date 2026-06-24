//configuracion de axios 

import axios from "axios";

/* Crea una instancia de Axios con la URL base del backend ya configurada, así en el resto del código solo escribes /courses en vez de http://localhost:3000/api/v1/courses
El interceptor se ejecuta automáticamente antes de cada request y agrega el token JWT en el header Authorization, así no tienes que hacerlo manualmente en cada llamada */
const api = axios.create({
    baseURL:'http://localhost:3000/api/v1',
})

api.interceptors.request.use((config)=>{
    const token =localStorage.getItem('token')

    if (token){
        config.headers.Authorization=`Bearer ${token}`
    }

    return config
})

export default api