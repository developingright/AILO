"use client"
import { useEffect, useState } from "react"; // Import useEffect and useState
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { NavigationMenu, NavigationMenuList, NavigationMenuLink } from "@/components/ui/navigation-menu"
import { JSX, SVGProps } from "react"
import { useRouter } from 'next/navigation';
import { MessageCircle } from "lucide-react"

export function Navbar() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Check for token on client side
    const storedToken = window.localStorage.getItem('token');
    setToken(storedToken);
  }, []);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('token');
      window.localStorage.removeItem('UserId');
      window.localStorage.removeItem('username');
      window.localStorage.removeItem('companyurl');
      router.push('/auth/login');
    }
    router.push('/auth/login');
  }

  return (
    <header className="px-4 lg:px-6 h-14 flex items-center z-10 bg-opacity-0">
      <Link className="flex items-center justify-center" href="#">
        <MessageCircle className="h-6 w-6 mr-2" />
        <span className="font-bold">Ailo</span>
      </Link>
      <nav className="ml-auto flex gap-4 sm:gap-6">
        <Link className="text-sm font-medium hover:underline underline-offset-4" href="/">
          Home
        </Link>
        <Link className="text-sm font-medium hover:underline underline-offset-4" href="/chat">
          ChatBot
        </Link>
        {token ? (
          <Link onClick={handleLogout} className="text-sm font-medium hover:underline underline-offset-4" href="/auth/login">
            Logout
          </Link>
        ) : (
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="/auth/login">
            Login
          </Link>
        )}
      </nav>
    </header>
  )
}

function MenuIcon(props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="4" x2="20" y1="12" y2="12" />
      <line x1="4" x2="20" y1="6" y2="6" />
      <line x1="4" x2="20" y1="18" y2="18" />
    </svg>
  )
}

function MountainIcon(props: JSX.IntrinsicAttributes & React.ImgHTMLAttributes<HTMLImageElement>) {
  return (
    <img
      {...props}
      src="https://freesvg.org/img/1538298822.png"
      alt="Mountain Icon"
      width=""
      height=""
    />
  );
}
