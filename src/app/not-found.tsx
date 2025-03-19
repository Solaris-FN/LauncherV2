import Sidebar from '@/components/core/SideBar'

export default async function NotFound() {
    return (
        <div className="flex min-h-screen">
            <Sidebar page={{ page: "Home" }} />
            <div className="flex-1 flex flex-col items-center justify-center">
                <div className="w-96 p-8 h-auto rounded-xl bg-white/5 backdrop-blur-lg border border-white/20 shadow-lg flex flex-col items-center justify-center">
                    <div className="flex justify-center mb-2">
                        <img
                            src="./SolarisLogo.png"
                            alt="Solaris Logo"
                            className="h-20 w-auto object-contain"
                        />
                    </div>
                    <h1 className="text-xl font-md text-white mb-4">Page Not Found</h1>
                    <p className="text-md text-gray-300">Sorry, this page does not exist.</p>
                </div>
            </div>
        </div>
    )
}