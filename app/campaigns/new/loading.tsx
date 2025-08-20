export default function Loading() {
  return (
    <div className="h-full bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
        <p className="text-gray-400">Loading campaign...</p>
      </div>
    </div>
  )
}
