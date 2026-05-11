import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../store/slices/authSlice';


export default function OAuth2RedirectHandler() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');

    if (token) {
      // In a real application, you might want to decode the JWT 
      // or fetch the user profile here. For now, we save the token.
      dispatch(loginSuccess({
        user: { /* Placeholder, consider fetching from /me API */ },
        token: token
      }));
      navigate('/');
    } else {
      navigate('/login?error=oauth2_failed');
    }
  }, [location, navigate, dispatch]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>Authenticating...</p>
    </div>
  );
}
