import { Router } from "express";
import axios from "axios";
import https from "https";
import authenticateToken from "../middlewares/authenticateToken.js";
import File from "../db/File.js";
import uploadToDropBox from "../lib/uploadToDropBox.js";
import uploadToGoogleDrive from "../lib/uploadToGoogleDrive.js";
import deleteFromGoogleDrive from "../lib/deleteFromGoogleDrive.js";
import deleteFromDropBox from "../lib/deleteFromDropBox.js";
import LinkedAccount from "../db/LinkedAccount.js";
import {refreshGoogleDriveToken} from "../lib/refreshGoogleDriveToken.js";
import {refreshDropBoxToken} from "../lib/refreshDropBoxToken.js";

const router = Router();
router.use(authenticateToken);

router.get("/", async (req, res) => {
    try {
        const userId = req.user._id;
        const files = await File.find({ userId }).sort({ createdAt: -1 });
        if (!files || files.length === 0) {
            return res.status(404).json({ message: "No files found" });
        }
        res.status(200).json({ files });
    } catch (error) {
        console.error("Error fetching files:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

router.post("/upload", async (req, res) => {
    const { fileData, provider } = req.body;

    if (!fileData || !provider) {
        return res.status(400).json({ message: "File data and provider are required" });
    }

    try {
        let uploadResponse;

        if (provider === "google_drive") {
            uploadResponse = await uploadToGoogleDrive(fileData, req.user._id);
        } else if (provider === "dropbox") {
            uploadResponse = await uploadToDropBox(fileData, req.user._id);
        } else {
            return res.status(400).json({ message: "Unsupported provider" });
        }

        // Save file metadata to the database
        const newFile = new File({
            userId: req.user._id,
            fileName: fileData.fileName,
            fileSize: fileData.fileSize || Buffer.byteLength(fileData.content), // Calculate size if not provided
            mimeType: fileData.mimeType || 'application/octet-stream',
            base64:fileData.content,
            uploadedTo: [
                {
                    provider: provider,
                    fileId: uploadResponse.fileId,
                    path: uploadResponse.path || null,
                    status: uploadResponse.success ? 'success' : 'failed',
                    link: uploadResponse.link || null,
                    timestamp: new Date()
                }
            ]
        });
        await newFile.save();

        res.status(201).json({ message: "File uploaded successfully", file: newFile });
    } catch (error) {
        console.error("Error uploading file:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

router.get("/:fileId", async (req, res) => {
    const { fileId } = req.params;

    // Validate fileId format
    if (!fileId || fileId === 'undefined' || fileId === 'null') {
        return res.status(400).json({ message: "Invalid file ID provided" });
    }

    // Check if fileId is a valid MongoDB ObjectId
    if (!fileId.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({ message: "Invalid file ID format" });
    }

    try {
        const file = await File.findById(fileId);
        if (!file) {
            return res.status(404).json({ message: "File not found" });
        }
        
        // Check if the file belongs to the authenticated user
        if (file.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized to access this file" });
        }
        
        res.status(200).json({ file });
    } catch (error) {
        console.error("Error fetching file:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

router.delete("/:fileId", async (req, res) => {
    const { fileId } = req.params;

    try {
        // First, find the file to get provider information
        const file = await File.findById(fileId);
        if (!file) {
            return res.status(404).json({ message: "File not found" });
        }

        // Check if the file belongs to the authenticated user
        if (file.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized to delete this file" });
        }

        const deletionResults = [];

        // Delete from each cloud provider where the file was uploaded
        for (const uploadInfo of file.uploadedTo) {
            if (uploadInfo.status === 'success' && uploadInfo.fileId) {
                try {
                    let deleteResult;

                    if (uploadInfo.provider === 'google_drive') {
                        deleteResult = await deleteFromGoogleDrive(uploadInfo.fileId, req.user._id);
                    } else if (uploadInfo.provider === 'dropbox') {
                        // For Dropbox, use the file path instead of fileId
                        deleteResult = await deleteFromDropBox(uploadInfo.path, req.user._id);
                    }

                    deletionResults.push({
                        provider: uploadInfo.provider,
                        status: 'success',
                        message: `Deleted from ${uploadInfo.provider} successfully`
                    });

                } catch (providerError) {
                    console.error(`Error deleting from ${uploadInfo.provider}:`, providerError);
                    deletionResults.push({
                        provider: uploadInfo.provider,
                        status: 'failed',
                        message: `Failed to delete from ${uploadInfo.provider}: ${providerError.message}`
                    });
                }
            }
        }

        // Delete the file record from database
        await File.findByIdAndDelete(fileId);

        const successfulDeletions = deletionResults.filter(result => result.status === 'success');
        const failedDeletions = deletionResults.filter(result => result.status === 'failed');

        res.status(200).json({ 
            message: "File deletion completed",
            database: "File record deleted successfully",
            cloudProviders: {
                total: deletionResults.length,
                successful: successfulDeletions.length,
                failed: failedDeletions.length,
                details: deletionResults
            }
        });

    } catch (error) {
        console.error("Error deleting file:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});


router.post("/download/:fileId", async (req, res) => {
    const { fileId } = req.params;

    try {
        const file = await File.findById(fileId);
        if (!file) {
            return res.status(404).json({ message: "File not found" });
        }

        // Check if the file belongs to the authenticated user
        if (file.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized to download this file" });
        }

        // Get the first successful upload info
        const uploadInfo = file.uploadedTo.find(upload => upload.status === 'success');
        if (!uploadInfo) {
            return res.status(400).json({ message: "No successful upload found for download" });
        }

        // Provider-specific validation
        if (uploadInfo.provider === 'google_drive' && !uploadInfo.fileId) {
            return res.status(400).json({ message: "No valid file ID found for Google Drive download" });
        }

        if (uploadInfo.provider === 'dropbox' && !uploadInfo.path) {
            return res.status(400).json({ message: "No valid file path found for Dropbox download" });
        }

        // Get the linked account for access token
        const linkedAccount = await LinkedAccount.findOne({
            userId: req.user._id,
            provider: uploadInfo.provider
        });

        if (!linkedAccount) {
            return res.status(400).json({ message: `${uploadInfo.provider} account not linked` });
        }

        // Check if token is expired and refresh if needed
        let accessToken = linkedAccount.accessToken;
        if (new Date() > linkedAccount.tokenExpiry) {
            if (uploadInfo.provider === 'google_drive') {
                const refreshedAccount = await refreshGoogleDriveToken(linkedAccount);
                accessToken = refreshedAccount.accessToken;
            } else if (uploadInfo.provider === 'dropbox') {
                const refreshedAccount = await refreshDropBoxToken(linkedAccount);
                accessToken = refreshedAccount.accessToken;
            }
        }

        if (uploadInfo.provider === 'google_drive') {
            // Google Drive: Use file ID in URL (no path needed)
            const response = await axios.get(
                `https://www.googleapis.com/drive/v3/files/${uploadInfo.fileId}?alt=media`,
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    },
                    responseType: 'stream'
                }
            );

            // Set headers for file download
            res.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);
            res.setHeader('Content-Type', file.mimeType);
            res.setHeader('Content-Length', file.fileSize);

            // Pipe the file stream to response
            response.data.pipe(res);

        } else if (uploadInfo.provider === 'dropbox') {
            // Dropbox: Use path in Dropbox-API-Arg header (path is required)
            const filePath = uploadInfo.path;
            
            console.log(`Attempting Dropbox download for file: ${filePath}`);
            console.log(`Using access token: ${accessToken ? 'present' : 'missing'}`);
            console.log(`File upload info:`, JSON.stringify(uploadInfo, null, 2));
            
            // Ensure path format is correct
            const normalizedPath = filePath.startsWith('/') ? filePath : `/${filePath}`;
            console.log(`Normalized path: ${normalizedPath}`);
            
            try {
                // Use fetch to avoid axios header issues
                console.log(`Making fetch request to Dropbox download API...`);
                
                const response = await fetch('https://content.dropboxapi.com/2/files/download', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Dropbox-API-Arg': JSON.stringify({
                            path: normalizedPath
                        })
                        // Explicitly no Content-Type header
                    }
                    // No body property at all
                });

                console.log(` Dropbox download response status: ${response.status}`);
                console.log(`Response headers:`, Object.fromEntries(response.headers.entries()));
                
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error(` Dropbox download failed: ${response.status} - ${errorText}`);
                    
                    if (response.status === 404 || errorText.includes('not_found')) {
                        return res.status(404).json({
                            message: "File not found in Dropbox. It may have been deleted or moved.",
                            provider: "dropbox",
                            path: normalizedPath
                        });
                    }
                    
                    throw new Error(`Dropbox API error: ${response.status} - ${errorText}`);
                }

                console.log(` Dropbox download successful for: ${normalizedPath}`);
                
                // Set headers for file download
                res.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);
                res.setHeader('Content-Type', file.mimeType);
                
                // Get content length from response if available
                const contentLength = response.headers.get('content-length');
                if (contentLength) {
                    res.setHeader('Content-Length', contentLength);
                } else {
                    res.setHeader('Content-Length', file.fileSize);
                }

                // Stream the response body to the client
                if (response.body) {
                    const reader = response.body.getReader();
                    
                    const pump = async () => {
                        try {
                            while (true) {
                                const { done, value } = await reader.read();
                                if (done) break;
                                res.write(value);
                            }
                            res.end();
                        } catch (streamError) {
                            console.error('Error streaming file:', streamError);
                            res.status(500).json({ message: 'Error streaming file' });
                        }
                    };
                    
                    await pump();
                } else {
                    res.status(500).json({ message: 'No response body from Dropbox' });
                }
                
            } catch (dropboxError) {
                console.error(' Dropbox download error:', dropboxError.message);
                
                // Check if file exists by trying to get metadata first with fetch
                try {
                    console.log('🔍 Checking if file exists in Dropbox...');
                    const metadataResponse = await fetch('https://api.dropboxapi.com/2/files/get_metadata', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${accessToken}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            path: normalizedPath,
                            include_media_info: false,
                            include_deleted: false
                        })
                    });
                    
                    if (metadataResponse.ok) {
                        const metadata = await metadataResponse.json();
                        console.log(' File metadata:', JSON.stringify(metadata, null, 2));
                        throw new Error(`File exists but download failed: ${dropboxError.message}`);
                    } else {
                        const errorText = await metadataResponse.text();
                        if (errorText.includes('path_lookup/not_found')) {
                            return res.status(404).json({
                                message: "File not found in Dropbox. It may have been deleted or moved.",
                                provider: "dropbox",
                                path: normalizedPath
                            });
                        }
                    }
                    
                } catch (metadataError) {
                    console.error(' File metadata check failed:', metadataError.message);
                    // Fall through to throw original error
                }
                
                throw dropboxError; // Re-throw original download error
            }

        } else {
            return res.status(400).json({ message: "Unsupported provider for download" });
        }

    } catch (error) {
        console.error("Error downloading file:", error.message);
        
        // Parse error details for different status codes
        const errorStatus = error.message.includes('400') ? 400 :
                          error.message.includes('401') ? 401 :
                          error.message.includes('404') ? 404 :
                          error.message.includes('409') ? 409 : 500;
        
        if (errorStatus === 401) {
            return res.status(401).json({ 
                message: "Access token expired. Please re-link your account.",
                provider: uploadInfo?.provider 
            });
        }
        
        if (errorStatus === 404) {
            return res.status(404).json({ 
                message: "File not found in cloud storage. It may have been deleted.",
                provider: uploadInfo?.provider 
            });
        }
        
        if (errorStatus === 400) {
            return res.status(400).json({ 
                message: "Bad request to cloud provider. Invalid file path or parameters.",
                provider: uploadInfo?.provider,
                details: error.message
            });
        }
        
        if (errorStatus === 409) {
            return res.status(409).json({ 
                message: "File path conflict or invalid path format.",
                provider: uploadInfo?.provider,
                details: error.message
            });
        }
        
        res.status(500).json({ 
            message: "Internal server error", 
            error: error.message,
            provider: uploadInfo?.provider 
        });
    }
});

router.get("/share/:fileId", async (req, res) => {
    const { fileId } = req.params;

    try {
        const file = await File.findById(fileId);
        if (!file) {
            return res.status(404).json({ message: "File not found" });
        }

        // Check if the file belongs to the authenticated user
        if (file.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized to share this file" });
        }

        // Get the first successful upload info
        const uploadInfo = file.uploadedTo.find(upload => upload.status === 'success');
        if (!uploadInfo) {
            return res.status(400).json({ message: "No successful upload found for sharing" });
        }

        // Provider-specific validation
        if (uploadInfo.provider === 'google_drive' && !uploadInfo.fileId) {
            return res.status(400).json({ message: "No valid file ID found for Google Drive sharing" });
        }

        if (uploadInfo.provider === 'dropbox' && !uploadInfo.path) {
            return res.status(400).json({ message: "No valid file path found for Dropbox sharing" });
        }

        res.status(200).json({
            sharableLink:uploadInfo.link,
            provider:uploadInfo.provider,
            fileName: file.fileName,
        });

    }catch(err){
        console.error("Error generating sharable link",err);
    }
});

        
       


export default router;