import { Badge } from '@/components/ui/badge'
import { PageLayout } from '@/components/layout/page-layout'

export default function HelpPage() {
  return (
    <PageLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">Help Center</Badge>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Help Center</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Find answers to common questions and get help with PDF Pro.
          </p>
        </div>
      </div>
    </PageLayout>
  )
}
