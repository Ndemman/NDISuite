import React from "react"
import Image from "next/image"
import Link from "next/link"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Left side - auth form */}
      <div className="flex flex-1 items-center justify-center px-4 py-12 md:px-8">
        {children}
      </div>

      {/* Right side - branding and image */}
      <div className="hidden md:flex flex-1 flex-col bg-gray-50 dark:bg-gray-900 p-12 justify-between">
        <div className="mb-auto">
          <Link href="/" className="flex items-center">
            <span className="text-2xl font-bold text-primary">NDISuite</span>
          </Link>
        </div>
        
        <div className="space-y-6">
          <div className="relative h-80 w-full rounded-lg overflow-hidden">
            <Image
              src="/images/auth-hero.jpg"
              alt="NDISuite Hero"
              fill
              style={{ objectFit: "cover" }}
              className="rounded-lg"
              priority
            />
          </div>
          
          <div>
            <h2 className="text-2xl font-semibold">NDISuite Report Writer</h2>
            <p className="mt-2 text-muted-foreground">
              Streamline your workflow with our AI-powered report generation system.
              Analyze audio, documents, and generate comprehensive reports effortlessly.
            </p>
          </div>

          <div className="mt-auto">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} NDISuite. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
