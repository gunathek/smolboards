import type React from "react"

export default function NewCampaignLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className="fixed inset-0 bg-black z-50">{children}</div>
}
