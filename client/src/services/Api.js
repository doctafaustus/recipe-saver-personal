import axios from 'axios';

export default function() {

  const baseURL = (window.location.host.includes('recipe-saver-personal.herokuapp.com')) ? 
  `https://${window.location.host}/api` : 'https://localhost:8081/api';

  axios.defaults.withCredentials = true;

  const axiosAPI = axios.create({
    baseURL
  });

  axiosAPI.interceptors.response.use(response => {
    return response;
  }, (error, x) => {
    console.error('Axios error:', error);
    if (error.response.status === 401) {
      window.location = '/login?login-reg-msg=login-again';
    }
    return Promise.reject(error);
  });

  return axiosAPI;
}