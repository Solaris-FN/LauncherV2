"use client"

import { endpoints } from "@/api/config/endpoints"
import { CheckCircle, Loader2, LogIn, Download, RefreshCcw, AlertCircle } from 'lucide-react'
import { open } from "@tauri-apps/plugin-shell"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useInit } from "@/api/authentication/init"
import useAuth from "@/api/authentication/zustand/state"
import { motion, AnimatePresence } from "framer-motion"
import Particles from "@/components/login/particles"
import { check } from "@tauri-apps/plugin-updater"
import { relaunch } from "@tauri-apps/plugin-process"
import { Progress } from "@/components/ui/progress"

export default function Login() {
  useInit()
  const auth = useAuth()
  const router = useRouter()
  const [isConnected, setIsConnected] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [updateStatus, setUpdateStatus] = useState("checking")
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [updateDetails, setUpdateDetails] = useState({ version: "", notes: "" })

  const openDiscordURI = async () => {
    await open(endpoints.GET_DISCORD_URI)
  }

  useEffect(() => {
    const handleHashChange = async () => {
      const code = window.location.hash.slice(1)
      const login = await auth.login(code)

      if (login) {
        setIsConnected(true)
        setTimeout(() => {
          router.push("/home")
        }, 2000)
      }
    }

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()
    }

    window.addEventListener("hashchange", handleHashChange)
    window.addEventListener("contextmenu", handleContextMenu)

    return () => {
      window.removeEventListener("hashchange", handleHashChange)
      window.removeEventListener("contextmenu", handleContextMenu)
    }
  }, [router])

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true)
    }, 2300)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const checkForUpdates = async () => {
      try {
        const update = await check()

        if (update) {
          setUpdateStatus("downloading")
          setUpdateDetails({
            version: update.version,
            notes: update.body ?? ""
          })
          console.log(`found update ${update.version} from ${update.date} with notes ${update.body}`)

          let downloaded = 0
          let contentLength = 0

          await update.downloadAndInstall(async (event) => {
            switch (event.event) {
              case "Started":
                contentLength = event.data.contentLength ?? 0
                console.log(`started downloading ${event.data.contentLength} bytes`)
                break
              case "Progress":
                downloaded += event.data.chunkLength
                const progress = (downloaded / contentLength) * 100
                setDownloadProgress(progress)
                console.log(`downloaded ${downloaded} from ${contentLength}`)
                break
              case "Finished":
                console.log("download finished")
                setUpdateStatus("restarting")
                await relaunch()
                break
            }
          })
        } else {
          setUpdateStatus("up-to-date")
        }
      } catch (error) {
        console.error(error)
        setUpdateStatus("error")
      }
    }

    checkForUpdates()
  }, [])

  const renderUpdateStatus = () => {
    return (
      <AnimatePresence mode="wait">
        {updateStatus === "checking" && (
          <motion.div
            key="checking"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="w-full mt-6 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 p-4 shadow-lg"
          >
            <div className="flex items-center gap-3">
              <div className="bg-blue-500/20 p-2 rounded-full">
                <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-white">Checking for updates</h3>
                <p className="text-xs text-white/60">Please wait while we check for the latest version</p>
              </div>
            </div>
          </motion.div>
        )}

        {updateStatus === "downloading" && (
          <motion.div
            key="downloading"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="w-full mt-6 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 p-4 shadow-lg"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-yellow-500/20 p-2 rounded-full">
                <Download className="h-5 w-5 text-yellow-400" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-white">Downloading update {updateDetails.version}</h3>
                <p className="text-xs text-white/60">{updateDetails.notes}</p>
              </div>
            </div>
            <div className="space-y-2">
              <Progress value={downloadProgress} className="h-2 bg-white/10" indicatorClassName="bg-gradient-to-r from-yellow-500 to-amber-400" />
              <p className="text-xs text-right text-white/60">{downloadProgress.toFixed(1)}% complete</p>
            </div>
          </motion.div>
        )}

        {updateStatus === "restarting" && (
          <motion.div
            key="restarting"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="w-full mt-6 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 p-4 shadow-lg"
          >
            <div className="flex items-center gap-3">
              <div className="bg-green-500/20 p-2 rounded-full">
                <RefreshCcw className="h-5 w-5 animate-spin text-green-400" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-white">Restarting application</h3>
                <p className="text-xs text-white/60">Update installed successfully</p>
              </div>
            </div>
          </motion.div>
        )}

        {updateStatus === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="w-full mt-6 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 p-4 shadow-lg"
          >
            <div className="flex items-center gap-3">
              <div className="bg-red-500/20 p-2 rounded-full">
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-white">Update check failed</h3>
                <p className="text-xs text-white/60">Please try again later</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Particles className="absolute inset-0" quantity={250} />
      <div className="relative h-auto w-96 flex items-center justify-center">
        <div className="absolute z-10 w-96 p-8 mt-5 h-auto rounded-xl bg-white/5 backdrop-blur-lg border border-white/20 shadow-lg flex flex-col items-center justify-center">
          <div className="flex justify-center mb-2">
            <img src="./Solarislogo.png" alt="Solaris Logo" className="h-20 w-auto object-contain" />
          </div>
          <motion.button
            className="w-full py-2.5 px-4 rounded-lg bg-blue-600/80 hover:bg-blue-700/80 backdrop-blur-sm text-white font-medium flex items-center justify-center gap-2 transition-colors duration-300 border border-blue-500/30 shadow-md"
            onClick={openDiscordURI}
            disabled={!isReady || isConnected}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <AnimatePresence mode="wait">
              {!isReady ? (
                <motion.div
                  key="verifying"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center"
                >
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Verifying
                </motion.div>
              ) : isConnected ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center"
                >
                  Connected
                  <CheckCircle className="ml-2 h-5 w-5" />
                </motion.div>
              ) : (
                <motion.div
                  key="connect"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center"
                >
                  <LogIn className="mr-2 h-5 w-5" />
                  Connect with Discord
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>

          {renderUpdateStatus()}
        </div>
      </div>
    </div>
  )
}
