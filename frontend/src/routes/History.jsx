import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { 
  ArrowLeft,
  Search,
  Filter,
  Download,
  Upload,
  Trash2,
  FileText,
  Image,
  Video,
  Music,
  Archive,
  File,
  Cloud,
  HardDrive,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";

export default function History() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedAccount, setSelectedAccount] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [uploadHistory, setUploadHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Get auth token from localStorage
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

  // Fetch upload history from backend
  useEffect(() => {
    const fetchUploadHistory = async () => {
      const token = getAuthToken();
      
      // More robust token validation
      if (!token || token.trim() === '' || token === 'null' || token === 'undefined') {
        navigate('/auth');
        return;
      }

      try {
        setIsLoading(true);
        const response = await axios.get('http://localhost:3000/api/files', createAuthenticatedRequest());
        
        // Transform backend data to match frontend structure
        const transformedFiles = response.data.files.map(file => ({
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

        setUploadHistory(transformedFiles);
      } catch (error) {
        console.error('Error fetching upload history:', error);
        if (error.response?.status === 401) {
          localStorage.removeItem('authToken');
          navigate('/auth');
        } else if (error.response?.status === 404) {
          // No files found is not an error, just empty state
          setUploadHistory([]);
        } else {
          setError('Failed to load upload history. Please refresh the page.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchUploadHistory();
  }, [navigate, getAuthToken, createAuthenticatedRequest]);

  // Helper functions to transform backend data
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

  // Delete file function
  const handleDeleteFile = async (fileId, event) => {
    // Prevent navigation when delete button is clicked
    event.stopPropagation();
    
    const file = uploadHistory.find(f => f.id === fileId);
    if (!file) return;

    if (!confirm(`Are you sure you want to delete "${file.fileName}"? This will remove it from all connected cloud accounts.`)) {
      return;
    }

    try {
      await axios.delete(`http://localhost:3000/api/files/${fileId}`, createAuthenticatedRequest());
      
      // Update local state
      setUploadHistory(prev => prev.filter(f => f.id !== fileId));
      alert('File deleted successfully!');
    } catch (error) {
      console.error('Error deleting file:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('authToken');
        navigate('/auth');
      } else {
        alert('Failed to delete file. Please try again.');
      }
    }
  };

  // Navigate to file details
  const handleFileClick = (fileId) => {
    const token = getAuthToken();
    
    // Check if we have a valid token before navigating
    if (!token || token.trim() === '' || token === 'null' || token === 'undefined') {
      navigate('/auth');
      return;
    }
    
    navigate(`/file/${fileId}`);
  };

  // Download file function  
  const handleDownloadFile = async (fileId, event) => {
    // Prevent navigation when download button is clicked
    event.stopPropagation();
    
    try {
      const response = await axios.post(`http://localhost:3000/api/files/download/${fileId}`, {}, {
        ...createAuthenticatedRequest(),
        responseType: 'blob'
      });

      // Create blob URL and trigger download
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Get filename from response headers or use original filename
      const file = uploadHistory.find(f => f.id === fileId);
      link.download = file ? file.fileName : 'download';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('authToken');
        navigate('/auth');
      } else {
        alert('Failed to download file. Please try again.');
      }
    }
  };

  // Filter and search logic
  const filteredHistory = uploadHistory.filter(item => {
    const matchesSearch = item.fileName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === "all" || item.status === selectedStatus;
    const matchesAccount = selectedAccount === "all" || item.destinationType === selectedAccount;
    
    return matchesSearch && matchesStatus && matchesAccount;
  });

  // Sort logic
  const sortedHistory = [...filteredHistory].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.uploadDate) - new Date(a.uploadDate);
      case "oldest":
        return new Date(a.uploadDate) - new Date(b.uploadDate);
      case "name":
        return a.fileName.localeCompare(b.fileName);
      case "size": {
        // Parse file size for sorting (extract number from "2.4 MB" format)
        const getSizeInBytes = (sizeStr) => {
          const match = sizeStr.match(/(\d+\.?\d*)\s*(Bytes|KB|MB|GB)/);
          if (!match) return 0;
          const [, num, unit] = match;
          const multipliers = { Bytes: 1, KB: 1024, MB: 1024**2, GB: 1024**3 };
          return parseFloat(num) * (multipliers[unit] || 1);
        };
        return getSizeInBytes(b.fileSize) - getSizeInBytes(a.fileSize);
      }
      default:
        return 0;
    }
  });

  const getFileIcon = (fileType) => {
    switch (fileType) {
      case "image":
        return <Image className="w-5 h-5 text-blue-500" />;
      case "video":
        return <Video className="w-5 h-5 text-purple-500" />;
      case "audio":
        return <Music className="w-5 h-5 text-green-500" />;
      case "archive":
        return <Archive className="w-5 h-5 text-orange-500" />;
      case "pdf":
        return <FileText className="w-5 h-5 text-red-500" />;
      default:
        return <File className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status, progress) => {
    switch (status) {
      case "success":
        return <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          Success
        </Badge>;
      case "failed":
        return <Badge variant="destructive">
          <XCircle className="w-3 h-3 mr-1" />
          Failed
        </Badge>;
      case "pending":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
          <AlertCircle className="w-3 h-3 mr-1" />
          Uploading {progress}%
        </Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getAccountIcon = (type) => {
    switch (type) {
      case "google-drive":
        return <Cloud className="w-4 h-4 text-blue-500" />;
      case "dropbox":
        return <HardDrive className="w-4 h-4 text-blue-600" />;
      case "onedrive":
        return <Cloud className="w-4 h-4 text-green-500" />;
      default:
        return <HardDrive className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      return `${diffInMinutes} minutes ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`;
    } else if (diffInHours < 48) {
      return "1 day ago";
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="w-full bg-white border-b shadow-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Cloud className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">CloudFuse</span>
          </div>
          <nav className="hidden md:flex items-center space-x-8">
            <Button variant="default" className="bg-blue-600 hover:bg-blue-700">
              <a href="/home" className="text-white">Back to home</a>
            </Button>
            <Button 
              onClick={() => {
                localStorage.removeItem('authToken');
                navigate('/auth')}} 
              className="bg-blue-600 hover:bg-blue-700"
            >
              Sign Out
            </Button>
          </nav>
        </div>
      </header>
      <div className="max-w-6xl mx-auto space-y-6 p-8">
        {/* Stats Cards */}
        {!isLoading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Files</p>
                    <p className="text-2xl font-bold">{uploadHistory.length}</p>
                  </div>
                  <Upload className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Successful</p>
                    <p className="text-2xl font-bold text-green-600">
                      {uploadHistory.filter(f => f.status === 'success').length}
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Failed</p>
                    <p className="text-2xl font-bold text-red-600">
                      {uploadHistory.filter(f => f.status === 'failed').length}
                    </p>
                  </div>
                  <XCircle className="w-8 h-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">In Progress</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {uploadHistory.filter(f => f.status === 'pending').length}
                    </p>
                  </div>
                  <AlertCircle className="w-8 h-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search files..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="all">All Status</option>
                <option value="success">Success</option>
                <option value="failed">Failed</option>
                <option value="pending">In Progress</option>
              </select>

              {/* Account Filter */}
              <select
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="all">All Accounts</option>
                <option value="google-drive">Google Drive</option>
                <option value="dropbox">Dropbox</option>
              </select>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="name">Name (A-Z)</option>
                <option value="size">Size (Large-Small)</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Upload History List */}
        <Card>
          <CardHeader>
            <CardTitle>Upload History ({sortedHistory.length} files)</CardTitle>
            <CardDescription>
              Detailed view of all your file uploads
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading upload history...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2 text-red-600">Error Loading History</h3>
                <p className="text-muted-foreground mb-4">{error}</p>
                <Button onClick={() => window.location.reload()}>
                  Try Again
                </Button>
              </div>
            ) : sortedHistory.length === 0 ? (
              <div className="text-center py-12">
                <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No uploads found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || selectedStatus !== "all" || selectedAccount !== "all" 
                    ? "Try adjusting your filters or search term"
                    : "Start uploading files to see them here"
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {sortedHistory.map((upload) => (
                  <div 
                    key={upload.id} 
                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => handleFileClick(upload.id)}
                  >
                    <div className="flex items-center space-x-4">
                      {/* File Icon */}
                      <div className="flex-shrink-0">
                        {getFileIcon(upload.fileType)}
                      </div>
                      
                      {/* File Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium truncate">{upload.fileName}</p>
                          {getStatusBadge(upload.status, upload.progress)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{upload.fileSize}</span>
                          <span className="flex items-center gap-1">
                            {getAccountIcon(upload.destinationType)}
                            {upload.destination}
                          </span>
                          {upload.uploadedTo && upload.uploadedTo.length > 1 && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              +{upload.uploadedTo.length - 1} more
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(upload.uploadDate)}
                          </span>
                        </div>
                        {upload.errorMessage && (
                          <p className="text-sm text-red-600 mt-1">
                            Error: {upload.errorMessage}
                          </p>
                        )}
                        {upload.status === "pending" && upload.progress && (
                          <div className="mt-2 w-full bg-muted rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${upload.progress}%` }}
                            ></div>
                          </div>
                        )}
                        {/* Show upload destinations */}
                        {upload.uploadedTo && upload.uploadedTo.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {upload.uploadedTo.map((dest, index) => (
                              <span 
                                key={index}
                                className={`text-xs px-2 py-1 rounded ${
                                  dest.status === 'success' 
                                    ? 'bg-green-100 text-green-800' 
                                    : dest.status === 'failed'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}
                              >
                                {dest.provider === 'google_drive' ? 'Google Drive' : 
                                 dest.provider === 'dropbox' ? 'Dropbox' : 
                                 dest.provider === 'onedrive' ? 'OneDrive' : dest.provider} - {dest.status}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                      {upload.downloadUrl && upload.status === "success" && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={(e) => handleDownloadFile(upload.id, e)}
                          title="Download file"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      )}
                      {upload.status === "failed" && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={(e) => e.stopPropagation()}
                          title="Retry upload"
                        >
                          Retry
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-red-600 hover:text-red-700"
                        onClick={(e) => handleDeleteFile(upload.id, e)}
                        title="Delete file"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}