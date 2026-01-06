import "./globals.css";
import Providers from "@/components/Providers";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner"; // <--- Import this

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata = {
  title: "Enfinito Cloud | Enterprise Email Infrastructure",
  description: "High-performance email hosting for modern teams.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <body className="bg-[#0F1117] text-white selection:bg-blue-500/30 font-sans">
        <Providers>
          {children}
          {/* Add the Toaster here. 'richColors' gives it the success/error styling automatically */}
          <Toaster richColors position="top-right" theme="dark" />
        </Providers>
      </body>
    </html>
  );
}