"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Sidebar from "@/components/core/SideBar";
import { Clock } from "lucide-react";
import { getStorefront } from "@/api/storefront/shop";
import { motion, AnimatePresence, useSpring, useTransform, useMotionValue } from "framer-motion";

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
  console.log(rarity);
  switch (rarity.toLowerCase()) {
    case "epic":
      return "bg-gradient-to-br from-purple-700 to-purple-500";
    case "rare":
      return "bg-gradient-to-br from-blue-700 to-blue-500";
    case "uncommon":
      return "bg-gradient-to-br from-green-700 to-green-500";
    case "legendary":
      return "bg-gradient-to-br from-orange-600 to-yellow-500";
    default:
      return "bg-gradient-to-br from-purple-400 to-purple-700";
  }
};

const getRarityBorderColor = (rarity: string): string => {
  switch (rarity.toLowerCase()) {
    case "epic":
      return "border-purple-400";
    case "rare":
      return "border-blue-400";
    case "uncommon":
      return "border-green-400";
    case "legendary":
      return "border-orange-400";
    default:
      return "border-purple-300";
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
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const originalData = useRef<StoreData | null>(null);
  const scrollY = useMotionValue(0);
  const scrollYSmooth = useSpring(scrollY, { damping: 20, stiffness: 100 });

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
                currentIndex: 0,
              };
            } else {
              categoryMap[key].items.push(item);
            }
          });
        });

        setCarousels(categoryMap);

        setTimeout(() => {
          setIsInitialLoad(false);
        }, 200);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();

    const handleScroll = (e: any) => {
      scrollY.set(e.target.scrollTop);
    };

    const scrollContainer = document.querySelector(".shop-scroll-container");
    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", handleScroll);
    }

    return () => {
      if (scrollContainer) {
        scrollContainer.removeEventListener("scroll", handleScroll);
      }
    };
  }, [scrollY]);

  useEffect(() => {
    if (!storeData) return;

    const progressInterval = setInterval(() => {
      setProgress((prev) => (prev >= 100 ? 0 : prev + 1));
    }, 50);

    const rotationInterval = setInterval(() => {
      setCarousels((prev) => {
        const updated = { ...prev };

        Object.keys(updated).forEach((key) => {
          const carousel = updated[key];
          if (carousel.items.length > 1) {
            updated[key] = {
              ...carousel,
              currentIndex: (carousel.currentIndex + 1) % carousel.items.length,
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

  const backgroundY = useTransform(scrollYSmooth, [0, 500], [0, -100]);

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
        <motion.div
          key={sectionIndex}
          className="space-y-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.5,
            delay: 0.1 * sectionIndex,
            ease: [0.22, 1, 0.36, 1],
          }}>
          <motion.h2
            className="text-2xl font-bold text-white px-2 mt-5 mb-5"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: 0.5,
              delay: 0.1 * sectionIndex + 0.2,
              ease: "easeOut",
            }}>
            {section.name}
          </motion.h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 px-1">
            <AnimatePresence>
              {display.map((item, itemIndex) => {
                const key = `${sectionIndex}-${item?.category}`;
                const carousel = item?.category ? carousels[key] : null;
                const isCarousel = carousel && carousel.items.length > 1;
                const itemId = item?.offerId || item?.templateId || `${sectionIndex}-${itemIndex}`;
                const isHovered = hoveredItem === itemId;

                return (
                  <motion.div
                    key={itemId}
                    layoutId={itemId}
                    initial={isInitialLoad ? { opacity: 0, scale: 0.8 } : false}
                    animate={{
                      opacity: 1,
                      scale: 1,
                      y: 0,
                    }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{
                      duration: 0.4,
                      delay: 0.05 * itemIndex,
                      type: "spring",
                      stiffness: 300,
                      damping: 20,
                    }}
                    whileHover={{
                      scale: 1.05,
                      rotateY: 10,
                      rotateX: -5,
                      z: 50,
                    }}
                    style={{
                      transformStyle: "preserve-3d",
                      perspective: "1000px",
                    }}
                    onHoverStart={() => setHoveredItem(itemId)}
                    onHoverEnd={() => setHoveredItem(null)}
                    className={`${getRarityColor(
                      item?.rarity || "default"
                    )} rounded-lg overflow-hidden relative shadow-xl border-2 ${getRarityBorderColor(
                      item?.rarity || "default"
                    )} cursor-pointer`}>
                    <div
                      className="relative h-48 w-full"
                      style={{
                        transform: "translateZ(20px)",
                        transformStyle: "preserve-3d",
                      }}>
                      <motion.div
                        initial={{ scale: 1 }}
                        whileHover={{ scale: 1.05, z: 30 }}
                        transition={{ duration: 0.4 }}
                        className="h-full w-full"
                        style={{
                          transformStyle: "preserve-3d",
                        }}>
                        <Image
                          src={
                            item?.image && item?.image.includes("token:athenabattlepasstier")
                              ? "https://image.fnbr.co/misc/5acf2f1f0c426da90460d028/icon.png"
                              : item?.image || "https://via.placeholder.com/150"
                          }
                          onError={(e) => {
                            const currentSrc = e.currentTarget.src;
                            const characterId =
                              item?.templateId.replace("athenaloadingscreen:", "") ?? "";

                            if (currentSrc.includes("/featured.png")) {
                              console.log("Primary image failed, trying smallicon");
                              e.currentTarget.src = `https://fortnite-api.com/images/cosmetics/br/${characterId}/smallicon.png`;
                            } else if (currentSrc.includes("/smallicon.png")) {
                              e.currentTarget.src = `https://cdn.solarisfn.org/Icons/${characterId}.png`;
                            }
                          }}
                          alt={item?.name || "Unnamed Item"}
                          fill
                          className="object-contain transform transition-transform duration-500"
                          style={{
                            transform: "translateZ(10px)",
                          }}
                        />
                      </motion.div>
                    </div>

                    <motion.div
                      className="p-2.5 absolute bottom-0 left-0 right-0 bg-black/80 backdrop-blur-md"
                      style={{
                        transform: "translateZ(15px)",
                      }}>
                      <h3 className="text-sm font-bold text-white truncate">{item?.name}</h3>
                      <div className="flex items-center mt-1">
                        <Image
                          src="https://image.fnbr.co/price/icon_vbucks_50x.png"
                          alt="V-Bucks"
                          width={16}
                          height={16}
                          className="mr-1.5"
                        />
                        <span className="text-xs font-bold text-white">{item?.price}</span>
                      </div>

                      {isCarousel && (
                        <div className="w-full h-1 bg-gray-700/50 mt-1.5 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-white"
                            style={{ width: `${progress}%` }}
                            initial={{ width: "0%" }}
                            animate={{ width: `${progress}%` }}
                            transition={{ ease: "linear" }}
                          />
                        </div>
                      )}
                    </motion.div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </motion.div>
      );
    });
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar page={{ page: "Item Shop" }} />

      <div className="flex-1 relative bg-[#1a1625]">
        <motion.div
          className="absolute inset-0 w-full h-full bg-cover bg-center opacity-30"
          style={{
            y: backgroundY,
            backgroundImage:
              "url('https://cdn2.unrealengine.com/fortnite-chapter-4-season-4-key-art-3840x2160-2e0455b3b36a.jpg')",
          }}
        />

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 w-full h-full bg-gradient-to-b from-[#1a1625]/80 to-[#2a1e36]/80"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 w-full h-full overflow-y-auto p-3 mt-6 shop-scroll-container">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="text-white text-xl font-bold">Loading storefront...</div>
            </div>
          ) : !storeData ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-white text-xl">Failed to load store data!</div>
            </div>
          ) : (
            <div className="max-w-full mx-auto">
              <motion.h1
                className="text-4xl font-bold text-white mt-3 ml-2 mb-6"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}>
                Item Shop
              </motion.h1>

              <motion.div
                className="relative"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}>
                <motion.div
                  className="absolute -top-3 right-2"
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 20,
                    delay: 0.3,
                  }}>
                  <motion.div
                    className="flex items-center text-white bg-[#2a1e36]/70 backdrop-blur-md border border-[#3d2a4f]/50 px-4 py-2 rounded-md shadow-lg"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.2 }}>
                    <Clock className="h-4 w-4 mr-2 text-yellow-400" />
                    <span className="text-sm font-medium">{timeLeft}</span>
                  </motion.div>
                </motion.div>
                {render()}
              </motion.div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
