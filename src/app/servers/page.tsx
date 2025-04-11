"use client";

import { endpoints } from "@/api/config/endpoints";
import Sidebar from "@/components/core/SideBar";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

const playlistNames: { [key: string]: string } = {
  // stole from v1 was not going to do this manually all over again
  playlist_defaultsolo: "Solo",
  playlist_defaultduo: "Duos",
  playlist_defaulttrio: "Trios",
  playlist_defaultsquads: "Squads",
  playlist_showdownalt_solo: "Solo Lategame Arena",
  playlist_showdownalt_duo: "Duo Lategame Arena",
  playlist_showdownalt_duos: "Duo Lategame Arena",
  playlist_showdownalt_trio: "Trio Lategame Arena",
  playlist_showdownalt_trios: "Trio Lategame Arena",
  playlist_showdownalt_squad: "Squad Lategame Arena",
  playlist_showdownalt_squads: "Squad Lategame Arena",
  playlist_showdown_solo: "Solo Tournament",
  playlist_showdown_duo: "Duo Tournament",
  playlist_showdown_trio: "Trio Tournament",
  playlist_showdown_squad: "Squad Tournament",
  playlist_showdown_duos: "Duo Tournament",
  playlist_showdown_trios: "Trio Tournament",
  playlist_showdown_squads: "Squad Tournament",
  playlist_defaultsquad: "Squad",
  playlist_trios: "Trios",
  playlist_playgroundv2: "Creative",
  playlist_playground: "Playground",
  playlist_low_solo: "One Shot Solo",
  playlist_low_duos: "One Shot Duos",
  playlist_low_squad: "One Shot Squads",
  playlist_fill_solo: "Floor Is Lava Solo",
  playlist_fill_duos: "Floor Is Lava Duos",
  playlist_fill_squads: "Floor Is Lava Squads",
  playlist_slide_solo: "Slide Solo",
  playlist_slide_duos: "Slide Duos",
  playlist_slide_squad: "Slide Squads",
  playlist_blitz_solo: "Blitz! Solo",
  playlist_blitz_duos: "Blitz! Duos",
  playlist_blitz_squads: "Blitz! Squads",
  playlist_vamp_solo: "Siphon Solo",
  playlist_vamp_duos: "Siphon Duos",
  playlist_vamp_squad: "Siphon Squads",
  playlist_soaring_solo: "Infinite Gliders Solo",
  playlist_soaring_duos: "Infinite Gliders Duos",
  playlist_soaring_squads: "Infinite Gliders Squads",
  playlist_beagles_solo: "Headshots Only Solo",
  playlist_beagles_duo: "Headshots Only Duos",
  playlist_highexplosives_solo: "High Explosives Solo",
  playlist_highexplosives_duos: "High Explosives Duos",
  playlist_highexplosives_squads: "High Explosives Squads",
  playlist_unvaulted_solo: "Unvaulted Solo",
  playlist_unvaulted_duos: "Unvaulted Duos",
  playlist_unvaulted_trios: "Unvaulted Trios",
  playlist_unvaulted_squads: "Unvaulted Squads",
  playlist_solidgold_solo: "Solid Gold Solo",
  playlist_solidgold_duos: "Solid Gold Duos",
  playlist_solidgold_trios: "Solid Gold Trios",
  playlist_solidgold_squads: "Solid Gold Squads",
  playlist_ww_solo: "Wild West Solo",
  playlist_ww_duo: "Wild West Duos",
  playlist_ww_squad: "Wild West Squads",
  playlist_score_solo: "Score Solo",
  playlist_score_duos: "Score Duos",
  playlist_score_squads: "Score Squads",
};

interface Server {
  players: number;
  sessionId: string;
  playlistName: string;
  maxPlayers: number;
  started: boolean;
  region: string;
}

const getFriendlyPlaylistName = (rawPlaylistName: string): string => {
  return playlistNames[rawPlaylistName] || rawPlaylistName;
};

const getNextRefreshTime = (): Date => {
  // made it refresh every 15 seconds bc why not
  const now = new Date();
  return new Date(now.getTime() + 15000);
};

export default function Servers() {
  const [servers, setServers] = useState<Server[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [nextRefresh, setNextRefresh] = useState<Date>(getNextRefreshTime());

  const fetchServers = async () => {
    try {
      const response = await fetch(endpoints.GET_LAUNCHER_SERVERS);
      if (!response.ok) {
        throw new Error("Failed to fetch servers!");
      }
      const data = await response.json();
      setServers(data);
      setIsLoading(false);
      setNextRefresh(getNextRefreshTime());
    } catch (err) {
      setError("Error getting servers!");
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchServers();
    const interval = setInterval(fetchServers, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const diff = nextRefresh.getTime() - now.getTime();

      if (diff <= 0) {
        fetchServers();
        return;
      }

      const seconds = Math.floor(diff / 1000);
      setTimeLeft(`${seconds}s`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [nextRefresh]);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar page={{ page: "Servers" }} />
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="flex-1 overflow-y-auto p-3 mt-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-12 w-12 animate-spin text-[#6f7070]" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-white text-xl">{error}</div>
          </div>
        ) : (
          <div className="max-w-full mx-auto">
            <div className="h-7"></div>
            <div className="grid grid-cols-1 gap-4">
              <div className="relative">
                <div className="absolute -top-6 right-2"></div>
                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-white px-2 mt-5">Active Solaris Servers</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 px-1">
                    {servers.map((server) => (
                      <div
                        key={server.sessionId}
                        className="bg-gray-600 rounded-lg overflow-hidden relative shadow-lg border border-[#3d2a4f]/30">
                        <div className="p-4">
                          <div className="flex flex-col h-full">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="text-sm font-bold text-white">
                                  {getFriendlyPlaylistName(server.playlistName)}
                                </h3>
                                <div className="text-xs text-white/70 mt-1">
                                  {server.region.toUpperCase()}
                                </div>
                              </div>
                              <div className="bg-[#2a1e36]/60 backdrop-blur-sm px-2 py-0.5 rounded text-xs font-medium text-white">
                                {server.started ? "INGAME" : "LOADING"}
                              </div>
                            </div>
                            <div className="mt-auto">
                              <div className="text-xs text-white/70 mt-3 truncate">
                                {server.sessionId}
                              </div>
                              <div className="mt-2 bg-[#2a1e36]/40 backdrop-blur-sm rounded-md h-6 flex items-center px-2">
                                <div className="text-xs font-bold text-white">
                                  {server.players}/{server.maxPlayers} Players
                                </div>
                                <div className="ml-auto">
                                  <div className="w-16 bg-[#3d2a4f]/50 h-2 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-gradient-to-r from-gray-500 to-blue-500"
                                      style={{
                                        width: `${(server.players / server.maxPlayers) * 100}%`,
                                      }}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
