import { AppLayout } from "@/components/layout/AppLayout";

export default function AuthAppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AppLayout>{children}</AppLayout>;
}
