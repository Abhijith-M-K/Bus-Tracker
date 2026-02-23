import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Yathra - Admin",
    description: "Admin dashboard for bus and route management.",
    manifest: "/manifest-admin.json",
};

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
