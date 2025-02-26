"use client";
import {
    HiOutlineHome,
    HiOutlineFolder,
    HiOutlineCog,
} from "react-icons/hi";
import { HiOutlineServerStack } from "react-icons/hi2";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function Sidebar({ page }: { page: { page: string } }) {
    const router = useRouter();
    const [isCollapsed, setIsCollapsed] = useState(true);

    useEffect(() => {
        const handleResize = () => {
            setIsCollapsed(window.innerWidth < 768);
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const frameUpdate = (route: string) => {
        router.push("/" + route);
    };

    const navItems = [
        { route: "Home", icon: HiOutlineHome, label: "Home", path: "home" }
    ];

    const getIconClassName = (route: string) => {
        return route === page.page
            ? "text-purple-200 w-6 h-6 transition-all duration-300 group-hover:text-white"
            : "text-gray-400 w-6 h-6 transition-all duration-300 group-hover:text-white";
    };

    const getItemClassName = (route: string) => {
        return route === page.page
            ? "p-3 bg-[#2a1e36] rounded-lg shadow-md shadow-purple-900/10 transition-all duration-300 w-full flex items-center group hover:bg-[#32234a]"
            : "p-3 rounded-xl transition-all duration-300 w-full flex items-center group hover:bg-[#1a1225]";
    };

    const getLabelClass = (route: string) => {
        return route === page.page
            ? "ml-3 text-white text-sm font-medium transition-all duration-300"
            : "ml-3 text-gray-400 text-sm transition-all duration-300 group-hover:text-gray-300";
    };

    return (
        <div className="h-screen">
            <aside className={`${isCollapsed ? 'w-20' : 'w-56'} bg-gradient-to-b from-[#0E0316] to-[#110418] p-4 h-full flex flex-col shadow-xl transition-all duration-300 relative`}>
                <div className="mb-6 flex justify-center">
                    <Image
                        src="/Solarislogo.png"
                        alt="Solaris Icon"
                        width={isCollapsed ? 60 : 90}
                        height={isCollapsed ? 60 : 90}
                        className="filter drop-shadow-[0_0_15px_#ea66c9] transition-all duration-300"
                    />
                </div>

                <nav className="flex-grow flex flex-col items-start space-y-3">
                    {navItems.map((item) => (
                        <div key={item.route} className={getItemClassName(item.route)}>
                            <button
                                className="flex items-center w-full"
                                onClick={() => frameUpdate(item.path)}
                            >
                                <item.icon className={getIconClassName(item.route)} />
                                <span className={`${getLabelClass(item.route)} ${isCollapsed ? 'hidden' : 'block'}`}>
                                    {item.label}
                                </span>
                            </button>
                        </div>
                    ))}
                    <div className="flex-grow"></div>
                    <div className={getItemClassName("Settings")}>
                        <button
                            className="flex items-center w-full"
                            onClick={() => frameUpdate("settings")}
                        >
                            <HiOutlineCog className={getIconClassName("Settings")} />
                            <span className={`${getLabelClass("Settings")} ${isCollapsed ? 'hidden' : 'block'}`}>
                                Settings
                            </span>
                        </button>
                    </div>
                </nav>

                <div className="mt-2 flex justify-center">
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
                            className={`text-purple-200 transition-all duration-300 ${isCollapsed ? 'rotate-0' : 'rotate-180'}`}
                        >
                            <polyline points="15 18 9 12 15 6"></polyline>
                        </svg>
                        {!isCollapsed && (
                            <span className="text-purple-200 text-xs pr-1">Collapse</span>
                        )}
                    </button>
                </div>
            </aside>
        </div>
    );
}