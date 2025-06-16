import { FileText } from "lucide-react"
import Link from "next/link"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary text-primary-foreground p-8 flex-col justify-between">
        <div>
          <Link href="/" className="flex items-center space-x-2 mb-8">
            <FileText className="h-8 w-8" />
            <span className="text-2xl font-bold">PDF Pro</span>
          </Link>
          <div className="space-y-6">
            <h1 className="text-4xl font-bold leading-tight">
              Professional PDF manipulation in your browser
            </h1>
            <p className="text-xl opacity-90">
              Edit, annotate, and collaborate on PDFs with enterprise-grade security.
              No software installation required.
            </p>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-primary-foreground rounded-full"></div>
                <span>Real-time collaboration</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-primary-foreground rounded-full"></div>
                <span>Advanced PDF editing tools</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-primary-foreground rounded-full"></div>
                <span>Enterprise-grade security</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-primary-foreground rounded-full"></div>
                <span>Digital signatures & forms</span>
              </div>
            </div>
          </div>
        </div>
        <div className="text-sm opacity-75">
          © 2024 PDF Pro. All rights reserved.
        </div>
      </div>

      {/* Right side - Auth form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  )
}
