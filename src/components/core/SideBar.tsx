"use client"
import { HiOutlineHome, HiOutlineCog, HiOutlineFolder, HiOutlineDownload, HiOutlineShoppingCart } from "react-icons/hi"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useEffect, useState } from "react"

export default function Sidebar({ page }: { page: { page: string } }) {
    const router = useRouter()
    const [isCollapsed, setIsCollapsed] = useState(true)

    useEffect(() => {
        const handleResize = () => {
            setIsCollapsed(window.innerWidth < 768)
        }
        handleResize()
        window.addEventListener("resize", handleResize)
        return () => window.removeEventListener("resize", handleResize)
    }, [])

    const frameUpdate = (route: string) => {
        router.push("/" + route)
    }

    const navItems = [
        { route: "Home", icon: HiOutlineHome, label: "Home", path: "home" },
        { route: "Library", icon: HiOutlineFolder, label: "Library", path: "library" },
        { route: "Download", icon: HiOutlineDownload, label: "Download", path: "downloads" },
        { route: "Item Shop", icon: HiOutlineShoppingCart, label: "Item Shop", path: "storefront" },
    ]

    const getIconClassName = (route: string) => {
        return route === page.page
            ? "text-purple-200 w-6 h-6 transition-all duration-300 group-hover:text-white"
            : "text-gray-400 w-6 h-6 transition-all duration-300 group-hover:text-white"
    }

    const getItemClassName = (route: string) => {
        return `${route === page.page
            ? "bg-[#2a1e36]/70 shadow-md shadow-purple-900/10 hover:bg-[#32234a]"
            : "hover:bg-[#1a1225]/60"
            } p-2.5 rounded-lg transition-all duration-300 w-full flex items-center group`
    }

    const getLabelClass = (route: string) => {
        return route === page.page
            ? "ml-3 text-white text-sm font-medium transition-all duration-300"
            : "ml-3 text-gray-400 text-sm transition-all duration-300 group-hover:text-gray-300"
    }

    return (
        <div className="h-screen">
            <aside className={`${isCollapsed ? "w-20" : "w-56"} bg-gradient-to-b from-[#0E0316] to-[#110418] h-full shadow-xl transition-all duration-300 relative flex flex-col px-3 py-4`}>
                <div className="flex justify-center mb-12">
                    <Image
                        src="/Solarislogo.png"
                        alt="Solaris Icon"
                        width={isCollapsed ? 50 : 70}
                        height={isCollapsed ? 50 : 70}
                        className="filter drop-shadow-[0_0_15px_#ea66c9] transition-all duration-300"
                    />
                </div>

                <nav className={`flex flex-col gap-1.5 w-full transition-all duration-300 ${isCollapsed ? "mt-[16vh]" : "mt-1"
                    }`}>
                    {navItems.map((item) => (
                        <div key={item.route} className={getItemClassName(item.route)}>
                            <button
                                className="flex items-center w-full ml-1.5"
                                onClick={() => frameUpdate(item.path)}
                            >
                                <item.icon className={getIconClassName(item.route)} />
                                <span className={`${getLabelClass(item.route)} ${isCollapsed ? "hidden" : "block"}`}>
                                    {item.label}
                                </span>
                            </button>
                        </div>
                    ))}
                </nav>

                <div className="mt-auto space-y-3">
                    <div className={getItemClassName("Settings")}>
                        <button
                            className="flex items-center w-full ml-1.5"
                            onClick={() => frameUpdate("settings")}
                        >
                            <HiOutlineCog className={getIconClassName("Settings")} />
                            <span className={`${getLabelClass("Settings")} ${isCollapsed ? "hidden" : "block"}`}>
                                Settings
                            </span>
                        </button>
                    </div>

                    <div className="flex justify-center">
                        <button
                            onClick={() => setIsCollapsed(!isCollapsed)}
                            className="bg-[#2a1e36] p-1.5 rounded-full shadow-md hover:bg-purple-800 transition-all flex items-center space-x-1"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className={`text-purple-200 transition-all duration-300 ${isCollapsed ? "rotate-0" : "rotate-180"}`}
                            >
                                <polyline points="15 18 9 12 15 6"></polyline>
                            </svg>
                            {!isCollapsed && <span className="text-purple-200 text-xs pr-1">Collapse</span>}
                        </button>
                    </div>
                </div>
            </aside>
        </div>
    )
}
