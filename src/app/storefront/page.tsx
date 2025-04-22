"use client";

import { useEffect, useState, useRef } from "react";
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

interface Category {
  items: StoreItem[];
  currentIndex: number;
}

const getRarityColor = (rarity: string): string => {
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

const getShopResetTime = (): Date => {
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
  const [progress, setProgress] = useState<number>(0);

  const [carousels, setCarousels] = useState<{ [key: string]: Category }>({});

  const originalData = useRef<StoreData | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await getStorefront();
        if (!response.success) {
          console.error("Failed to fetch storefront data");
          setLoading(false);
          return;
        }

        const data = response.data;
        setStoreData(data);
        originalData.current = data;
        setNextReset(getShopResetTime());

        const categoryMap: { [key: string]: Category } = {};

        data.Storefront.forEach((section, sectionIndex) => {
          section.Entries.forEach((item) => {
            if (!item.category) return;

            const key = `${sectionIndex}-${item.category}`;

            if (!categoryMap[key]) {
              categoryMap[key] = {
                items: [item],
                currentIndex: 0
              };
            } else {
              categoryMap[key].items.push(item);
            }
          });
        });

        setCarousels(categoryMap);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  useEffect(() => {
    if (!storeData) return;

    const progressInterval = setInterval(() => {
      setProgress(prev => (prev >= 100 ? 0 : prev + 1));
    }, 50);

    const rotationInterval = setInterval(() => {
      setCarousels(prev => {
        const updated = { ...prev };

        Object.keys(updated).forEach(key => {
          const carousel = updated[key];
          if (carousel.items.length > 1) {
            updated[key] = {
              ...carousel,
              currentIndex: (carousel.currentIndex + 1) % carousel.items.length
            };
          }
        });

        return updated;
      });

      setProgress(0);
    }, 5000);

    return () => {
      clearInterval(progressInterval);
      clearInterval(rotationInterval);
    };
  }, [storeData]);

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

  const render = () => {
    if (!storeData || !originalData.current) return null;

    return storeData.Storefront.map((section, sectionIndex) => {
      const processedCategories = new Set<string>();

      const display = section.Entries.map((item, _) => {
        const key = `${sectionIndex}-${item.category}`;
        const carousel = carousels[key];

        if (!item.category || !carousel || carousel.items.length <= 1) {
          return item;
        }

        if (processedCategories.has(item.category)) {
          return null;
        }

        processedCategories.add(item.category);

        return carousel.items[carousel.currentIndex];
      }).filter(Boolean);

      return (
        <div key={sectionIndex} className="space-y-2">
          <h2 className="text-xl font-bold text-white px-2 mt-5 mb-5">{section.name}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 px-1">
            {display.map((item, itemIndex) => {
              const key = `${sectionIndex}-${item?.category}`;
              const carousel = item?.category ? carousels[key] : null;
              const isCarousel = carousel && carousel.items.length > 1;

              return (
                <div
                  key={`${item?.offerId || item?.templateId || itemIndex}`}
                  className={`${getRarityColor(item?.rarity || "default")} rounded-lg overflow-hidden relative shadow-lg border border-[#3d2a4f]/30`}
                >
                  {isCarousel && (
                    <div className="absolute top-1 right-1 z-10 bg-black/50 rounded-full px-2 py-0.5 text-xs text-white">
                      {carousel.currentIndex + 1}/{carousel.items.length}
                    </div>
                  )}
                  <div className="relative h-48 w-full">
                    <Image
                      src={
                        item?.image && item?.image.includes("token:athenabattlepasstier")
                          ? "https://image.fnbr.co/misc/5acf2f1f0c426da90460d028/icon.png"
                          : item?.image || "https://via.placeholder.com/150"
                      }
                      onError={(e) => {
                        const currentSrc = e.currentTarget.src;
                        const characterId = item?.templateId.replace("athenaloadingscreen:", "") ?? "";

                        if (currentSrc.includes('/featured.png')) {
                          console.log("Primary image failed, trying smallicon");
                          e.currentTarget.src = `https://fortnite-api.com/images/cosmetics/br/${characterId}/smallicon.png`;
                        }
                        else if (currentSrc.includes('/smallicon.png')) {
                          e.currentTarget.src = `https://cdn.solarisfn.org/Icons/${characterId}.png`;
                        }
                      }}
                      alt={item?.name || "Unnamed Item"}
                      fill
                      className="object-contain"
                    />
                  </div>
                  <div className="p-1.5 absolute bottom-0 left-0 right-0 bg-[#2a1e36]/80 backdrop-blur-sm">
                    <h3 className="text-sm font-bold text-white truncate">{item?.name}</h3>
                    <div className="flex items-center mt-0.5">
                      <Image
                        src="https://image.fnbr.co/price/icon_vbucks_50x.png"
                        alt="V-Bucks"
                        width={14}
                        height={14}
                        className="mr-1"
                      />
                      <span className="text-xs font-bold text-white">{item?.price}</span>
                    </div>

                    {isCarousel && (
                      <div className="w-full h-0.5 bg-gray-700/50 mt-1 rounded overflow-hidden">
                        <div
                          className="h-full bg-white/70"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    });
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar page={{ page: "Item Shop" }} />
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="flex-1 overflow-y-auto p-3 mt-6">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-white text-xl">Loading storefront...</div>
          </div>
        ) : !storeData ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-white text-xl">Failed to load store data!</div>
          </div>
        ) : (
          <div className="max-w-full mx-auto">
            <h1 className="text-3xl font-bold text-white mt-3 ml-2">Shop</h1>
            <div className="grid grid-cols-1 gap-4">
              <div className="relative">
                <div className="absolute -top-3 right-2">
                  <div className="flex items-center text-white bg-[#2a1e36]/40 backdrop-blur-sm border border-[#3d2a4f]/50 px-4 py-1.5 rounded-md shadow-lg">
                    <Clock className="h-4 w-4 mr-2" />
                    <span className="text-sm">{timeLeft}</span>
                  </div>
                </div>
                {render()}
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}