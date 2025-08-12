"use client"
import { useState, useEffect } from "react"
import type React from "react"

import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import type { User } from "@supabase/supabase-js"
import { Upload, Search, Filter, X, AlertTriangle, ExternalLink } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Mock media data with approval status
const mockMedia = [
  {
    id: 1,
    name: "Summer Sale Banner",
    type: "image",
    format: "PNG",
    size: "2.4 MB",
    uploadDate: "2024-07-15",
    status: "approved",
    thumbnail: "/placeholder.svg?height=120&width=120&text=Summer+Sale",
  },
  {
    id: 2,
    name: "Brand Logo",
    type: "image",
    format: "JPG",
    size: "890 KB",
    uploadDate: "2024-07-10",
    status: "pending",
    thumbnail: "/placeholder.svg?height=120&width=120&text=Brand+Logo",
  },
  {
    id: 3,
    name: "Product Video",
    type: "video",
    format: "MP4",
    size: "15.2 MB",
    uploadDate: "2024-07-05",
    status: "rejected",
    thumbnail: "/placeholder.svg?height=120&width=120&text=Product+Video",
  },
  {
    id: 4,
    name: "Holiday Background",
    type: "image",
    format: "PNG",
    size: "3.1 MB",
    uploadDate: "2024-06-30",
    status: "approved",
    thumbnail: "/placeholder.svg?height=120&width=120&text=Holiday+BG",
  },
]

const getStatusColor = (status: string) => {
  switch (status) {
    case "approved":
      return "bg-green-500/10 text-green-500 border-green-500/20"
    case "pending":
      return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
    case "rejected":
      return "bg-red-500/10 text-red-500 border-red-500/20"
    default:
      return "bg-gray-500/10 text-gray-500 border-gray-500/20"
  }
}

export default function GalleryPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [sortBy, setSortBy] = useState("lastEdited")
  const [filterType, setFilterType] = useState("all")
  const [showApprovedOnly, setShowApprovedOnly] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      if (!supabase) {
        setLoading(false)
        return
      }

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          router.push("/auth")
          return
        }

        setUser(user)
      } catch (error) {
        console.error("Error checking auth:", error)
        router.push("/auth")
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  const filteredMedia = mockMedia.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === "all" || item.type === filterType
    const matchesApproval = !showApprovedOnly || item.status === "approved"
    return matchesSearch && matchesType && matchesApproval
  })

  const totalSize = mockMedia.reduce((acc, item) => {
    const size = Number.parseFloat(item.size.split(" ")[0])
    const unit = item.size.split(" ")[1]
    return acc + (unit === "MB" ? size : size / 1024)
  }, 0)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      // Handle file upload here
      console.log("Files dropped:", e.dataTransfer.files)
    }
  }

  return (
    <div className="flex-1 space-y-6 p-6 bg-background">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Your Gallery</h1>
          <p className="text-muted-foreground mt-1">See all of the artworks you've uploaded here.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm text-muted-foreground">{Math.round((totalSize / 512) * 100)}% of 0.5 GB Used.</div>
            <div className="text-xs text-muted-foreground">Click this button to upload artworks.</div>
          </div>
          <Button
            onClick={() => setShowUploadModal(true)}
            className="bg-green-600 hover:bg-green-700 rounded-full h-12 w-12 p-0"
          >
            <Upload className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search artworks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-muted/50"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortBy(sortBy === "lastEdited" ? "name" : "lastEdited")}
          >
            <Filter className="h-4 w-4 mr-2" />
            SIZE
          </Button>
          <Button variant="outline" size="sm" onClick={() => setFilterType(filterType === "all" ? "image" : "all")}>
            FILE TYPE
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowApprovedOnly(!showApprovedOnly)}
            className={showApprovedOnly ? "bg-green-500/10 text-green-500" : ""}
          >
            APPROVED ONLY
          </Button>
        </div>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="lastEdited">Last Edited</SelectItem>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="size">Size</SelectItem>
            <SelectItem value="date">Upload Date</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Media Count */}
      <div className="text-muted-foreground">
        Showing <span className="text-foreground font-medium">{filteredMedia.length}</span> of{" "}
        <span className="text-foreground font-medium">{mockMedia.length}</span> artworks.
      </div>

      {/* Instructions */}
      <div className="text-sm text-muted-foreground">
        Click <span className="text-foreground font-medium">the files</span> to inspect or delete 'em.
        <br />
        <span className="text-xs">
          Psst... hold <span className="text-foreground font-medium">shift</span> to multi-select.
        </span>
      </div>

      {/* Media Grid */}
      {filteredMedia.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredMedia.map((item) => (
            <div
              key={item.id}
              className="bg-muted/30 rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer group"
            >
              <div className="aspect-square bg-muted rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                <img
                  src={item.thumbnail || "/placeholder.svg"}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="space-y-2">
                <h3 className="font-medium text-sm truncate">{item.name}</h3>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{item.format}</span>
                  <span>{item.size}</span>
                </div>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className={getStatusColor(item.status)}>
                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(item.uploadDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">No artworks found.</div>
          <Button onClick={() => setShowUploadModal(true)} className="bg-green-600 hover:bg-green-700">
            <Upload className="h-4 w-4 mr-2" />
            Upload Your First Artwork
          </Button>
        </div>
      )}

      {/* Upload Modal */}
      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
        <DialogContent className="max-w-2xl bg-slate-800 border-slate-700">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl font-bold text-white">Upload artworks here.</DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowUploadModal(false)}
                className="text-white hover:bg-slate-700 rounded-full h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          <div className="space-y-6">
            {/* Specifications */}
            <div className="grid grid-cols-3 gap-6 text-sm">
              <div>
                <div className="text-slate-400 uppercase text-xs mb-2">Screen Dimensions</div>
                <div className="text-white font-medium">Any Size</div>
              </div>
              <div>
                <div className="text-slate-400 uppercase text-xs mb-2">Accepted Formats</div>
                <div className="text-white">
                  <div>Static - jpeg, png</div>
                  <div>Video - mp4</div>
                </div>
              </div>
              <div>
                <div className="text-slate-400 uppercase text-xs mb-2">Audio Support</div>
                <div className="text-white">Not set - assume no audio support</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 text-sm">
              <div>
                <div className="text-slate-400 uppercase text-xs mb-2">Ad Duration</div>
                <div className="text-white font-medium">Any duration.</div>
              </div>
              <div>
                <div className="text-slate-400 uppercase text-xs mb-2">File Size Limit</div>
                <div className="text-white font-medium">7340 kB</div>
              </div>
            </div>

            {/* Warning */}
            <Alert className="bg-yellow-500/10 border-yellow-500/20">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <AlertDescription className="text-yellow-200">
                <strong>FYI</strong> - Artworks uploaded directly to the gallery here{" "}
                <strong>will not be approved</strong> until they're in a campaign.
                <br />
                <br />
                When you're uploading an artwork into the gallery, it's not targeting any boards. So, I have no idea
                which publisher I need to send it to for approval. In other words - you'll get pre-approval on these
                artworks but they won't be sent for final approval from the publisher until they're added to a campaign.
                <br />
                <br />
                <Button variant="link" className="text-yellow-400 p-0 h-auto font-normal">
                  YOUR CAMPAIGNS <ExternalLink className="h-3 w-3 ml-1" />
                </Button>
              </AlertDescription>
            </Alert>

            {/* Drop Zone */}
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive ? "border-green-500 bg-green-500/10" : "border-slate-600 hover:border-slate-500"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="text-slate-400 mb-2">Just drag 'n drop your file here.</div>
              <div className="text-slate-500 text-sm mb-4">
                Upload up to 5 files by clicking (or dragging) here.
                <br />
                Max. File Size: 7 MB
              </div>
              <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent">
                Choose Files
              </Button>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowUploadModal(false)}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                CLOSE
              </Button>
              <Button className="bg-green-600 hover:bg-green-700">SAVE & CLOSE</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
