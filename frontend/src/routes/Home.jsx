import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, 
  Plus, 
  Trash2, 
  ExternalLink, 
  Cloud, 
  HardDrive,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import axios from "axios";

export default function Home() {
  const navigate = useNavigate();
  const [linkedAccounts, setLinkedAccounts] = useState([]);
  const [totalFilesUploaded, setTotalFilesUploaded] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);

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

  // Function to refresh account data
  const refreshAccountsData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      
      const token = getAuthToken();
      if (!token) {
        navigate('/auth');
        return;
      }

      // Fetch linked accounts
      const accountsResponse = await axios.get('http://localhost:3000/api/account', createAuthenticatedRequest());
      
      // Transform backend data to match frontend structure
      const transformedAccounts = accountsResponse.data.linkedAccounts.map(account => ({
        id: account.provider,
        type: account.provider === 'google_drive' ? 'google-drive' : account.provider,
        name: account.provider === 'google_drive' ? 'Google Drive' : 
              account.provider === 'dropbox' ? 'Dropbox' : 
              account.provider === 'onedrive' ? 'OneDrive' : account.provider,
        provider: account.provider,
        status: "connected",
        linkedAt: account.linkedAt,
        scopes: account.scopes || []
      }));

      setLinkedAccounts(transformedAccounts);

      // Auto-select provider if only one account is linked
      if (transformedAccounts.length === 1) {
        setSelectedProvider(transformedAccounts[0].provider);
      } else if (transformedAccounts.length === 0) {
        setSelectedProvider(null);
      }
      // If multiple accounts and no provider selected, keep current selection

      // Also refresh total files uploaded
      try {
        const filesResponse = await axios.get('http://localhost:3000/api/files', createAuthenticatedRequest());
        setTotalFilesUploaded(filesResponse.data.files?.length || 0);
      } catch (filesError) {
        if (filesError.response?.status === 404) {
          setTotalFilesUploaded(0);
        } else {
          console.error("Error fetching files:", filesError);
        }
      }
      
    } catch (error) {
      console.error("Error refreshing account data:", error);
      if (error.response?.status === 401) {
        localStorage.removeItem('authToken');
        navigate('/auth');
      } else if (error.response?.status === 404) {
        setLinkedAccounts([]);
      } else {
        setError("Failed to load account data. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [getAuthToken, createAuthenticatedRequest, navigate]);

  // Listen for OAuth completion messages
  useEffect(() => {
    function handleOAuthMessage(event) {
      // Verify origin for security - allow common development and OAuth domains
      const allowedOrigins = [
        "http://localhost:5173",  // Vite dev server
        "http://localhost:5174",  // Vite preview
        "http://localhost:5002",  // Current frontend port
        "http://localhost:3000",  // Backend/CRA
        "http://localhost:5000",  // Alternative frontend port
        "http://localhost:5001",  // Alternative frontend port
        window.location.origin    // Current frontend origin
      ];
      
      if (!allowedOrigins.includes(event.origin)) {
        console.log("Ignoring postMessage from unauthorized origin:", event.origin);
        return;
      }

      if (event.data.type === 'OAUTH_SUCCESS') {
        console.log("OAuth completed successfully for:", event.data.provider);
        
        // Refresh account data to get the newly linked account
      } else if (event.data.type === 'OAUTH_ERROR') {
        console.error("OAuth failed:", event.data.error);
        alert(`Account linking failed: ${event.data.error || 'Unknown error'}`);
      } else if (event.data.type === 'OAUTH_COMPLETE') {
        console.log("OAuth completed - refreshing account data");
        
        // Refresh account data for generic completion
        refreshAccountsData().then(() => {
          alert('Account linking completed! Please check your linked accounts.');
        });
      }
    }

    window.addEventListener("message", handleOAuthMessage);

    return () => {
      window.removeEventListener("message", handleOAuthMessage);
    };
  }, [refreshAccountsData]);

  // Fetch linked accounts from backend
  useEffect(() => {
    refreshAccountsData();
  }, [refreshAccountsData]);

  // Listen for OAuth completion messages
  useEffect(() => {
    function handleOAuthMessage(event) {
      // Verify origin for security (adjust based on your OAuth callback URL)
      if (event.origin !== "http://localhost:3000" && 
          event.origin !== "https://accounts.google.com" && 
          event.origin !== "https://www.dropbox.com") {
        return;
      }

      if (event.data.type === 'OAUTH_SUCCESS') {
        console.log("OAuth completed for:", event.data.provider);
        
        // Refresh account data to get the newly linked account
        refreshAccountsData().then(() => {
          const accountName = event.data.provider === 'google_drive' ? 'Google Drive' : 
                            event.data.provider === 'dropbox' ? 'Dropbox' : event.data.provider;
          
          const shouldReload = confirm(`${accountName} linked successfully! Click OK to reload the page and see your linked account, or Cancel to reload manually later.`);
          if (shouldReload) {
            window.location.reload();
          }
        });
      } else if (event.data.type === 'OAUTH_ERROR') {
        console.error("OAuth error:", event.data.error);
        alert('Account linking failed. Please try again later.');
      }
    }

    window.addEventListener("message", handleOAuthMessage);

    return () => {
      window.removeEventListener("message", handleOAuthMessage);
    };
  }, [refreshAccountsData]);

  const handleLinkAccount = async (accountType) => {
    try {
      console.log(`Linking ${accountType} account...`);
      
      // Map frontend account type to backend provider
      const provider = accountType === 'google-drive' ? 'google_drive' : accountType;
      
      const response = await axios.post('http://localhost:3000/api/account/link', {
        provider
      }, createAuthenticatedRequest());
      
      if (response.data.authUrl) {
        // Open OAuth URL in new window
        const authWindow = window.open(response.data.authUrl, '_blank', 'width=600,height=600');
        
        if (!authWindow) {
          alert('Popup blocked. Please allow popups for this site.');
          return;
        }
        
        // Simple fallback: Check if window is closed
        const checkWindowClosed = () => {
          if (authWindow.closed) {
            console.log('OAuth window closed - attempting silent refresh...');
            // Small delay to ensure any backend processing is complete
            setTimeout(async () => {
              await refreshAccountsData();
            }, 1000);
            return;
          }
          setTimeout(checkWindowClosed, 1000);
        };
        
        // Start checking if window closes (fallback only)
        checkWindowClosed();
      }
    } catch (error) {
      console.error("Error linking account:", error);
      if (error.response?.status === 401) {
        localStorage.removeItem('authToken');
        navigate('/auth');
      } else if (error.response?.status === 409) {
        alert("This account is already linked!");
      } else {
        const accountName = accountType === 'google-drive' ? 'Google Drive' : 
                          accountType === 'dropbox' ? 'Dropbox' : accountType;
        alert(`Failed to initiate ${accountName} linking. Please try again later.`);
      }
    }
  };

  const handleUnlinkAccount = async (accountId) => {
    try {
      const account = linkedAccounts.find(acc => acc.id === accountId);
      if (!account) return;
      
      if (confirm(`Are you sure you want to unlink ${account.name}?`)) {
        await axios.delete('http://localhost:3000/api/account/unlink', {
          data: { provider: account.provider },
          ...createAuthenticatedRequest()
        });
        
        // Refresh account data to get updated state from backend
        await refreshAccountsData();
        alert(`${account.name} unlinked successfully!`);
      }
    } catch (error) {
      console.error("Error unlinking account:", error);
      if (error.response?.status === 401) {
        localStorage.removeItem('authToken');
        navigate('/auth');
      } else if (error.response?.status === 404) {
        alert("Account is not linked or already removed.");
      } else {
        alert("Failed to unlink account. Please try again.");
      }
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      alert("Please select a file first!");
      return;
    }

    if (linkedAccounts.length === 0) {
      alert("Please link at least one cloud account first!");
      return;
    }

    // Auto-select provider if only one account and none selected
    let providerToUse = selectedProvider;
    if (!providerToUse && linkedAccounts.length === 1) {
      providerToUse = linkedAccounts[0].provider;
    }

    if (!providerToUse) {
      alert("Please select a destination account first!");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Create file data object for the backend
      const fileData = {
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        mimeType: selectedFile.type,
        content: await fileToBase64(selectedFile) // Convert file to base64
      };
      
      // Use the selected provider (or auto-selected if only one account)
      const provider = providerToUse;
      
      // Simulate progress while preparing upload
      setUploadProgress(10);

      const response = await axios.post('http://localhost:3000/api/files/upload', {
        fileData: fileData,
        provider: provider
      }, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        },
        withCredentials: true,
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(Math.max(10, percentCompleted)); // Ensure at least 10%
        }
      });

      if (response.status === 201) {
        setUploadProgress(100);
        const selectedAccount = linkedAccounts.find(acc => acc.provider === provider);
        alert(`File "${selectedFile.name}" uploaded successfully to ${selectedAccount?.name || provider}!`);
        setSelectedFile(null);
        setUploadProgress(0);
        
        // Increment the total files count
        setTotalFilesUploaded(prev => prev + 1);
        
        // You could redirect to history page to see the uploaded file
        // navigate('/history');
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      if (error.response?.status === 401) {
        localStorage.removeItem('authToken');
        navigate('/auth');
      } else if (error.response?.status === 400) {
        alert("Invalid file data or provider. Please try again.");
      } else {
        alert("Failed to upload file. Please try again.");
      }
    } finally {
      setIsUploading(false);
    }
  };

  // Helper function to convert file to base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        // Remove data:image/jpeg;base64, prefix to get just the base64 content
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  const getAccountIcon = (type) => {
    return type === "google-drive" ? (
      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
        <Cloud className="w-4 h-4 text-white" />
      </div>
    ) : (
      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
        <HardDrive className="w-4 h-4 text-white" />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header - Full width with proper spacing */}
      <header className="w-full bg-white border-b shadow-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Cloud className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">CloudFuse</span>
          </div>
          <nav className="hidden md:flex items-center space-x-8">
            <Button variant="default" className="bg-blue-600 hover:bg-blue-700">
              <a href="/history" className="text-white">View History</a>
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

      {/* Main Content - With proper spacing from header */}
      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Linked Accounts</CardTitle>
              <Cloud className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? (
                  <div className="animate-pulse bg-muted rounded h-8 w-8"></div>
                ) : (
                  linkedAccounts.length
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Active cloud connections
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Files Uploaded</CardTitle>
              <Upload className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? (
                  <div className="animate-pulse bg-muted rounded h-8 w-12"></div>
                ) : (
                  totalFilesUploaded
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                All time uploads
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Linked Accounts Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cloud className="h-5 w-5" />
                Linked Accounts
              </CardTitle>
              <CardDescription>
                Manage your connected cloud storage accounts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Loading State */}
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading linked accounts...</p>
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2 text-red-600">Error Loading Accounts</h3>
                  <p className="text-muted-foreground mb-4">{error}</p>
                  <Button onClick={() => refreshAccountsData()}>
                    Try Again
                  </Button>
                </div>
              ) : (
                <>
                  {/* Existing Accounts */}
                  {linkedAccounts.map((account) => (
                    <div key={account.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getAccountIcon(account.type)}
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{account.name}</h3>
                            <Badge variant="outline" className="text-xs">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Connected
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Linked {new Date(account.linkedAt).toLocaleDateString()}
                          </p>
                          {account.scopes && account.scopes.length > 0 && (
                            <p className="text-xs text-muted-foreground">
                              Scopes: {account.scopes.join(', ')}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleUnlinkAccount(account.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  {/* Empty State */}
                  {linkedAccounts.length === 0 && (
                    <div className="text-center py-8">
                      <Cloud className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No Accounts Linked</h3>
                      <p className="text-muted-foreground mb-4">
                        Link your cloud storage accounts to start uploading files
                      </p>
                    </div>
                  )}

                  {/* Add New Account */}
                  <div className="space-y-3 pt-4 border-t border-border">
                    <h4 className="font-medium text-sm">Link New Account</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <Button 
                        variant="outline" 
                        className="h-auto p-4 flex flex-col items-center space-y-2"
                        onClick={() => handleLinkAccount("google-drive")}
                        disabled={linkedAccounts.some(acc => acc.type === "google-drive")}
                      >
                        <Cloud className="w-6 h-6 text-blue-500" />
                        <span className="text-xs">Google Drive</span>
                      </Button>
                      <Button 
                        variant="outline" 
                        className="h-auto p-4 flex flex-col items-center space-y-2"
                        onClick={() => handleLinkAccount("dropbox")}
                        disabled={linkedAccounts.some(acc => acc.type === "dropbox")}
                      >
                        <HardDrive className="w-6 h-6 text-blue-600" />
                        <span className="text-xs">Dropbox</span>
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* File Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Files
              </CardTitle>
              <CardDescription>
                Upload files to your linked cloud accounts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* File Selection */}
              <div className="space-y-2">
                <Label htmlFor="file-upload">Select File</Label>
                <Input
                  id="file-upload"
                  type="file"
                  onChange={handleFileSelect}
                  disabled={isUploading}
                  className="cursor-pointer"
                />
                {selectedFile && (
                  <div className="text-sm text-muted-foreground">
                    Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </div>
                )}
              </div>

              {/* Provider Selection */}
              {linkedAccounts.length > 1 && (
                <div className="space-y-2">
                  <Label>Choose Upload Destination</Label>
                  <div className="grid grid-cols-1 gap-2">
                    {linkedAccounts.map((account) => (
                      <button
                        key={account.id}
                        type="button"
                        onClick={() => setSelectedProvider(account.provider)}
                        disabled={isUploading}
                        className={`flex items-center gap-3 p-3 border rounded-lg transition-colors ${
                          selectedProvider === account.provider
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-border hover:bg-muted'
                        } ${isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        {getAccountIcon(account.type)}
                        <div className="flex-1 text-left">
                          <div className="font-medium text-sm">{account.name}</div>
                          <div className="text-xs text-muted-foreground">
                            Linked {new Date(account.linkedAt).toLocaleDateString()}
                          </div>
                        </div>
                        {selectedProvider === account.provider && (
                          <CheckCircle className="w-4 h-4 text-blue-500" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Auto-select single provider */}
              {linkedAccounts.length === 1 && !selectedProvider && (
                <div className="space-y-2">
                  <Label>Upload Destination</Label>
                  <div className="flex items-center gap-3 p-3 border border-border rounded-lg bg-muted/50">
                    {getAccountIcon(linkedAccounts[0].type)}
                    <div className="flex-1">
                      <div className="font-medium text-sm">{linkedAccounts[0].name}</div>
                      <div className="text-xs text-muted-foreground">
                        Only linked account - will be used automatically
                      </div>
                    </div>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  </div>
                </div>
              )}

              {/* Upload Progress */}
              {isUploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Upload Button */}
              <Button 
                onClick={handleFileUpload}
                disabled={!selectedFile || isUploading || linkedAccounts.length === 0 || (linkedAccounts.length > 1 && !selectedProvider)}
                className="w-full"
              >
                {isUploading ? (
                  <>
                    <Upload className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload to Cloud
                  </>
                )}
              </Button>

              {/* Selection Warning */}
              {linkedAccounts.length > 1 && !selectedProvider && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-blue-800 dark:text-blue-200">
                    Please select a destination account above
                  </span>
                </div>
              )}

              {/* Warning if no accounts linked */}
              {linkedAccounts.length === 0 && (
                <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm text-yellow-800 dark:text-yellow-200">
                    Link at least one cloud account to upload files
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}