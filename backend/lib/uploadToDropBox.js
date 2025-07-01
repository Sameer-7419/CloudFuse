import axios from 'axios';
import LinkedAccount from '../db/LinkedAccount.js';
import {refreshDropBoxToken} from './refreshDropBoxToken.js'

const uploadToDropBox = async (fileData, userId) => {
    try {
        // Find the linked Dropbox account for the user
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
            const refreshedAccount = await refreshDropBoxToken(linkedAccount);
            accessToken = refreshedAccount.accessToken;
        }

        // Prepare the file path (Dropbox paths start with /)
        const filePath = `/${fileData.fileName}`;

        // Upload file to Dropbox
        const uploadResponse = await axios.post(
            'https://content.dropboxapi.com/2/files/upload',
            fileData.content, // File buffer/content
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/octet-stream',
                    'Dropbox-API-Arg': JSON.stringify({
                        path: filePath,
                        mode: 'add', // 'add', 'overwrite', or 'update'
                        autorename: true, // Automatically rename if file exists
                        mute: false
                    })
                }
            }
        );

        const uploadedFile = uploadResponse.data;

        // Create a shared link for the uploaded file
        let shareLink = null;
        try {
            const shareLinkResponse = await axios.post(
                'https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings',
                {
                    path: uploadedFile.path_lower,
                    settings: {
                        requested_visibility: 'public',
                        audience: 'public',
                        access: 'viewer'
                    }
                },
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            shareLink = shareLinkResponse.data.url;
        } catch (linkError) {
            console.warn('Could not create shared link:', linkError.message);
            // Continue without shared link
        }

        console.log(`File ${fileData.fileName} uploaded successfully to Dropbox`);
        
        return {
            success: true,
            fileId: uploadedFile.id,
            fileName: uploadedFile.name,
            path: uploadedFile.path_display,
            link: shareLink,
            size: uploadedFile.size,
            message: 'File uploaded successfully to Dropbox',
        };

    } catch (error) {
        console.error('Error uploading to Dropbox:', error);
        
        if (error.response?.status === 401) {
            throw new Error('Dropbox access token expired or invalid');
        }
        
        if (error.response?.data?.error_summary) {
            throw new Error(`Dropbox error: ${error.response.data.error_summary}`);
        }
        
        throw new Error(`Failed to upload to Dropbox: ${error.message}`);
    }
};

export default uploadToDropBox;

