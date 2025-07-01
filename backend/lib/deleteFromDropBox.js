import axios from 'axios';
import LinkedAccount from '../db/LinkedAccount.js';
import {refreshDropBoxToken} from './refreshDropBoxToken.js';

const deleteFromDropBox = async (filePath, userId) => {
    try {
        console.log(`deleteFromDropBox called with filePath: "${filePath}", userId: "${userId}"`);
        
        // Find the linked Dropbox account
        const linkedAccount = await LinkedAccount.findOne({
            userId,
            provider: 'dropbox'
        });

        if (!linkedAccount) {
            throw new Error('Dropbox account is not linked');
        }

        let accessToken = linkedAccount.accessToken;

        // Check if token is expired and refresh if needed
        if (new Date() > linkedAccount.tokenExpiry) {
            console.log('Dropbox token expired, refreshing...');
            const refreshedAccount = await refreshDropBoxToken(linkedAccount);
            accessToken = refreshedAccount.accessToken;
        }

        // Handle file IDs vs file paths
        let pathToDelete = filePath;
        
        // If this looks like a file ID (starts with "id:" or "/id:"), we need special handling
        if (filePath.includes('id:')) {
            console.log(`Detected file ID: "${filePath}"`);
            // For file IDs, we'll try to delete and handle "not found" as success
            pathToDelete = filePath.startsWith('/') ? filePath : `/${filePath}`;
        } else {
            // For regular paths, ensure they start with /
            pathToDelete = filePath.startsWith('/') ? filePath : `/${filePath}`;
        }
        
        console.log(`Attempting to delete: "${pathToDelete}"`);

        // Try to delete the file - Dropbox will tell us if it doesn't exist
        const deleteResponse = await axios.post('https://api.dropboxapi.com/2/files/delete_v2', {
            path: pathToDelete
        }, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        console.log(`✅ File deleted successfully from Dropbox`);
        console.log('Delete response:', deleteResponse.data);
        
        return {
            success: true,
            message: 'File deleted successfully from Dropbox'
        };

    } catch (error) {
        console.error('Error deleting from Dropbox:', error.message);
        console.error('Error response status:', error.response?.status);
        console.error('Error response data:', JSON.stringify(error.response?.data, null, 2));
        
        // Handle specific Dropbox errors
        const errorSummary = error.response?.data?.error_summary || '';
        const errorTag = error.response?.data?.error?.['.tag'] || '';
        
        console.log(`Error details:`, {
            status: error.response?.status,
            errorSummary,
            errorTag,
            fullError: error.response?.data
        });
        
        // If file not found (already deleted or invalid ID), treat as success
        if (error.response?.status === 409) {
            if (errorSummary.includes('path_lookup/not_found') || 
                errorSummary.includes('not_found') ||
                errorTag === 'path_lookup') {
                console.log('✅ File not found in Dropbox (invalid ID or already deleted) - treating as successful deletion');
                return {
                    success: true,
                    message: 'File not found in Dropbox (likely already deleted)'
                };
            }
            
            // For other 409 conflicts
            console.error('❌ Dropbox 409 Conflict:', errorSummary);
            if (errorTag === 'path_write') {
                throw new Error('Cannot delete file: insufficient permissions or file is in use');
            }
        }
        
        // Handle token issues
        if (errorSummary.includes('invalid_access_token')) {
            console.error('❌ Invalid access token for Dropbox');
            throw new Error('Dropbox access token is invalid or expired');
        }
        
        // For any other errors, log and re-throw
        console.error('❌ Unexpected Dropbox error:', errorSummary);
        throw new Error(`Dropbox deletion failed (${error.response?.status}): ${errorSummary || error.message}`);
    }
};

export default deleteFromDropBox;