import axios from 'axios';

export const refreshGoogleDriveToken = async (linkedAccount) => {
    try {
        const response = await axios.post('https://oauth2.googleapis.com/token', {
            refresh_token: linkedAccount.refreshToken,
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            grant_type: 'refresh_token'
        });

        const { access_token, expires_in } = response.data;
        
        // Update the linked account with new token
        linkedAccount.accessToken = access_token;
        linkedAccount.tokenExpiry = new Date(Date.now() + expires_in * 1000);
        await linkedAccount.save();

        console.log('Google Drive token refreshed successfully');
        
    } catch (error) {
        console.error('Error refreshing Google Drive token:', error);
        throw new Error('Failed to refresh Google Drive token');
    }
};