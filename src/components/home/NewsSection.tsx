"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ExternalLink } from "lucide-react"
import { useRouter } from "next/navigation"
import { open } from "@tauri-apps/plugin-shell"
import useAuth from "@/api/authentication/zustand/state"
import type { Banner, NewsResponse } from "@/api/main/interfaces/news"
import { generateNewsResponse } from "@/api/main/requests/banners"

interface NewsSectionProps {
    className?: string
    autoRotate?: boolean
    interval?: number
}

export default function NewsSection({ className = "", autoRotate = true, interval = 7000 }: NewsSectionProps) {
    const [news, setNews] = useState<NewsResponse | null>(null)
    const [currentIndex, setCurrentIndex] = useState(0)
    const router = useRouter()
    const intervalRef = useRef<NodeJS.Timeout | null>(null)
    const auth = useAuth()

    useEffect(() => {
        const getNewsData = async () => {
            try {
                const result = await generateNewsResponse()
                setNews(result.data)
            } catch (error) {
                console.error(`Error getting news data: ${error}`)
            }
        }

        getNewsData()
    }, [])

    useEffect(() => {
        if (!news?.banners || news.banners.length <= 1 || !autoRotate) return

        const resetInterval = () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
            }
            intervalRef.current = setInterval(() => {
                setCurrentIndex((prevIndex) => (prevIndex + 1) % news.banners.length)
            }, interval)
        }

        resetInterval()

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
            }
        }
    }, [news, currentIndex, autoRotate, interval])

    const handleCtaClick = (banner: Banner) => {
        if (banner.cta.type === "lootlabs" && banner.cta.url) {
            open(
                banner.cta.url +
                `&r=${Buffer.from(`https://avalon-external-api.solarisfn.org/s/api/lootlabs/callback/${auth.user?.discordId}`).toString("base64")}`,
            )
            return
        }

        if (banner.cta.type === "external" && banner.cta.url) {
            open(banner.cta.url)
            return
        }

        if (banner.cta.type === "internal") {
            router.push(banner.cta.url || "/library")
        }
    }

    if (!news?.banners || news.banners.length === 0) {
        return null
    }

    const currentBanner = news.banners[currentIndex]

    return (
        <div
            className={`w-full ${className}`}
        >
            <div className="relative h-[260px] overflow-hidden rounded-lg shadow-lg">
                <AnimatePresence initial={false} mode="wait">
                    <motion.div
                        key={currentBanner.id}
                        className="relative h-full"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                    >
                        <div className="absolute inset-0">
                            {currentBanner.background.type === "video" ? (
                                <video
                                    src={currentBanner.background.url}
                                    className="w-full h-full object-cover"
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                />
                            ) : (
                                <img
                                    src={currentBanner.background.url || "/placeholder.svg"}
                                    alt=""
                                    className="w-full h-full object-cover"
                                />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                        </div>

                        <div className="absolute bottom-0 left-0 w-full overflow-hidden pb-4 pl-5">
                            <div className="bg-black/60 backdrop-blur-sm px-4 py-2 shadow-lg rounded-md max-w-md">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1 pr-6">
                                        <motion.h2
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.2 }}
                                            className="text-md font-bold text-white tracking-tight mb-0.5"
                                        >
                                            {currentBanner.title}
                                        </motion.h2>
                                        {currentBanner.description && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.3 }}
                                                className="text-[11.5px] leading-relaxed text-gray-200/90 font-medium"
                                                dangerouslySetInnerHTML={{ __html: currentBanner.description }}
                                            />
                                        )}
                                    </div>
                                    <motion.div
                                        className="shrink-0"
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.4 }}
                                    >
                                        <button
                                            onClick={() => handleCtaClick(currentBanner)}
                                            className="px-3 py-1.5 bg-white hover:bg-gray-100 text-[#1a2e3a] rounded-lg font-semibold text-sm transition-all flex items-center gap-2 shadow-md hover:shadow-lg"
                                        >
                                            {currentBanner.cta.text}
                                            {(currentBanner.cta.type === "external" || currentBanner.cta.type === "lootlabs") && (
                                                <ExternalLink className="w-4 h-4" />
                                            )}
                                        </button>
                                    </motion.div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>

                {news.banners.length > 1 && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20 overflow-hidden z-10">
                        <motion.div
                            className="h-full bg-white"
                            initial={{ width: "0%" }}
                            animate={{ width: "100%" }}
                            key={currentIndex}
                            transition={{
                                duration: interval / 1000,
                                ease: "linear",
                            }}
                        />
                    </div>
                )}
            </div>
        </div>
    )
}

