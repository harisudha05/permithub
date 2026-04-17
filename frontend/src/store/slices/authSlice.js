import { createSlice } from '@reduxjs/toolkit'

// Validate stored token - check it's not expired by parsing JWT
function isTokenValid(token) {
  if (!token) return false
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    // exp is in seconds, Date.now() in ms
    return payload.exp * 1000 > Date.now()
  } catch {
    return false
  }
}

// Load from localStorage but validate first
const storedToken = localStorage.getItem('token')
const storedUser  = JSON.parse(localStorage.getItem('user') || 'null')

// If token is expired/invalid, clear localStorage immediately
const validToken = isTokenValid(storedToken) ? storedToken : null
const validUser  = validToken ? storedUser : null
if (!validToken) {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    token:           validToken,
    user:            validUser,
    isAuthenticated: !!validToken,
  },
  reducers: {
    setCredentials: (state, { payload }) => {
      state.token           = payload.token
      state.user            = payload.user
      state.isAuthenticated = true
      localStorage.setItem('token', payload.token)
      localStorage.setItem('user', JSON.stringify(payload.user))
    },
    logout: (state) => {
      state.token           = null
      state.user            = null
      state.isAuthenticated = false
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    },
    updateUser: (state, { payload }) => {
      state.user = { ...state.user, ...payload }
      localStorage.setItem('user', JSON.stringify(state.user))
    },
  },
})

export const { setCredentials, logout, updateUser } = authSlice.actions
export default authSlice.reducer
