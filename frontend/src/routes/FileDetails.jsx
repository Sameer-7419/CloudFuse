import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Share,
  Copy,
  File,
  FileText,
  Image,
  Video,
  Music,
  Archive,
  Cloud,
  CheckCircle,
  AlertCircle,
  Loader2,
  ExternalLink
} from "lucide-react";

export default function FileDetails() {
  const { fileId } = useParams();
  const navigate = useNavigate();
  
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = getToken();
        
        if (!token || token.trim() === '' || token === 'null' || token === 'undefined') {
          navigate('/auth');
          return;
        }

        // Debug logging
        if (!fileId || fileId === 'undefined' || fileId === 'null') {
          console.error('Invalid fileId:', fileId);
          setError('Invalid file ID');
          return;
        }

        const response = await axios.get(`http://localhost:3000/api/files/${fileId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        setFile(response.data.file);
        setError(null);
      } catch (error) {
        console.error('Error fetching file details:', error);
        if (error.response?.status === 401) {
          localStorage.removeItem('authToken');
          navigate('/auth');
        } else if (error.response?.status === 404) {
          setError('File not found');
        } else {
          setError('Failed to load file details');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [fileId, navigate]);

  const getToken = () => {
    return localStorage.getItem('authToken');
  };

  const getFileIcon = (mimeType, size = "w-8 h-8") => {
    const iconClass = `${size}`;
    
    if (mimeType?.startsWith('image/')) {
      return <Image className={`${iconClass} text-blue-500`} />;
    } else if (mimeType?.startsWith('video/')) {
      return <Video className={`${iconClass} text-purple-500`} />;
    } else if (mimeType?.startsWith('audio/')) {
      return <Music className={`${iconClass} text-green-500`} />;
    } else if (mimeType?.includes('pdf')) {
      return <FileText className={`${iconClass} text-red-500`} />;
    } else if (mimeType?.includes('zip') || mimeType?.includes('archive')) {
      return <Archive className={`${iconClass} text-orange-500`} />;
    } else {
      return <File className={`${iconClass} text-gray-500`} />;
    }
  };

  const getProviderIcon = () => {
    return <Cloud className="w-4 h-4 text-blue-500" />;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const formatFileSize = (bytes) => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const handleCopyLink = async (link) => {
    try {
      await navigator.clipboard.writeText(link);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  const handleOpenLink = (link) => {
    window.open(link, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading file details...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold mb-2">Error</h1>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => navigate('/history')} className="bg-blue-600 hover:bg-blue-700">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to History
          </Button>
        </div>
      </div>
    );
  }

  if (!file) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <File className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h1 className="text-xl font-semibold mb-2">File not found</h1>
          <p className="text-muted-foreground mb-4">The requested file could not be found.</p>
          <Button onClick={() => navigate('/history')} className="bg-blue-600 hover:bg-blue-700">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to History
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="w-full bg-white border-b shadow-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Cloud className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">CloudFuse</span>
          </div>
          <nav className="hidden md:flex items-center space-x-8">
            <Button 
              onClick={() => navigate('/history')} 
              className="bg-blue-600 hover:bg-blue-700"
            >
              Back to History
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
        {/* File Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-4">
              {getFileIcon(file.mimeType, "w-12 h-12")}
              <div className="flex-1">
                <CardTitle className="text-2xl">{file.fileName}</CardTitle>
                <CardDescription>
                  {formatFileSize(file.fileSize)} • {file.mimeType} • Uploaded {formatDate(file.uploadedAt)}
                </CardDescription>
              </div>
              <Badge variant="default" className="bg-green-100 text-green-800">
                <CheckCircle className="w-3 h-3 mr-1" />
                Uploaded Successfully
              </Badge>
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* File Information */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <File className="w-5 h-5" />
                  File Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">File Name</Label>
                    <p className="text-sm text-muted-foreground mt-1">{file.fileName}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">File Size</Label>
                    <p className="text-sm text-muted-foreground mt-1">{formatFileSize(file.fileSize)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">File Type</Label>
                    <p className="text-sm text-muted-foreground mt-1">{file.mimeType}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Upload Date</Label>
                    <p className="text-sm text-muted-foreground mt-1">{formatDate(file.uploadedAt)}</p>
                  </div>
                    <Label className="text-sm font-medium">Uploaded To</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {file.uploadedTo.map((upload, index) => (
                        <div key={index} className="flex items-center gap-2">
                          {getProviderIcon()}
                          <span className="text-sm text-muted-foreground capitalize">
                            {upload.provider.replace('_', ' ')}
                          </span>
                          <Badge 
                            variant={upload.status === 'success' ? 'default' : 'destructive'}
                            className="text-xs"
                          >
                            {upload.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Summary</Label>
                    <p className="text-sm text-muted-foreground mt-1">{file.summary}</p>
                  </div>
                  <div>
                  <div>
                    <Label className="text-sm font-medium">Tags</Label>
                    <div className="flex flex-row gap-4">
                      {file.tags.map((tag)=>{
                        return <p className="text-sm text-muted-foreground mt-1">{tag}</p>
                      })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Share Links Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Share className="w-5 h-5" />
                  Shareable Links
                </CardTitle>
                <CardDescription>
                  Access your file's shareable links
                </CardDescription>
              </CardHeader>
              <CardContent>
                {file.uploadedTo.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No uploads found</p>
                ) : (
                  <div className="space-y-3">
                    {file.uploadedTo
                      .filter(upload => upload.status === 'success' && upload.link)
                      .map((upload, index) => (
                      <div key={index} className="p-3 border border-border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getProviderIcon()}
                            <Badge variant="default" className="capitalize">
                              {upload.provider.replace('_', ' ')}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">
                          Created: {formatDate(upload.timestamp)}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopyLink(upload.link)}
                            className="flex-1"
                          >
                            {linkCopied ? (
                              <CheckCircle className="w-3 h-3 mr-1 text-green-600" />
                            ) : (
                              <Copy className="w-3 h-3 mr-1" />
                            )}
                            {linkCopied ? 'Copied!' : 'Copy Link'}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenLink(upload.link)}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {file.uploadedTo.filter(upload => upload.status === 'success' && upload.link).length === 0 && (
                      <p className="text-sm text-muted-foreground">No shareable links available</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
