import { createSlice } from '@reduxjs/toolkit';
import {
  logIn,
  logOut,
  refreshUser,
  getUser,
  dailyRate,
} from './auth-operations';

const initialState = {
  accessToken: null,
  refreshToken: null,
  sid: null,
  user: { userData: { dailyRate: null, notAllowedProducts: [] } },
  isLoggedIn: false,
  isRefreshing: false,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(logIn.fulfilled, (state, action) => {
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.isLoggedIn = true;
      })
      .addCase(logOut.fulfilled, state => {
        state.accessToken = null;
        state.refreshToken = null;
        state.sid = null;
        state.user = { userData: { dailyRate: null, notAllowedProducts: [] } };
        state.isLoggedIn = false;
      })
      .addCase(refreshUser.pending, state => {
        state.isRefreshing = true;
      })
      .addCase(refreshUser.fulfilled, (state, action) => {
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.isLoggedIn = true;
      })
      .addCase(refreshUser.rejected, state => {
        state.isRefreshing = false;
      })
      .addCase(getUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isRefreshing = false;
      })
      .addCase(dailyRate.fulfilled, (state, action) => {
        state.user.userData.dailyRate = action.payload.dailyRate;
        state.user.userData.notAllowedProducts = action.payload.notAllowedProducts;
      });
  },
});
