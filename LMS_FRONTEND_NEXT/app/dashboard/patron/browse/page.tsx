"use client"

import DashboardLayout from "@/app/components/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Search, Filter, Star, Heart, Eye } from "lucide-react"
import { useState, useMemo } from "react"
import { useLibraryItems } from "@/hooks/use-library-items"
import { useToast } from "@/hooks/use-toast"
import { reserveItem } from "@/lib/api"
import Link from "next/link"

export default function BrowseBooksPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState("All")
  const [reservingItems, setReservingItems] = useState<Set<string>>(new Set())
  const { items, isLoading } = useLibraryItems({
    search: searchQuery,
    category: activeCategory !== "All" ? activeCategory : undefined,
  })
  const { toast } = useToast()

  const { items: allItems } = useLibraryItems()
  const categories = useMemo(() => {
    if (!allItems?.length) return ['All']
    const uniqueCategories = [...new Set(allItems.map(item => item.category))]
    return ['All', ...uniqueCategories]
  }, [allItems])

  return (
    <DashboardLayout userRole="patron" userName="Patron">
      <div className="space-y-4 sm:space-y-6 mobile-content-wrapper">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Browse Books</h1>
            <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">Discover and reserve items from our collection</p>
          </div>
        </div>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by title, author, ISBN..."
                  className="pl-10 w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline" className="w-full sm:w-auto">
                <Filter className="h-4 w-4 mr-2" />
                Advanced Filters
              </Button>
            </div>

            <div className="flex flex-wrap gap-2 mt-4 overflow-x-auto pb-2">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={category === activeCategory ? "default" : "outline"}
                  size="sm"
                  className={`whitespace-nowrap ${category === activeCategory ? "bg-blue-600 hover:bg-blue-700" : ""}`}
                  onClick={() => setActiveCategory(category || "All")}
                >
                  {category}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {Array.isArray(items) && items.map((item) => {
            const unavailable = (item.status || "").toUpperCase() === "BORROWED" || (item.loans?.length ?? 0) > 0
            return (
              <Card key={item.id} className="hover:shadow-lg transition-shadow group">
                <CardContent className="p-3 sm:p-4">
                  <div className="relative mb-3 sm:mb-4">
                    <img
                      src={"/placeholder.svg?height=200&width=150&query=book-cover"}
                      alt={item.title}
                      className="w-full h-40 sm:h-48 object-cover rounded-lg"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 hover:bg-white"
                    >
                      <Heart className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-semibold text-gray-900 line-clamp-2 text-sm sm:text-base">{item.title}</h3>
                    <p className="text-xs sm:text-sm text-gray-600 line-clamp-1">{item.author ? `by ${item.author}` : ""}</p>

                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1">
                        <Star className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-400" />
                        <span className="text-xs sm:text-sm text-gray-600">—</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {item.category || "General"}
                      </Badge>
                    </div>

                    <p className="text-xs text-gray-600 line-clamp-2 hidden sm:block">{item.description || "No description."}</p>

                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 pt-2">
                      <Button
                        size="sm"
                        className="flex-1 text-xs sm:text-sm"
                        disabled={unavailable || reservingItems.has(item.id)}
                        onClick={async () => {
                          try {
                            setReservingItems(prev => new Set(prev).add(item.id))
                            await reserveItem({ libraryItemId: item.id })
                            toast({ title: "Reserved", description: "We'll notify you when it's available." })
                          } catch (e: any) {
                            toast({
                              title: "Reservation failed",
                              description: String(e?.message || e),
                              variant: "destructive",
                            })
                          } finally {
                            setReservingItems(prev => {
                              const newSet = new Set(prev)
                              newSet.delete(item.id)
                              return newSet
                            })
                          }
                        }}
                      >
                        <BookOpen className="h-3 w-3 mr-1" />
                        <span className="hidden sm:inline">
                          {reservingItems.has(item.id) ? "Reserving..." : unavailable ? "Unavailable" : "Reserve"}
                        </span>
                        <span className="sm:hidden">
                          {reservingItems.has(item.id) ? "..." : unavailable ? "N/A" : "Reserve"}
                        </span>
                      </Button>
                      <Button size="sm" variant="outline" asChild className="text-xs sm:text-sm">
                        <Link href={`/dashboard/patron/book/${item.id}`}>
                          <Eye className="h-3 w-3 mr-1" />
                          <span className="hidden sm:inline">View Details</span>
                          <span className="sm:hidden">View</span>
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
          {!isLoading && (!Array.isArray(items) || items.length === 0) && (
            <div className="col-span-full text-center text-gray-500 py-8 px-4">
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-sm sm:text-base">No items found</p>
              <p className="text-xs sm:text-sm text-gray-400 mt-2">Try adjusting your search or filters</p>
            </div>
          )}
        </div>

        <div className="text-center pb-4 sm:pb-0">
          <Button variant="outline" size="default" className="w-full sm:w-auto">
            Load More
          </Button>
        </div>
      </div>
    </DashboardLayout>
  )
}
