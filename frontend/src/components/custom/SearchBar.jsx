import { useDebounce } from '@/hooks/useDebounce';
import axios from 'axios';
import styles from './SearchBar.module.css';
import { useCallback } from 'react';

const SearchBar = ({value,setValue,setSemanticFile}) => {

    const getAuthToken = useCallback(() => {
      return localStorage.getItem('authToken');
    }, []);
  
    // Create axios instance with auth token
    const createAuthenticatedRequest = useCallback(() => {
      const token = getAuthToken();
      return {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        withCredentials: true
      };
    }, [getAuthToken]);

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getFileTypeFromMimeType = (mimeType) => {
        if (!mimeType) return 'document';
        
        if (mimeType.startsWith('image/')) return 'image';
        if (mimeType.startsWith('video/')) return 'video';
        if (mimeType.startsWith('audio/')) return 'audio';
        if (mimeType.includes('pdf')) return 'pdf';
        if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('archive')) return 'archive';
        return 'document';
    };

    const determineOverallStatus = (uploadedTo) => {
        if (!uploadedTo || uploadedTo.length === 0) return 'pending';
        
        const statuses = uploadedTo.map(upload => upload.status);
        
        if (statuses.includes('pending')) return 'pending';
        if (statuses.includes('failed') && !statuses.includes('success')) return 'failed';
        if (statuses.includes('success')) return 'success';
        
        return 'pending';
    };

    const getPrimaryDestination = (uploadedTo) => {
        if (!uploadedTo || uploadedTo.length === 0) return 'Unknown';
        
        // Get the first successful upload or the first upload
        const successfulUpload = uploadedTo.find(upload => upload.status === 'success');
        const primaryUpload = successfulUpload || uploadedTo[0];
        
        switch (primaryUpload.provider) {
        case 'google_drive':
            return 'Google Drive';
        case 'dropbox':
            return 'Dropbox';
        case 'onedrive':
            return 'OneDrive';
        default:
            return primaryUpload.provider || 'Unknown';
        }
    };

    const getPrimaryDestinationType = (uploadedTo) => {
        if (!uploadedTo || uploadedTo.length === 0) return 'unknown';
        
        const successfulUpload = uploadedTo.find(upload => upload.status === 'success');
        const primaryUpload = successfulUpload || uploadedTo[0];
        
        switch (primaryUpload.provider) {
        case 'google_drive':
            return 'google-drive';
        case 'dropbox':
            return 'dropbox';
        case 'onedrive':
            return 'onedrive';
        default:
            return 'unknown';
        }
    };

    const getDownloadUrl = (uploadedTo) => {
        if (!uploadedTo || uploadedTo.length === 0) return null;
        
        const successfulUpload = uploadedTo.find(upload => upload.status === 'success' && upload.link);
        return successfulUpload ? successfulUpload.link : null;
    };

    const getErrorMessage = (uploadedTo) => {
        if (!uploadedTo || uploadedTo.length === 0) return null;
        
        const failedUpload = uploadedTo.find(upload => upload.status === 'failed');
        return failedUpload ? 'Upload failed' : null;
    };


  useDebounce(async () => {
    console.log('Debounce triggered with value:', value); // Add debug log
    const fetchData = async () => {
      try {
        const { data } = await axios.post(
          `http://localhost:3000/api/files/semanticFile`,{
            text_content:value
          },createAuthenticatedRequest()
        );
        console.log('Semantic search data received:', data); // Add debug log
        const transformedFiles = data.files.map(file => ({
          id: file._id,
          fileName: file.fileName,
          fileSize: formatFileSize(file.fileSize),
          fileType: getFileTypeFromMimeType(file.mimeType),
          mimeType: file.mimeType,
          uploadDate: file.uploadedAt,
          uploadedTo: file.uploadedTo || [],
          // Determine overall status based on uploadedTo array
          status: determineOverallStatus(file.uploadedTo),
          // Get primary destination for display
          destination: getPrimaryDestination(file.uploadedTo),
          destinationType: getPrimaryDestinationType(file.uploadedTo),
          // Check if any upload has a link for download
          downloadUrl: getDownloadUrl(file.uploadedTo),
          errorMessage: getErrorMessage(file.uploadedTo)
        }));

        setSemanticFile(transformedFiles);
      } catch (error) {
        console.log(error);
      }
    };
    if(value){
       fetchData();
    }
  },1000,[value]);

  return (
    <div className={styles.container}>
      <input
        type="text"
        className={styles.textbox}
        placeholder="Search file semantically..."
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
        }}
      />
    </div>
  );
};

export default SearchBar;