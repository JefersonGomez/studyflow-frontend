import { createContext,useContext,useState,useEffect } from "react";

/* AuthContext es un contenedor global de estado que cualquier componente 
puede leer sin pasar props */
const AuthContext = createContext()

export function AuthProvider ({children}) {
    const [token, setToken] = useState(localStorage.getItem('token'))
    const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'))

    const login = (newToken) =>{
        localStorage.setItem('token',newToken)
        setToken(newToken)
        setIsAuthenticated(true)

    }

    const logout = () =>{
        localStorage.removeItem('token')
        setToken(null)
        setIsAuthenticated(false)
    }

    return(
        <AuthContext.Provider value={{token,isAuthenticated,login,logout}}>
            {children}
        </AuthContext.Provider>
    )

}

export function useAuth(){
    return useContext(AuthContext)
}