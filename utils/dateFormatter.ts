export function getTimeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Baru saja";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}mnt lalu`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}j lalu`;
  
  const diffInDays = Math.floor(diffInSeconds / 86400);
  if (diffInDays === 1) return "Kemarin";
  if (diffInDays < 7) return `${diffInDays}hr lalu`;

  return date.toLocaleDateString('id-ID', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}