import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

import { Book, FileText, Video, Code } from 'lucide-react'
import Link from 'next/link'

export default function DocsPage() {
  const sections = [
    {
      icon: Book,
      title: "Getting Started",
      description: "Learn the basics of PDF Pro and get up and running quickly.",
      links: [
        "Quick Start Guide",
        "Account Setup",
        "First PDF Upload",
        "Basic Navigation"
      ]
    },
    {
      icon: FileText,
      title: "User Guide",
      description: "Comprehensive documentation for all PDF Pro features.",
      links: [
        "PDF Editing",
        "Collaboration Tools",
        "Digital Signatures",
        "OCR & Text Recognition"
      ]
    },
    {
      icon: Video,
      title: "Video Tutorials",
      description: "Step-by-step video guides for common workflows.",
      links: [
        "Basic Editing Tutorial",
        "Collaboration Workflow",
        "Advanced Features",
        "Tips & Tricks"
      ]
    },
    {
      icon: Code,
      title: "API Documentation",
      description: "Integrate PDF Pro into your applications with our API.",
      links: [
        "API Reference",
        "Authentication",
        "Code Examples",
        "SDKs & Libraries"
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            Documentation
          </Badge>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            PDF Pro Documentation
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Everything you need to know about using PDF Pro effectively. 
            From basic tutorials to advanced API integration.
          </p>
        </div>

        {/* Documentation Sections */}
        <div className="grid gap-8 md:grid-cols-2 max-w-6xl mx-auto mb-16">
          {sections.map((section, index) => (
            <Card key={index} className="h-full hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <section.icon className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <CardTitle className="text-xl">{section.title}</CardTitle>
                <CardDescription className="text-base">
                  {section.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {section.links.map((link, linkIndex) => (
                    <li key={linkIndex}>
                      <Link 
                        href="#" 
                        className="text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {link}
                      </Link>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search and Support */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Need More Help?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Can't find what you're looking for? Our support team is here to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/contact">Contact Support</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/help">Search Help Center</Link>
            </Button>
          </div>
      </div>
    </div>
  )
}
