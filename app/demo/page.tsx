import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Play, FileText, Users, PenTool, Search } from 'lucide-react'
import Link from 'next/link'

export default function DemoPage() {
  const demos = [
    {
      icon: FileText,
      title: "PDF Editing Demo",
      description: "See how easy it is to edit text, images, and pages in PDF documents.",
      duration: "3 min",
      thumbnail: "/api/placeholder/400/225"
    },
    {
      icon: Users,
      title: "Real-time Collaboration",
      description: "Watch multiple users collaborate on the same document simultaneously.",
      duration: "4 min",
      thumbnail: "/api/placeholder/400/225"
    },
    {
      icon: PenTool,
      title: "Digital Signatures",
      description: "Learn how to create and apply legally binding digital signatures.",
      duration: "2 min",
      thumbnail: "/api/placeholder/400/225"
    },
    {
      icon: Search,
      title: "OCR Text Recognition",
      description: "Extract and search text from scanned documents and images.",
      duration: "3 min",
      thumbnail: "/api/placeholder/400/225"
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            Interactive Demo
          </Badge>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            See PDF Pro in Action
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Experience the power of PDF Pro with our interactive demos. 
            No signup required - just click and explore.
          </p>
        </div>

        {/* Live Demo Section */}
        <div className="max-w-4xl mx-auto mb-16">
          <Card className="overflow-hidden">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Interactive PDF Editor</CardTitle>
              <CardDescription>
                Try our full-featured PDF editor with a sample document
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center mb-6">
                <div className="text-center">
                  <Play className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                  <p className="text-lg font-semibold text-gray-700">
                    Interactive Demo Loading...
                  </p>
                  <p className="text-gray-500">
                    Click to start the demo
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg">
                  <Play className="h-4 w-4 mr-2" />
                  Start Interactive Demo
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link href="/signup">Try Full Version</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Video Demos */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
            Feature Demonstrations
          </h2>
          
          <div className="grid gap-8 md:grid-cols-2 max-w-6xl mx-auto">
            {demos.map((demo, index) => (
              <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-video bg-gray-200 relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <demo.icon className="h-12 w-12 text-blue-600 mx-auto mb-2" />
                      <Play className="h-8 w-8 text-white bg-blue-600 rounded-full p-1" />
                    </div>
                  </div>
                  <Badge className="absolute top-2 right-2 bg-black/70 text-white">
                    {demo.duration}
                  </Badge>
                </div>
                <CardHeader>
                  <CardTitle className="text-lg">{demo.title}</CardTitle>
                  <CardDescription>{demo.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full">
                    <Play className="h-4 w-4 mr-2" />
                    Watch Demo
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Sign up for free and start using PDF Pro today. No credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/signup">Start Free Trial</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/pricing">View Pricing</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
