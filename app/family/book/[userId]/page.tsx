import FamilyBookClient from './client';

export default async function FamilyBookPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  
  return <FamilyBookClient userId={userId} />;
}
