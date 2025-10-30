import FamilyTimelineV2Client from './client';

export default async function FamilyTimelineV2Page({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  
  return <FamilyTimelineV2Client userId={userId} />;
}

