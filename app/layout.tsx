import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import Navbar from "@/components/navigation/Navbar";
import { Toaster } from "react-hot-toast"; // Import from react-hot-toast instead

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Healthcare Tracker",
  description: "Track your health metrics and get insights",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <Navbar />
          <main className="ml-64">{children}</main>
        </AuthProvider>
        <Toaster position="top-right" />{" "}
        {/* This is the react-hot-toast provider */}
      </body>
    </html>
  );
}
