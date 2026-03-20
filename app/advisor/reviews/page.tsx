import { getAllClients } from '@/lib/data/clients'
import { getAllReviews } from '@/lib/data/reviews'
import { ReviewsPageClient } from '@/components/advisor/ReviewsPageClient'

export const dynamic = 'force-dynamic'

export default async function ReviewsPage() {
  const [reviews, clients] = await Promise.all([
    getAllReviews(),
    getAllClients(),
  ])

  return <ReviewsPageClient reviews={reviews} clients={clients} />
}
