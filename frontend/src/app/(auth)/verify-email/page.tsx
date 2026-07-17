"use client"

import { useState, useEffect, Suspense } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { api } from "@/lib/api"
import { useSearchParams } from "next/navigation"

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying")
  const [message, setMessage] = useState("")

  useEffect(() => {
    if (!token) {
      setStatus("error")
      setMessage("Invalid verification link. No token found.")
      return
    }

    const verifyEmail = async () => {
      try {
        const response = await api.post("/auth/verify-email", { token })
        setStatus("success")
        setMessage(response.data.data.message)
      } catch (err: any) {
        setStatus("error")
        setMessage(err.response?.data?.message || "Verification failed. The link may have expired.")
      }
    }

    verifyEmail()
  }, [token])

  return (
    <div className="flex min-h-screen items-center justify-center p-4 relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md z-10"
      >
        <Card className="glass-card border-none bg-black/40">
          <CardHeader className="space-y-1 pb-4 text-center">
            {status === "verifying" && (
              <>
                <div className="mx-auto w-16 h-16 flex items-center justify-center mb-4">
                  <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
                <CardTitle className="text-2xl font-semibold tracking-tight">
                  Verifying your email...
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Please wait while we verify your email address.
                </CardDescription>
              </>
            )}

            {status === "success" && (
              <>
                <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <CardTitle className="text-2xl font-semibold tracking-tight">
                  Email verified!
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  {message || "Your email has been successfully verified. You can now sign in to your account."}
                </CardDescription>
              </>
            )}

            {status === "error" && (
              <>
                <div className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <CardTitle className="text-2xl font-semibold tracking-tight">
                  Verification failed
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  {message || "Something went wrong. The verification link may have expired."}
                </CardDescription>
              </>
            )}
          </CardHeader>
          <CardFooter className="flex flex-col gap-3">
            <Link href="/login" className="w-full">
              <Button className="w-full h-10 text-base">
                {status === "success" ? "Sign In" : "Back to Login"}
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}
