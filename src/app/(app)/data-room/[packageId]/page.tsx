import { connection } from "next/server";
import { notFound } from "next/navigation";
import { DataRoomPackageDetail } from "@/components/data-room/data-room-package-detail";
import { renderAppPage } from "@/lib/page";
import { getCurrentUser } from "@/lib/session";
import { getAccessibleDataRoomPackage } from "@/services/data-room/packages";

interface DataRoomPackagePageProps {
  params: Promise<{ packageId: string }>;
}

async function DataRoomPackagePageContent({
  params,
}: DataRoomPackagePageProps) {
  await connection();
  const { packageId } = await params;
  const user = await getCurrentUser();
  const pkg = await getAccessibleDataRoomPackage({ user, packageId });

  if (!pkg) {
    notFound();
  }

  return renderAppPage(pkg.title, <DataRoomPackageDetail pkg={pkg} />);
}

export default async function DataRoomPackagePage(
  props: DataRoomPackagePageProps,
) {
  return <DataRoomPackagePageContent {...props} />;
}
