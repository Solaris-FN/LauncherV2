"use client";

import Sidebar from "@/components/core/SideBar";
import { motion } from "framer-motion";

export default function Leaderboard() {
    return (
        <div className="flex min-h-screen">
            <Sidebar page={{ page: "Leaderboard" }} />
            <motion.main
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="flex-1 flex flex-col mt-3">
                <div className="flex justify-between items-start p-6">
                </div>
            </motion.main>
        </div>
    );
}