import { createSlice } from '@reduxjs/toolkit';

const userSlice = createSlice({
  name: 'user',
  initialState: {
    username: '',
    userId: '',
    session: false,
    role: '',
    token: ''
  },
  reducers: {
    setUsername: (state, action) => {
      state.username = action.payload;
    },
    setUserId: (state, action) => {
      state.userId = action.payload;
    },
    setSession: (state, action) => {
      state.session = action.payload;
    },
    setRole: (state, action) => {
      state.role = action.payload;
    },
    setToken: (state, action) => {
      state.token = action.payload;
    }
  },
});

export const { setUsername, setUserId, setSession, setRole, setToken } = userSlice.actions;
export default userSlice.reducer;