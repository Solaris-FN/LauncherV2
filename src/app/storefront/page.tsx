"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Sidebar from "@/components/core/SideBar";
import { Clock } from "lucide-react";
import { getStorefront } from "@/api/storefront/shop";
import { motion } from "framer-motion";

interface StoreItem {
  category: string;
  image: string;
  name: string;
  offerId: string;
  price: number;
  rarity: string;
  templateId: string;
}

interface StoreSection {
  Entries: StoreItem[];
  name: string;
}

interface StoreData {
  Refresh: string;
  Storefront: StoreSection[];
}

interface ResponseOrError<T> {
  success: boolean;
  data: T;
}

const getRarityColor = (rarity: string): string => {
  // hey i mean it works :sob: :pray:
  switch (rarity.toLowerCase()) {
    case "epic":
      return "bg-purple-600";
    case "rare":
      return "bg-blue-600";
    case "uncommon":
      return "bg-green-600";
    case "legendary":
      return "bg-orange-500";
    default:
      return "bg-gray-600";
  }
};

const getRandomPrice = (rarity: string): number => {
  // hey i mean it works :sob: :pray:
  switch (rarity.toLowerCase()) {
    case "legendary":
      return 2000;
    case "epic":
      return 1500;
    case "rare":
      return 1200;
    case "uncommon":
      return 800;
    default:
      return 500;
  }
};

const getShopResetTime = (): Date => {
  // this is bad code but wtv will fix it later i got to go night night
  const now = new Date();
  const today = new Date();
  today.setUTCHours(20 + 4, 0, 0, 0);

  if (now >= today) {
    today.setDate(today.getDate() + 1);
  }

  return today;
};

export default function Shop() {
  const [storeData, setStoreData] = useState<StoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [nextReset, setNextReset] = useState<Date>(getShopResetTime());

  useEffect(() => {
    const fetchStoreData = async () => {
      try {
        const response = await getStorefront("meow");

        if (!response.success) {
          console.error("Failed to fetch storefront data");
          setLoading(false);
          return;
        }

        const data = response.data;

        const processedData = {
          ...data,
          Storefront: data.Storefront.map((section: StoreSection) => ({
            ...section,
            Entries: section.Entries.map((item: StoreItem) => ({
              ...item,
              price: getRandomPrice(item.rarity),
            })),
          })),
        };

        setStoreData(processedData);
        setNextReset(getShopResetTime());
      } catch (error) {
        console.error("Error fetching store data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStoreData();
  }, []);

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const diff = nextReset.getTime() - now.getTime();

      if (diff <= 0) {
        const newResetTime = getShopResetTime();
        setNextReset(newResetTime);
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [nextReset]);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar page={{ page: "storefront" }} />
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="flex-1 overflow-y-auto bg-[#121212] p-3">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-white text-xl">Loading storefront...</div>
          </div>
        ) : !storeData ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-white text-xl">
              Failed to load store data prob bc tiva's fatass ate the servers
            </div>
          </div>
        ) : (
          <div className="max-w-full mx-auto">
            <div className="h-7"></div>
            <div className="grid grid-cols-1 gap-4">
              <div className="relative">
                <div className="absolute -top-6 right-2">
                  <div className="flex items-center text-white bg-[#2a1e36]/40 backdrop-blur-sm border border-[#3d2a4f]/50 px-3 py-1.5 rounded-md shadow-lg">
                    <Clock className="h-4 w-4 mr-2" />
                    <span className="text-sm">Resets in {timeLeft}</span>
                  </div>
                </div>
                {storeData.Storefront.map((section, sectionIndex) => (
                  <div key={sectionIndex} className="space-y-2">
                    <h2 className="text-xl font-bold text-white px-2">{section.name}</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 px-1">
                      {section.Entries.map((item, itemIndex) => (
                        <div
                          key={itemIndex}
                          className={`${getRarityColor(
                            item.rarity
                          )} rounded-lg overflow-hidden relative shadow-lg border border-[#3d2a4f]/30`}>
                          <div className="aspect-square relative">
                            <Image
                              src={item.image || "/placeholder.svg"}
                              alt={item.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="p-1.5 absolute bottom-0 left-0 right-0 bg-[#2a1e36]/80 backdrop-blur-sm">
                            <h3 className="text-sm font-bold text-white truncate">{item.name}</h3>
                            <div className="flex items-center mt-0.5">
                              <Image
                                src="https://image.fnbr.co/price/icon_vbucks_50x.png"
                                alt="V-Bucks"
                                width={14}
                                height={14}
                                className="mr-1"
                              />
                              <span className="text-xs font-bold text-white">{item.price}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
