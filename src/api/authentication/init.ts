import { useEffect } from "react";
import useAuth from "@/api/authentication/zustand/state";
import { useRouter } from "next/navigation";

export function useInit() {
  const authentication = useAuth();
  const router = useRouter();

  useEffect(() => {
    async function checkAuth() {
      const auth = await authentication.verify();

      if (auth) {
        router.push("/home");
      } else {
        router.push("/");
      }
    }

    checkAuth();
  }, [authentication.verify, router]);
}
// just a func for verifying the login status
