"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { LogIn } from "lucide-react"

interface LoginBannerProps {
  onLogin: () => void
}

export function LoginBanner({ onLogin }: LoginBannerProps) {
  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-[1000] w-full max-w-2xl px-4">
      <Card className="bg-slate-900/95 backdrop-blur-sm text-white border-slate-700/50 shadow-2xl">
        <div className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                <LogIn className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2 text-white">
                This is a preview of all my boards - login option
              </h3>
              <p className="text-sm text-slate-300 mb-4 leading-relaxed">Login to start booking</p>
              <div className="flex gap-3">
                <Button
                  onClick={onLogin}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white font-medium px-6"
                >
                  Sign Up
                </Button>
                <Button
                  onClick={onLogin}
                  variant="outline"
                  size="sm"
                  className="bg-transparent border-slate-400 text-slate-300 hover:bg-slate-700 hover:text-white px-6"
                >
                  Or Log In
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
