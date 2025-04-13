"use client"

import { useState } from "react"
import { User, Info, LogOut, Loader2, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRouter } from "next/navigation"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Frame from "@/components/core/Frame"
import { Tauri } from "@/api/config/tauri"
import useBuilds from "@/modules/zustand/library/useBuilds"
import useAuth from "@/api/authentication/zustand/state"
import Sidebar from "@/components/core/SideBar"
import { generateEditDisplayResponse } from "@/api/authentication/requests/edit_displayname"

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}

const Switch: React.FC<SwitchProps> = ({ checked, onChange, label }) => {
  return (
    <div className="flex items-center justify-between">
      {label && <span className="text-gray-400">{label}</span>}
      <div
        className={`relative inline-block w-12 h-6 rounded-full cursor-pointer transition-colors duration-200 ease-in-out ${checked ? 'bg-purple-600' : 'bg-gray-600'
          }`}
        onClick={() => onChange(!checked)}
      >
        <span
          className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ease-in-out ${checked ? 'transform translate-x-6' : ''
            }`}
        />
      </div>
    </div>
  );
};

export default function Settings() {
  const router = useRouter()
  const auth = useAuth()
  const buildState = useBuilds()
  const [isLoading, setIsLoading] = useState(true)
  const [newUsername, setNewUsername] = useState(auth.user?.displayName || "")
  const [editOnRelease, setEditOnRelease] = useState(buildState.EorEnabled)
  const [filecheck, setFileCheck] = useState(buildState.FileCheck)
  const [disablePreEdit, setDisablePreEdit] = useState(buildState.DisablePreEdits)
  const [bubbleBuilds, setBubbleBuilds] = useState(buildState.BubbleBuilds)
  const settingsTabs = [
    { name: "General", icon: User },
    { name: "About", icon: Info },
  ]

  const handleLogout = () => {
    console.log("Logging out...")
    auth.logout()
    router.push("/")
  }

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewUsername(e.target.value)
  }

  const handleUsernameSubmit = async () => {
    if (auth.user) {
      const newUserCheck = await generateEditDisplayResponse(auth.token, newUsername);
      if (newUserCheck.data == true) {
        auth.setUser({
          ...auth.user,
          displayName: newUsername,
        });
      }
    }
  }

  const handleEditOnReleaseChange = (checked: boolean) => {
    buildState.setEorEnabled(checked)
    setEditOnRelease(checked)
  }

  const handleBubbleBuildsChange = (checked: boolean) => {
    buildState.setBubbleBuilds(checked)
    setBubbleBuilds(checked)
  }

  const handleDisableFileCheckChanged = (checked: boolean) => {
    buildState.setFileCheck(checked)
    setFileCheck(checked)
  }

  const handleDisablePreEditChange = (checked: boolean) => {
    buildState.setDisablePreEdits(checked)
    setDisablePreEdit(checked)
  }

  if (isLoading) {
    setIsLoading(false)
    return (
      <div className="flex h-screen items-center justify-center bg-[#202020]">
        <Loader2 className="h-12 w-12 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="flex h-screen text-gray-400">
      <Sidebar page={{ page: "Settings" }} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto p-6">
          <Tabs defaultValue="General" className="space-y-6">
            <TabsList className="bg-transparent">
              {settingsTabs.map((tab) => (
                <TabsTrigger
                  key={tab.name}
                  value={tab.name}
                  className="text-gray-400 data-[state=active]:bg-transparent data-[state=active]:border-b-[3.5px] data-[state=active]:border-purple-800"
                >
                  <tab.icon className="h-5 w-5 mr-2 text-gray-400" />
                  <span className="text-gray-400">{tab.name}</span>
                </TabsTrigger>
              ))}
            </TabsList>
            <TabsContent value="General">
              <div className="space-y-6">
                <Card className="bg-[#2a1e36]/40 shadow-lg backdrop-blur-sm border border-[#3d2a4f]/50 text-gray-400">
                  <CardHeader>
                    <CardTitle className="text-gray-400 text-xl">Account</CardTitle>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <img
                        src={auth.user?.profilePicture || "/placeholder.svg"}
                        alt="Profile picture"
                        className="w-12 h-12 rounded-full bg-gray-700 text-gray-400 flex items-center justify-center text-xl font-bold"
                      />
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="text-gray-400 font-semibold">{auth.user?.displayName}</h3>
                          {Array.isArray(auth.user?.roles) &&
                            auth.user.roles.some(role =>
                              [
                                "1348073375108436028",
                                "1327061056941592657",
                                "1348073609687601273",
                                "1348073577953624124",
                                "1348073653564084338",
                                "1356408914144399421",
                                "1326903293275934841",
                                "1326906818366013451",
                                "1349804908064407704",
                                "1326902806992523356"
                              ].includes(role)
                            ) && (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <Pencil className="h-4 w-4 text-gray-400" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="bg-[#141414] text-gray-400 border-b-1 border-[#2c2d32]">
                                  <DialogHeader>
                                    <DialogTitle className="text-gray-400">Edit Username</DialogTitle>
                                    <DialogDescription className="text-gray-400">
                                      Enter your new username below.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-4 items-center gap-4">
                                      <Label htmlFor="name" className="text-right text-gray-400">
                                        Username
                                      </Label>
                                      <Input
                                        id="name"
                                        value={newUsername}
                                        onChange={handleUsernameChange}
                                        className="col-span-3 bg-[#0a0a0a] text-gray-400 border-[#2c2d32]"
                                      />
                                    </div>
                                  </div>
                                  <DialogFooter>
                                    <Button
                                      onClick={handleUsernameSubmit}
                                      className="bg-purple-600 hover:bg-purple-700 text-gray-400"
                                    >
                                      Save Changes
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            )}
                        </div>
                        <p className="text-sm text-gray-400">{auth.user?.accountId}</p>
                      </div>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="bg-red-600 hover:bg-red-700 text-gray-400">
                          <LogOut className="mr-2 h-4 w-4" /> Logout
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-[#141414] text-gray-400 border-b-1 border-[#2c2d32]">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-gray-400">
                            Are you sure you want to logout?
                          </AlertDialogTitle>
                          <AlertDialogDescription className="text-gray-400">
                            This will send you back to the login page.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="bg-gray-600 text-gray-400 hover:bg-gray-700 border-b-1 border-[#2c2d32]">
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleLogout}
                            className="bg-red-600 hover:bg-red-700 text-gray-400"
                          >
                            Yes, Logout
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </CardContent>
                </Card>

                <Card className="bg-[#2a1e36]/40 shadow-lg backdrop-blur-sm border border-[#3d2a4f]/50  text-gray-400">
                  <CardHeader>
                    <CardTitle className="text-gray-400 text-xl">Preferences</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <Switch
                      checked={editOnRelease}
                      onChange={handleEditOnReleaseChange}
                      label="Edit On Release"
                    />
                    <Switch
                      checked={disablePreEdit}
                      onChange={handleDisablePreEditChange}
                      label="Disable Pre-Edits"
                    />
                  </CardContent>
                </Card>
                <Card className="bg-[#2a1e36]/40 shadow-lg backdrop-blur-sm border border-[#3d2a4f]/50  text-gray-400">
                  <CardHeader>
                    <CardTitle className="text-gray-400 text-xl">Preferences</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <Switch
                      checked={editOnRelease}
                      onChange={handleEditOnReleaseChange}
                      label="Edit On Release"
                    />
                    <Switch
                      checked={disablePreEdit}
                      onChange={handleDisablePreEditChange}
                      label="Disable Pre-Edits"
                    />
                    <Switch
                      checked={bubbleBuilds}
                      onChange={handleBubbleBuildsChange}
                      label="Bubble Wrap Builds"
                    />
                    {Array.isArray(auth.user?.roles) &&
                      auth.user.roles.some(role =>
                        ["1349804908064407704", "1326906818366013451"].includes(role)
                      ) && (
                        <Switch
                          checked={filecheck}
                          onChange={handleDisableFileCheckChanged}
                          label="Disable File Check"
                        />
                      )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            <TabsContent value="About">
              <Card className="bg-[#2a1e36]/40 shadow-lg backdrop-blur-sm border border-[#3d2a4f]/50 text-gray-400">
                <CardHeader>
                  <CardTitle className="text-gray-400">About</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Info className="h-6 w-6 text-gray-400" />
                    <span className="text-gray-400">Version</span>
                  </div>
                  <span className="bg-[#0a0a0a] px-4 py-2 rounded-md text-gray-400">{Tauri.Version}</span>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}