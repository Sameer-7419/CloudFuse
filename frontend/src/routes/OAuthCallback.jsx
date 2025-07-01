import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const linked = searchParams.get('linked');
    const error = searchParams.get('error');

    console.log('OAuthCallback useEffect triggered with:', { linked, error, hasOpener: !!window.opener });

    if (window.opener) {
      if (linked) {
        // Send success message to parent window
        const message = {
          type: 'OAUTH_SUCCESS',
          provider: linked
        };
        console.log('Sending message to opener:', message);
        window.opener.postMessage(message, window.location.origin);
        console.log('Sent OAUTH_SUCCESS message for provider:', linked);
      } else if (error) {
        // Send error message to parent window
        const message = {
          type: 'OAUTH_ERROR',
          error: error
        };
        console.log('Sending error message to opener:', message);
        window.opener.postMessage(message, window.location.origin);
        console.log('Sent OAUTH_ERROR message:', error);
      } else {
        // No specific success/error indicator, assume success and let parent handle
        const message = {
          type: 'OAUTH_COMPLETE'
        };
        console.log('Sending complete message to opener:', message);
        window.opener.postMessage(message, window.location.origin);
        console.log('Sent OAUTH_COMPLETE message');
      }

      // Close the popup window
      setTimeout(() => {
        console.log('Closing popup window');
        window.close();
      }, 500);
    } else {
      console.log('No opener window detected, redirecting to home');
      // If not in popup, redirect to home
      navigate('/home');
    }
  }, [searchParams, navigate]);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      flexDirection: 'column',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h2>Completing Authorization...</h2>
        <p>This window will close automatically.</p>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #3498db',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '20px auto'
        }}></div>
      </div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default OAuthCallback;
