import { createSlice } from '@reduxjs/toolkit'
const notifSlice = createSlice({
  name: 'notif',
  initialState: { unreadCount: 0, notifications: [] },
  reducers: {
    setNotifications: (state, { payload }) => { state.notifications = payload },
    setUnreadCount: (state, { payload }) => { state.unreadCount = payload },
    markRead: (state, { payload }) => {
      state.notifications = state.notifications.map(n => n.id === payload ? { ...n, isRead: true } : n)
      state.unreadCount = Math.max(0, state.unreadCount - 1)
    }
  }
})
export const { setNotifications, setUnreadCount, markRead } = notifSlice.actions
export default notifSlice.reducer
