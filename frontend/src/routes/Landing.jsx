

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Cloud,
  Upload,
  Download,
  Share2,
  Trash2,
  Link2,
  Shield,
  Zap,
  Users,
  CheckCircle,
  ArrowRight,
  HardDrive,
  FileText,
} from "lucide-react"

export default function Landing() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Cloud className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">CloudFuse</span>
          </div>
          <nav className="hidden md:flex items-center space-x-8">
            <Button className="bg-blue-600 hover:bg-blue-700"><a href="/auth">Get Started</a></Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <Badge variant="secondary" className="mb-4">
            Unified Cloud Storage Management
          </Badge>
          <h1 className="text-5xl font-bold text-gray-900 mb-6 max-w-4xl mx-auto">
            Manage Google Drive & Dropbox in One Place
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Upload, download, share, and delete files across multiple cloud storage platforms seamlessly. No more
            switching between apps.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Link2 className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle className="text-3xl font-bold">2+</CardTitle>
                <CardDescription>Cloud Platforms Supported</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle className="text-3xl font-bold">10M+</CardTitle>
                <CardDescription>Files Managed Daily</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Unified File Operations</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Perform all your file operations across Google Drive and Dropbox from a single, intuitive interface.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <Upload className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle>Upload Files</CardTitle>
                <CardDescription>Upload files to multiple cloud storage platforms simultaneously</CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <Download className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle>Download Files</CardTitle>
                <CardDescription>Download files from any connected cloud storage account</CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                  <Share2 className="h-8 w-8 text-purple-600" />
                </div>
                <CardTitle>Share Files</CardTitle>
                <CardDescription>Generate shareable links and manage permissions across platforms</CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <Trash2 className="h-8 w-8 text-red-600" />
                </div>
                <CardTitle>Delete Files</CardTitle>
                <CardDescription>Safely delete files from multiple cloud accounts at once</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Integration Section */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">Connect Your Cloud Accounts</h2>
              <p className="text-lg text-gray-600 mb-8">
                Seamlessly integrate with Google Drive and Dropbox. Manage all your files from one centralized dashboard.
              </p>

              <div className="space-y-4 mb-8">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Secure OAuth authentication</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Cross-platform file operations</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Unified storage analytics</span>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-lg">G</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">Google Drive</h3>
                      <p className="text-sm text-gray-600">15GB used of 100GB</p>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: "15%" }}></div>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Connected
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-lg">D</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">Dropbox</h3>
                      <p className="text-sm text-gray-600">2.1GB used of 2GB</p>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: "95%" }}></div>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Connected
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose CloudFuse?</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Experience the power of unified cloud storage management with enterprise-grade security and performance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Shield className="h-12 w-12 text-blue-600 mb-4" />
                <CardTitle>Enterprise Security</CardTitle>
                <CardDescription>
                  Bank-level encryption and secure OAuth authentication protect your data across all platforms.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Zap className="h-12 w-12 text-yellow-600 mb-4" />
                <CardTitle>Lightning Fast</CardTitle>
                <CardDescription>
                  Optimized file operations with instant processing for maximum speed and efficiency.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Users className="h-12 w-12 text-green-600 mb-4" />
                <CardTitle>Team Collaboration</CardTitle>
                <CardDescription>
                  Share files and collaborate with team members across different cloud platforms seamlessly.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gray-900 text-white">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Unify Your Cloud Storage?</h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join thousands of users who have simplified their cloud storage management with CloudFuse.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t py-12 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Cloud className="h-6 w-6 text-blue-600" />
                <span className="text-xl font-bold text-gray-900">CloudFuse</span>
              </div>
              <p className="text-gray-600">Unified cloud storage management for the modern world.</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Product</h3>
              <ul className="space-y-2 text-gray-600">
                <li>
                  <a href="#" className="hover:text-gray-900">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-gray-900">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-gray-900">
                    Security
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-gray-900">
                    API
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Company</h3>
              <ul className="space-y-2 text-gray-600">
                <li>
                  <a href="#" className="hover:text-gray-900">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-gray-900">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-gray-900">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-gray-900">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Support</h3>
              <ul className="space-y-2 text-gray-600">
                <li>
                  <a href="#" className="hover:text-gray-900">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-gray-900">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-gray-900">
                    Status
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-gray-900">
                    Privacy
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-gray-600">
            <p>&copy; 2024 CloudFuse. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
