import Link from 'next/link'
import { FileText } from 'lucide-react'

export function SiteFooter() {
  return (
    <footer className="border-t bg-muted/50">
      <div className="container py-8">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <FileText className="h-6 w-6" />
              <span className="font-bold">PDF Pro</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Professional PDF manipulation for modern teams.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Product</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/features" className="hover:text-foreground">Features</Link></li>
              <li><Link href="/pricing" className="hover:text-foreground">Pricing</Link></li>
              <li><Link href="/demo" className="hover:text-foreground">Demo</Link></li>
              <li><Link href="/api" className="hover:text-foreground">API</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Support</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/docs" className="hover:text-foreground">Documentation</Link></li>
              <li><Link href="/help" className="hover:text-foreground">Help Center</Link></li>
              <li><Link href="/contact" className="hover:text-foreground">Contact</Link></li>
              <li><Link href="/status" className="hover:text-foreground">Status</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/about" className="hover:text-foreground">About</Link></li>
              <li><Link href="/blog" className="hover:text-foreground">Blog</Link></li>
              <li><Link href="/careers" className="hover:text-foreground">Careers</Link></li>
              <li><Link href="/privacy" className="hover:text-foreground">Privacy</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
          © 2024 PDF Pro. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
