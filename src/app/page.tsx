"use client"

import { endpoints } from "@/api/config/endpoints";
import { CheckCircle, Loader2, LogIn } from 'lucide-react';
import { open } from "@tauri-apps/plugin-shell";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useInit } from "@/api/authentication/init";
import useAuth from "@/api/authentication/zustand/state";
import { motion, AnimatePresence } from "framer-motion";
import Particles from "@/components/login/particles";

export default function Login() {
  useInit();
  const auth = useAuth();
  const router = useRouter();
  const [isConnected, setIsConnected] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const openDiscordURI = async () => {
    await open(endpoints.GET_DISCORD_URI);
  };

  useEffect(() => {
    const handleHashChange = async () => {
      const code = window.location.hash.slice(1);
      const login = await auth.login(code);

      if (login) {
        setIsConnected(true);
        setTimeout(() => {
          router.push("/home");
        }, 2000);
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    window.addEventListener("hashchange", handleHashChange);
    window.addEventListener("contextmenu", handleContextMenu);

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
      window.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [router]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 2300);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Particles className="absolute inset-0" quantity={250} />
      <div className="relative h-96 w-96 flex items-center justify-center">
        {/* <div
          className="absolute h-[300px] w-[350px] rounded-[60%_40%_50%_50%/50%_50%_60%_40%]
          bg-gradient-to-br from-purple-900/45 via-fuchsia-900/45 to-pink-900/45
          blur-md transform-style-3d transform rotate-x-20 rotate-y-20 rotate-z-20
          shadow-[0_0_50px_rgba(128,0,128,0.5),0_0_100px_rgba(128,0,128,0.3),0_0_150px_rgba(128,0,128,0.2)]
          animate-orbit"
        /> */}
        <div className="absolute z-10 w-96 p-8 mt-5 h-auto rounded-xl bg-white/5 backdrop-blur-lg border border-white/20 shadow-lg flex flex-col items-center justify-center">
          <div className="flex justify-center mb-2">
            <img
              src="./SolarisLogo.png"
              alt="Solaris Logo"
              className="h-20 w-auto object-contain"
            />
          </div>
          {/* <h2 className="text-transparent bg-clip-text bg-gradient-to-r from-purple-700 via-purple-400 to-blue-700 text-center text-2xl font-semibold mb-5">Solaris</h2> */}
          <motion.button
            className="w-full py-2.5 px-4 rounded-lg bg-blue-600/80 hover:bg-blue-700/80 backdrop-blur-sm text-white font-medium flex items-center justify-center gap-2 transition-colors duration-300 border border-blue-500/30 shadow-md" onClick={openDiscordURI}
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
        </div>
      </div>
    </div>
  );
}