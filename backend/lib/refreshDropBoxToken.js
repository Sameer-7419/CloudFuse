import axios from 'axios';

export const refreshDropBoxToken = async (linkedAccount) => {
    try {
        console.log('Attempting to refresh Dropbox token...');
        
        // Validate required environment variables
        if (!process.env.DROPBOX_CLIENT_ID || !process.env.DROPBOX_CLIENT_SECRET) {
            throw new Error('Missing Dropbox client credentials in environment variables');
        }
        
        if (!linkedAccount.refreshToken) {
            console.warn('No refresh token available. The account may need to be re-linked.');
            throw new Error('No refresh token available for linked account. Please re-link your Dropbox account.');
        }
        
        const response = await axios.post('https://api.dropboxapi.com/oauth2/token', 
            new URLSearchParams({
                refresh_token: linkedAccount.refreshToken,
                client_id: process.env.DROPBOX_CLIENT_ID,
                client_secret: process.env.DROPBOX_CLIENT_SECRET,
                grant_type: 'refresh_token'
            }),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );

        const { access_token, refresh_token, expires_in } = response.data;
        
        console.log('Token refresh response:', {
            access_token: access_token ? 'received' : 'not received',
            refresh_token: refresh_token ? 'received' : 'not received',
            expires_in: expires_in || 'not provided'
        });
        
        // Update the linked account with new token
        linkedAccount.accessToken = access_token;
        // Update refresh token if a new one is provided
        if (refresh_token) {
            linkedAccount.refreshToken = refresh_token;
        }
        if (expires_in) {
            linkedAccount.tokenExpiry = new Date(Date.now() + expires_in * 1000);
        } else {
            // Default to 4 hours if no expiry provided
            linkedAccount.tokenExpiry = new Date(Date.now() + 4 * 60 * 60 * 1000);
        }
        await linkedAccount.save();

        console.log('Dropbox token refreshed successfully');
        
        return linkedAccount; // Return the updated account
        
    } catch (error) {
        console.error('Error refreshing Dropbox token:', error.response?.data || error.message);
        console.error('Full error details:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            message: error.message
        });
        throw new Error(`Failed to refresh Dropbox token: ${error.response?.data?.error_description || error.message}`);
    }
};