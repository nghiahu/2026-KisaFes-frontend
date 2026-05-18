import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import { loginSuccess } from '../store/slices/authSlice';

export default function OAuth2RedirectHandler() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const temporaryToken = params.get('token');
    if (!temporaryToken) {
      navigate('/login?error=oauth2_failed');
      return;
    }
    handleOAuth2Login(temporaryToken);
  }, [location]);

  const handleOAuth2Login = async (
    temporaryToken: string
  ) => {
    try {
      const response = await axios.post(
        '/api/v1/auth/oauth2/callback',
        {},
        {
          headers: {
            Authorization: `Bearer ${temporaryToken}`
          },
          withCredentials: true
        }
      );

      const data = response.data.data;

      dispatch(
        loginSuccess({
          user: data.user,
          token: data.accessToken
        })
      );

      console.log(
        'OAuth2 login successful'
      );

      navigate('/');

    } catch (error) {

      console.error(
        'OAuth2 callback failed',
        error
      );

      navigate(
        '/login?error=oauth2_failed'
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>Authenticating...</p>
    </div>
  );
}