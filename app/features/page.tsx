import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  FileText,
  Edit3,
  Users,
  Shield,
  Zap,
  Search,
  Download,
  Share2,
  PenTool,
  Eye,
  RotateCw,
  Scissors
} from 'lucide-react'
import Link from 'next/link'

export default function FeaturesPage() {
  const features = [
    {
      icon: FileText,
      title: "PDF Viewing",
      description: "High-quality PDF rendering with zoom, search, and navigation controls.",
      category: "Core"
    },
    {
      icon: Edit3,
      title: "Advanced Editing",
      description: "Edit text, images, and pages with professional-grade tools.",
      category: "Editing"
    },
    {
      icon: PenTool,
      title: "Digital Signatures",
      description: "Create and apply legally binding digital signatures.",
      category: "Security"
    },
    {
      icon: Users,
      title: "Real-time Collaboration",
      description: "Work together with your team in real-time on PDF documents.",
      category: "Collaboration"
    },
    {
      icon: Search,
      title: "OCR Text Recognition",
      description: "Extract and search text from scanned documents and images.",
      category: "AI"
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Bank-level encryption and compliance with industry standards.",
      category: "Security"
    },
    {
      icon: RotateCw,
      title: "Page Manipulation",
      description: "Rotate, reorder, split, and merge PDF pages with ease.",
      category: "Editing"
    },
    {
      icon: Share2,
      title: "Smart Sharing",
      description: "Share documents with granular permissions and expiration dates.",
      category: "Collaboration"
    },
    {
      icon: Download,
      title: "Multiple Formats",
      description: "Export to various formats including Word, Excel, and PowerPoint.",
      category: "Export"
    }
  ]

  const categories = ["All", "Core", "Editing", "Collaboration", "Security", "AI", "Export"]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            Features
          </Badge>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Everything You Need for PDFs
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            From basic viewing to advanced collaboration, PDF Pro provides all the tools 
            you need to work with PDF documents efficiently and securely.
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {categories.map((category) => (
            <Button
              key={category}
              variant={category === "All" ? "default" : "outline"}
              size="sm"
              className="mb-2"
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Features Grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 mb-16">
          {features.map((feature, index) => (
            <Card key={index} className="h-full hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <feature.icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {feature.category}
                  </Badge>
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Try PDF Pro today and experience the future of PDF manipulation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/signup">Start Free Trial</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/demo">View Demo</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
