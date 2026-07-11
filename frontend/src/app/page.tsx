"use client"

import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import Link from "next/link"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 relative">
      {/* Abstract Background Effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px] opacity-50 pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="z-10 text-center max-w-3xl"
      >
        <h1 className="text-6xl font-extrabold tracking-tight mb-6 bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
          Enterprise Identity <br /> Made Simple.
        </h1>
        
        <p className="text-xl text-muted-foreground mb-10 leading-relaxed">
          AuthForge is a standalone authentication platform designed for modern distributed applications. Secure your users with JWT, Refresh Token Rotation, and robust Role-Based Access Control out of the box.
        </p>

        <div className="flex items-center justify-center gap-4">
          <Link href="/login">
            <Button size="lg" className="h-12 px-8 text-base font-semibold bg-white text-black hover:bg-white/90">
              Get Started
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button size="lg" variant="outline" className="h-12 px-8 text-base font-semibold glass hover:bg-white/5 border-white/10">
              View Documentation
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Decorative Code Snippet */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
        className="mt-20 w-full max-w-2xl glass-card p-1 rounded-2xl"
      >
        <div className="bg-black/80 rounded-xl p-6 font-mono text-sm text-gray-300 shadow-inner">
          <div className="flex gap-2 mb-4">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          <p><span className="text-purple-400">const</span> <span className="text-blue-400">auth</span> = <span className="text-purple-400">new</span> <span className="text-yellow-400">AuthForgeClient</span>(&#123;</p>
          <p className="ml-4">apiKey: <span className="text-green-400">'pk_test_...'</span>,</p>
          <p className="ml-4">domain: <span className="text-green-400">'api.authforge.dev'</span></p>
          <p>&#125;);</p>
          <br/>
          <p><span className="text-purple-400">await</span> auth.<span className="text-blue-400">signIn</span>(&#123;</p>
          <p className="ml-4">email: <span className="text-green-400">'user@enterprise.com'</span>,</p>
          <p className="ml-4">password: <span className="text-green-400">'••••••••••'</span></p>
          <p>&#125;);</p>
        </div>
      </motion.div>
    </main>
  )
}
