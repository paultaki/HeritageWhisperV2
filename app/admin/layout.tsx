import type { Metadata } from "next";
import AdminSidebar from "@/components/AdminSidebar";

export const metadata: Metadata = {
  title: "Admin Dashboard - HeritageWhisper",
  description: "Admin tools for HeritageWhisper",
  icons: {
    icon: [
      {
        url: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⚙️</text></svg>",
        type: "image/svg+xml",
      },
    ],
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[#FFF8F3]">
      <AdminSidebar />
      <main className="flex-1 ml-64">
        {children}
      </main>
    </div>
  );
}
