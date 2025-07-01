import axios from 'axios';
import LinkedAccount from '../db/LinkedAccount.js';
import {refreshGoogleDriveToken} from './refreshGoogleDriveToken.js';

const deleteFromGoogleDrive = async (fileId, userId) => {
    try {
        // Find the linked Google Drive account
        const linkedAccount = await LinkedAccount.findOne({
            userId,
            provider: 'google_drive'
        });

        if (!linkedAccount) {
            throw new Error('Google Drive account is not linked');
        }

        const accessToken = linkedAccount.accessToken;

        // Check if token is expired and refresh if needed
        if (new Date() > linkedAccount.tokenExpiry) {
            await refreshGoogleDriveToken(linkedAccount);
        }

        // Delete file from Google Drive
        await axios.delete(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
            headers: {
                'Authorization': `Bearer ${linkedAccount.accessToken}`,
            }
        });

        console.log(`File ${fileId} deleted successfully from Google Drive`);
        
        return {
            success: true,
            message: 'File deleted successfully from Google Drive'
        };

    } catch (error) {
        console.error('Error deleting from Google Drive:', error);
        
        if (error.response?.status === 404) {
            // File already doesn't exist, consider it a success
            return {
                success: true,
                message: 'File not found in Google Drive (may have been already deleted)'
            };
        }
        
        throw error;
    }
};

export default deleteFromGoogleDrive;