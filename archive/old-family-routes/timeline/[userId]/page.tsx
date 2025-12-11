import FamilyTimelineClient from './client';

export default async function FamilyTimelinePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  
  return <FamilyTimelineClient userId={userId} />;
}
