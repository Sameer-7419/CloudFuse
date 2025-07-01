import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle } from "lucide-react";
import axios from "axios";

export default function Auth() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [signupData, setSignupData] = useState({
    username: "",
    password: ""
  });
  const [signinData, setSigninData] = useState({
    username: "",
    password: ""
  });

  // Clear messages when user starts typing
  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    clearMessages();
    
    // Validation
    if (signupData.username === "" || signupData.password === "") {
      setError("Please fill in all fields");
      setIsLoading(false);
      return;
    }

    if (signupData.username.length < 3) {
      setError("Username must be at least 3 characters long");
      setIsLoading(false);
      return;
    }

    if (signupData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      setIsLoading(false);
      return;
    }
    
    try {
      console.log("Signup data:", signupData);
      
      const response = await axios.post("http://localhost:3000/api/auth/register", {
        username: signupData.username,
        password: signupData.password
      });
      
      console.log("Signup successful:", response.data);
      
      // Store token if provided by backend
      if (response.data.token) {
        localStorage.setItem('authToken', response.data.token);
        console.log("Token saved to localStorage:", response.data.token);
      }

      // Show success message
      setSuccess("Account created successfully! Redirecting...");
      
      // Navigate to home after short delay
      setTimeout(() => {
        navigate('/home');
      }, 1500);
      
    } catch (error) {
      console.error("Signup error:", error);
      
      // Handle different types of errors
      if (error.response) {
        // Server responded with error status
        const status = error.response.status;
        const message = error.response.data?.message || error.response.data?.error;
        
        switch (status) {
          case 400:
            setError(message || "Invalid input data. Please check your information.");
            break;
          case 409:
            setError("Username already exists. Please choose a different username.");
            break;
          case 422:
            setError(message || "Username or password format is invalid.");
            break;
          case 500:
            setError("Server error. Please try again later.");
            break;
          default:
            setError(message || "Registration failed. Please try again.");
        }
      } else if (error.request) {
        // Network error
        setError("Network error. Please check your internet connection and try again.");
      } else {
        // Other error
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    clearMessages();
    
    // Validation
    if (signinData.username === "" || signinData.password === "") {
      setError("Please fill in all fields");
      setIsLoading(false);
      return;
    }
    
    try {
      console.log("Signin data:", signinData);
      
      const response = await axios.post("http://localhost:3000/api/auth/login", {
        username: signinData.username,
        password: signinData.password
      });
      
      console.log("Signin successful:", response.data);
      
      // Store token if provided by backend
      if (response.data.token) {
        localStorage.setItem('authToken', response.data.token);
      }

      // Show success message
      setSuccess("Signed in successfully! Redirecting...");
      
      // Navigate to home after short delay
      setTimeout(() => {
        navigate('/home');
      }, 1500);
      
    } catch (error) {
      console.error("Signin error:", error);
      
      // Handle different types of errors
      if (error.response) {
        // Server responded with error status
        const status = error.response.status;
        const message = error.response.data?.message || error.response.data?.error;
        
        switch (status) {
          case 400:
            setError("Please provide both username and password.");
            break;
          case 401:
            setError("Invalid username or password. Please try again.");
            break;
          case 404:
            setError("User not found. Please check your username or sign up.");
            break;
          case 429:
            setError("Too many login attempts. Please try again later.");
            break;
          case 500:
            setError("Server error. Please try again later.");
            break;
          default:
            setError(message || "Login failed. Please try again.");
        }
      } else if (error.request) {
        // Network error
        setError("Network error. Please check your internet connection and try again.");
      } else {
        // Other error
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">CloudFuse</h1>
          <p className="text-muted-foreground">
            Your multi-platform file operations solution
          </p>
        </div>

        {/* Auth Card */}
        <Card className="w-full">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Welcome</CardTitle>
            <CardDescription className="text-center">
              Sign in to your account or create a new one
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Error Alert */}
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Success Alert */}
            {success && (
              <Alert className="mb-4 border-green-200 bg-green-50 text-green-800">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">{success}</AlertDescription>
              </Alert>
            )}

            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin" onClick={clearMessages}>Sign In</TabsTrigger>
                <TabsTrigger value="signup" onClick={clearMessages}>Sign Up</TabsTrigger>
              </TabsList>

              {/* Sign In Tab */}
              <TabsContent value="signin" className="space-y-4">
                <form onSubmit={handleSignin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-username">Username</Label>
                    <Input
                      id="signin-username"
                      type="text"
                      placeholder="johndoe"
                      value={signinData.username}
                      onChange={(e) => {
                        setSigninData({...signinData, username: e.target.value});
                        clearMessages();
                      }}
                      required
                      className={error ? "border-red-300 focus:border-red-500" : ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="••••••••"
                      value={signinData.password}
                      onChange={(e) => {
                        setSigninData({...signinData, password: e.target.value});
                        clearMessages();
                      }}
                      required
                      className={error ? "border-red-300 focus:border-red-500" : ""}
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-blue-600 hover:bg-blue-700" 
                    disabled={isLoading}
                  >
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              </TabsContent>

              {/* Sign Up Tab */}
              <TabsContent value="signup" className="space-y-4">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-username">Username</Label>
                    <Input
                      id="signup-username"
                      type="text"
                      placeholder="johndoe"
                      value={signupData.username}
                      onChange={(e) => {
                        setSignupData({...signupData, username: e.target.value});
                        clearMessages();
                      }}
                      required
                      className={error ? "border-red-300 focus:border-red-500" : ""}
                    />
                    <p className="text-xs text-muted-foreground">
                      At least 3 characters
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={signupData.password}
                      onChange={(e) => {
                        setSignupData({...signupData, password: e.target.value});
                        clearMessages();
                      }}
                      required
                      className={error ? "border-red-300 focus:border-red-500" : ""}
                    />
                    <p className="text-xs text-muted-foreground">
                      At least 6 characters
                    </p>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-blue-600 hover:bg-blue-700" 
                    disabled={isLoading}
                  >
                    {isLoading ? "Creating account..." : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>By continuing, you agree to our Terms of Service and Privacy Policy.</p>
        </div>
      </div>
    </div>
  );
}