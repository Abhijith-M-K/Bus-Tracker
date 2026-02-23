import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Yathra - Conductor",
    description: "Conductor portal for broadcasting bus location.",
    manifest: "/manifest-conductor.json",
};

export default function ConductorLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
