import React from "react";
import AiAssistantWidget, { AiAssistantProvider } from "@/components/ai/AiAssistantWidget";
import { Outlet } from "react-router-dom";
import Footer from "./Footer";
import Navbar from "./Navbar";

export default function PublicLayout() {
  return (
    <AiAssistantProvider>
      <div className="flex min-h-screen flex-col bg-transparent">
        <Navbar />
        <main className="flex-1 pt-[7.25rem]">
          <Outlet />
        </main>
        <Footer />
        <AiAssistantWidget />
      </div>
    </AiAssistantProvider>
  );
}
