import { createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import {createAsyncThunk} from '@reduxjs/toolkit';
import { BASE_ROUTE } from "../../constants/apiConstants";

export interface IUser {
  login: string;
  password: string;
  status: string;
  token: string;
}

const initialState: IUser = {
  login: '',
  password: '',
  status: '',
  token: ''
};

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      state.login = action.payload.login;
      state.password = action.payload.password;
    },
    loadUserStatus(state, action) {
      state.status = action.payload.status;
      state.token = action.payload.token;
    }
  },
});

export const loadUser = createAsyncThunk(
  'loadUserData',
  async (_, thunkAPI) => {
    const response = await axios.post(`${BASE_ROUTE}/users/authService`, {login: 'asd', password: '2312'});
    thunkAPI.dispatch(loadUserStatus(response.data));
    console.log('DATA SENT')
    return response;
  });

export const { setCredentials, loadUserStatus } = userSlice.actions;
export default userSlice.reducer;
