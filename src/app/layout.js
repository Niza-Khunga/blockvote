import { Geist, Geist_Mono } from "next/font/google";
import { NavBar, Footer } from "@/components";
import { VotingProvider } from "@/context/VotingContext";
import { ElectionProvider } from "@/context/ElectionContext";
import { VoteProvider } from "@/context/VoteContext";
import { ResultsProvider } from "@/context/ResultsContext";
import { AdminProvider } from "@/context/AdminContext";
import 'bootstrap/dist/css/bootstrap.min.css';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "BlockVote",
  description: "BlockVote is a secure, transparent, and decentralized voting system built on blockchain technology to ensure vote integrity and verifiability.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <VotingProvider>
          <ElectionProvider>
            <VoteProvider>
              <ResultsProvider>
                <AdminProvider>
                  <NavBar />
                  <main>{children}</main>
                  <Footer />
                </AdminProvider>
              </ResultsProvider>
            </VoteProvider>
          </ElectionProvider>
        </VotingProvider>
      </body>
    </html>
  );
}