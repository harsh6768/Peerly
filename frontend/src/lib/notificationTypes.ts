export type NotificationAudience = 'owner' | 'seeker'

export type NotificationPayload = {
  title: string
  audience: NotificationAudience
  listingId?: string
  inquiryId?: string
  listingTitle?: string
  status?: string
  visitAction?: string
}

export type UserNotificationType =
  | 'INQUIRY_RECEIVED'
  | 'INQUIRY_STATUS_UPDATED'
  | 'INQUIRY_VISIT_UPDATED'

export type UserNotificationDto = {
  id: string
  type: UserNotificationType
  payload: NotificationPayload
  readAt: string | null
  createdAt: string
}

export type NotificationListResponse = {
  items: UserNotificationDto[]
  nextCursor: string | null
}
