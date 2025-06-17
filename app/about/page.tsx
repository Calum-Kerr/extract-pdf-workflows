import { Badge } from '@/components/ui/badge'
import { PageLayout } from '@/components/layout/page-layout'

export default function AboutPage() {
  return (
    <PageLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">About Us</Badge>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">About PDF Pro</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We're building the future of PDF manipulation and collaboration.
          </p>
        </div>
      </div>
    </PageLayout>
  )
}
