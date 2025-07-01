import LinkedAccount from '../db/LinkedAccount.js';
import axios from 'axios';
import {refreshGoogleDriveToken} from './refreshGoogleDriveToken.js';


const uploadToGoogleDrive = async (fileData, userId) => {
    try {
        // Find the linked Google Drive account for the user
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

        // Prepare file metadata
        const metadata = {
            name: fileData.fileName,
            parents: ['root'] // Upload to root folder, you can change this
        };

        // Step 1: Create file metadata
        const metadataResponse = await axios.post(
            'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable',
            metadata,
            {
                headers: {
                    'Authorization': `Bearer ${linkedAccount.accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const uploadUrl = metadataResponse.headers.location;

        // Step 2: Upload the actual file content
        const uploadResponse = await axios.put(
            uploadUrl,
            fileData.content, // This should be the file buffer/content
            {
                headers: {
                    'Content-Type': fileData.mimeType || 'application/octet-stream'
                }
            }
        );

        const uploadedFile = uploadResponse.data;

        console.log(`File ${fileData.fileName} uploaded successfully to Google Drive`);
        
        return {
            success: true,
            fileId: uploadedFile.id,
            fileName: uploadedFile.name,
            link: `https://drive.google.com/file/d/${uploadedFile.id}/view`,
            driveFileId: uploadedFile.id,
            message: 'File uploaded successfully to Google Drive'
        };

    } catch (error) {
        console.error('Error uploading to Google Drive:', error);
        
        if (error.response?.status === 401) {
            throw new Error('Google Drive access token expired');
        }
        
        throw new Error(`Failed to upload to Google Drive: ${error.message}`);
    }
};

export default uploadToGoogleDrive;