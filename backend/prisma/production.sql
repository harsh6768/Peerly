-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "OrganizationType" AS ENUM ('COMPANY', 'COMMUNITY', 'GATED_COMMUNITY', 'NETWORK', 'OTHER');

-- CreateEnum
CREATE TYPE "MembershipRole" AS ENUM ('MEMBER', 'ADMIN', 'MODERATOR');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('INVITED', 'ACTIVE', 'INACTIVE', 'BLOCKED');

-- CreateEnum
CREATE TYPE "VerificationBadge" AS ENUM ('NONE', 'EMAIL_VERIFIED', 'LINKEDIN_VERIFIED', 'COMPANY_VERIFIED', 'MANUALLY_VERIFIED');

-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('GOOGLE');

-- CreateEnum
CREATE TYPE "AssetProvider" AS ENUM ('CLOUDINARY', 'S3');

-- CreateEnum
CREATE TYPE "VerificationType" AS ENUM ('WORK_EMAIL', 'LINKEDIN');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "UrgencyLevel" AS ENUM ('IMMEDIATE', 'THIS_WEEK', 'FLEXIBLE');

-- CreateEnum
CREATE TYPE "ContactMode" AS ENUM ('WHATSAPP', 'CALL', 'CHAT');

-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'PAUSED', 'ARCHIVED', 'FILLED');

-- CreateEnum
CREATE TYPE "ListingType" AS ENUM ('tenant_replacement', 'send_request');

-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('ROOM', 'STUDIO', 'APARTMENT', 'PG', 'HOUSE');

-- CreateEnum
CREATE TYPE "OccupancyType" AS ENUM ('SINGLE', 'DOUBLE', 'SHARED');

-- CreateEnum
CREATE TYPE "NearbyPlaceType" AS ENUM ('tech_park', 'company');

-- CreateEnum
CREATE TYPE "ListingInquiryStatus" AS ENUM ('NEW', 'CONTACTED', 'SCHEDULED', 'CLOSED', 'DECLINED');

-- CreateEnum
CREATE TYPE "ListingVisitStatus" AS ENUM ('NONE', 'PROPOSED', 'CONFIRMED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "HousingNeedStatus" AS ENUM ('OPEN', 'MATCHED', 'CLOSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "TravelerRouteStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'MATCHED', 'COMPLETED', 'CANCELLED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CapacityType" AS ENUM ('DOCUMENTS_ONLY', 'SMALL_BAG', 'CABIN_LUGGAGE', 'CHECK_IN_LUGGAGE');

-- CreateEnum
CREATE TYPE "ShipmentRequestStatus" AS ENUM ('DRAFT', 'OPEN', 'MATCHED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ItemType" AS ENUM ('DOCUMENTS', 'ELECTRONICS', 'CLOTHING', 'FOOD', 'MEDICINE', 'OTHER');

-- CreateEnum
CREATE TYPE "ItemSize" AS ENUM ('SMALL', 'MEDIUM', 'LARGE');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('SUGGESTED', 'CONTACTED', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ConversationType" AS ENUM ('LISTING', 'SHIPMENT', 'SUPPORT');

-- CreateEnum
CREATE TYPE "ConversationStatus" AS ENUM ('ACTIVE', 'CLOSED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('TEXT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "EntityType" AS ENUM ('USER', 'LISTING', 'LISTING_INQUIRY', 'TRAVELER_ROUTE', 'SHIPMENT_REQUEST', 'MATCH', 'CONVERSATION', 'MESSAGE');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('OPEN', 'REVIEWED', 'ACTIONED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "ReportReason" AS ENUM ('SPAM', 'FAKE_LISTING', 'HARASSMENT', 'PROHIBITED_ITEM', 'OTHER');

-- CreateEnum
CREATE TYPE "TrackingEventType" AS ENUM ('MATCHED', 'PICKUP_CONFIRMED', 'IN_TRANSIT', 'ARRIVED_HANDOFF', 'DELIVERED', 'ISSUE_REPORTED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "authProvider" "AuthProvider" NOT NULL DEFAULT 'GOOGLE',
    "googleSub" TEXT,
    "phone" VARCHAR(20),
    "avatarUrl" TEXT,
    "homeCity" TEXT,
    "bio" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationType" "VerificationType",
    "workEmail" TEXT,
    "companyName" TEXT,
    "linkedinUrl" TEXT,
    "linkedinProofCode" TEXT,
    "verificationStatus" "VerificationStatus",
    "phoneVerifiedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "domain" TEXT,
    "type" "OrganizationType" NOT NULL,
    "city" TEXT,
    "isVerifiedNetwork" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserOrganizationMembership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "role" "MembershipRole" NOT NULL DEFAULT 'MEMBER',
    "status" "MembershipStatus" NOT NULL DEFAULT 'ACTIVE',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserOrganizationMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "linkedinVerified" BOOLEAN NOT NULL DEFAULT false,
    "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "governmentIdVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationBadge" "VerificationBadge" NOT NULL DEFAULT 'NONE',
    "trustScore" INTEGER NOT NULL DEFAULT 0,
    "lastVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "VerificationProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "provider" "AuthProvider" NOT NULL DEFAULT 'GOOGLE',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuthSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkEmailOtp" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "workEmail" TEXT NOT NULL,
    "otpHash" TEXT NOT NULL,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WorkEmailOtp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhoneOtp" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "otpHash" TEXT NOT NULL,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PhoneOtp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Listing" (
    "id" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "organizationId" TEXT,
    "type" "ListingType" NOT NULL DEFAULT 'tenant_replacement',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "city" TEXT,
    "locality" TEXT,
    "locationName" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "fromCity" TEXT,
    "toCity" TEXT,
    "itemType" "ItemType",
    "requiredDate" TIMESTAMP(3),
    "contactPhone" VARCHAR(20),
    "rentAmount" INTEGER,
    "depositAmount" INTEGER,
    "maintenanceAmount" INTEGER,
    "miscCharges" TEXT,
    "amenities" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "propertyType" "PropertyType",
    "occupancyType" "OccupancyType",
    "moveInDate" TIMESTAMP(3),
    "moveOutDate" TIMESTAMP(3),
    "urgencyLevel" "UrgencyLevel" NOT NULL DEFAULT 'FLEXIBLE',
    "contactMode" "ContactMode" NOT NULL DEFAULT 'WHATSAPP',
    "status" "ListingStatus" NOT NULL DEFAULT 'DRAFT',
    "isBoosted" BOOLEAN NOT NULL DEFAULT false,
    "brokerAllowed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Listing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListingNearby" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "type" "NearbyPlaceType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ListingNearby_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListingImage" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "assetProvider" "AssetProvider" NOT NULL DEFAULT 'CLOUDINARY',
    "providerAssetId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT NOT NULL,
    "detailUrl" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "bytes" INTEGER,
    "isCover" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ListingImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HousingNeed" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT,
    "city" TEXT NOT NULL,
    "locality" TEXT,
    "preferredPropertyType" "PropertyType" NOT NULL,
    "preferredOccupancy" "OccupancyType" NOT NULL,
    "maxRentAmount" INTEGER,
    "maxDepositAmount" INTEGER,
    "maxMaintenanceAmount" INTEGER,
    "preferredAmenities" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "moveInDate" TIMESTAMP(3) NOT NULL,
    "urgencyLevel" "UrgencyLevel" NOT NULL DEFAULT 'FLEXIBLE',
    "preferredContactMode" "ContactMode" NOT NULL DEFAULT 'WHATSAPP',
    "notes" TEXT,
    "status" "HousingNeedStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "HousingNeed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HousingNeedNearby" (
    "id" TEXT NOT NULL,
    "housingNeedId" TEXT NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "type" "NearbyPlaceType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HousingNeedNearby_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListingInquiry" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "requesterUserId" TEXT NOT NULL,
    "listingOwnerUserId" TEXT NOT NULL,
    "message" TEXT,
    "ownerNotes" TEXT,
    "budgetAmount" INTEGER,
    "preferredMoveInDate" TIMESTAMP(3),
    "preferredOccupancy" "OccupancyType",
    "preferredVisitAt" TIMESTAMP(3),
    "preferredVisitNote" TEXT,
    "scheduledVisitAt" TIMESTAMP(3),
    "scheduledVisitNote" TEXT,
    "visitStatus" "ListingVisitStatus" NOT NULL DEFAULT 'NONE',
    "visitConfirmedAt" TIMESTAMP(3),
    "visitCancelledAt" TIMESTAMP(3),
    "visitCompletedAt" TIMESTAMP(3),
    "status" "ListingInquiryStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ListingInquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TravelerRoute" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT,
    "sourceCity" TEXT NOT NULL,
    "sourceArea" TEXT,
    "destinationCity" TEXT NOT NULL,
    "destinationArea" TEXT,
    "travelDate" TIMESTAMP(3) NOT NULL,
    "travelTimeWindow" TEXT,
    "capacityType" "CapacityType" NOT NULL,
    "capacityNotes" TEXT,
    "allowedItemTypes" "ItemType"[],
    "status" "TravelerRouteStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TravelerRoute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShipmentRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT,
    "sourceCity" TEXT NOT NULL,
    "sourceArea" TEXT,
    "destinationCity" TEXT NOT NULL,
    "destinationArea" TEXT,
    "requiredBy" TIMESTAMP(3) NOT NULL,
    "itemType" "ItemType" NOT NULL,
    "itemSize" "ItemSize" NOT NULL,
    "itemWeightKg" DECIMAL(5,2),
    "specialHandlingNotes" TEXT,
    "urgencyLevel" "UrgencyLevel" NOT NULL DEFAULT 'FLEXIBLE',
    "quotedBudget" INTEGER,
    "prohibitedItemConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "status" "ShipmentRequestStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ShipmentRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL,
    "travelerRouteId" TEXT NOT NULL,
    "shipmentRequestId" TEXT NOT NULL,
    "score" DECIMAL(5,2),
    "status" "MatchStatus" NOT NULL DEFAULT 'SUGGESTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "conversationType" "ConversationType" NOT NULL,
    "status" "ConversationStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdByUserId" TEXT NOT NULL,
    "listingInquiryId" TEXT,
    "matchId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversationParticipant" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastReadAt" TIMESTAMP(3),
    CONSTRAINT "ConversationParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderUserId" TEXT,
    "body" TEXT NOT NULL,
    "messageType" "MessageType" NOT NULL DEFAULT 'TEXT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "reportedByUserId" TEXT NOT NULL,
    "reviewedByUserId" TEXT,
    "entityType" "EntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "reason" "ReportReason" NOT NULL,
    "notes" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'OPEN',
    "reviewNotes" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParcelTrackingEvent" (
    "id" TEXT NOT NULL,
    "shipmentRequestId" TEXT NOT NULL,
    "matchId" TEXT,
    "eventType" "TrackingEventType" NOT NULL,
    "eventLabel" TEXT NOT NULL,
    "eventLocation" TEXT,
    "notes" TEXT,
    "source" TEXT,
    "eventTime" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ParcelTrackingEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_googleSub_key" ON "User"("googleSub");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- CreateIndex
CREATE INDEX "Organization_type_city_idx" ON "Organization"("type", "city");

-- CreateIndex
CREATE INDEX "UserOrganizationMembership_organizationId_status_idx" ON "UserOrganizationMembership"("organizationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "UserOrganizationMembership_userId_organizationId_key" ON "UserOrganizationMembership"("userId", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationProfile_userId_key" ON "VerificationProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AuthSession_sessionToken_key" ON "AuthSession"("sessionToken");

-- CreateIndex
CREATE INDEX "AuthSession_userId_expiresAt_idx" ON "AuthSession"("userId", "expiresAt");

-- CreateIndex
CREATE INDEX "WorkEmailOtp_userId_createdAt_idx" ON "WorkEmailOtp"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "WorkEmailOtp_workEmail_createdAt_idx" ON "WorkEmailOtp"("workEmail", "createdAt");

-- CreateIndex
CREATE INDEX "PhoneOtp_userId_createdAt_idx" ON "PhoneOtp"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "PhoneOtp_phone_createdAt_idx" ON "PhoneOtp"("phone", "createdAt");

-- CreateIndex
CREATE INDEX "Listing_organizationId_status_idx" ON "Listing"("organizationId", "status");

-- CreateIndex
CREATE INDEX "Listing_city_locality_status_idx" ON "Listing"("city", "locality", "status");

-- CreateIndex
CREATE INDEX "Listing_moveInDate_urgencyLevel_idx" ON "Listing"("moveInDate", "urgencyLevel");

-- CreateIndex
CREATE INDEX "Listing_type_status_idx" ON "Listing"("type", "status");

-- CreateIndex
CREATE INDEX "ListingNearby_listingId_createdAt_idx" ON "ListingNearby"("listingId", "createdAt");

-- CreateIndex
CREATE INDEX "ListingNearby_name_idx" ON "ListingNearby"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ListingNearby_listingId_name_key" ON "ListingNearby"("listingId", "name");

-- CreateIndex
CREATE INDEX "ListingImage_listingId_isCover_idx" ON "ListingImage"("listingId", "isCover");

-- CreateIndex
CREATE UNIQUE INDEX "ListingImage_listingId_sortOrder_key" ON "ListingImage"("listingId", "sortOrder");

-- CreateIndex
CREATE INDEX "HousingNeed_organizationId_status_idx" ON "HousingNeed"("organizationId", "status");

-- CreateIndex
CREATE INDEX "HousingNeed_city_locality_status_idx" ON "HousingNeed"("city", "locality", "status");

-- CreateIndex
CREATE INDEX "HousingNeed_moveInDate_urgencyLevel_idx" ON "HousingNeed"("moveInDate", "urgencyLevel");

-- CreateIndex
CREATE INDEX "HousingNeedNearby_housingNeedId_createdAt_idx" ON "HousingNeedNearby"("housingNeedId", "createdAt");

-- CreateIndex
CREATE INDEX "HousingNeedNearby_name_idx" ON "HousingNeedNearby"("name");

-- CreateIndex
CREATE UNIQUE INDEX "HousingNeedNearby_housingNeedId_name_key" ON "HousingNeedNearby"("housingNeedId", "name");

-- CreateIndex
CREATE INDEX "ListingInquiry_listingId_status_idx" ON "ListingInquiry"("listingId", "status");

-- CreateIndex
CREATE INDEX "ListingInquiry_requesterUserId_createdAt_idx" ON "ListingInquiry"("requesterUserId", "createdAt");

-- CreateIndex
CREATE INDEX "ListingInquiry_listingOwnerUserId_status_createdAt_idx" ON "ListingInquiry"("listingOwnerUserId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "TravelerRoute_organizationId_status_idx" ON "TravelerRoute"("organizationId", "status");

-- CreateIndex
CREATE INDEX "TravelerRoute_sourceCity_destinationCity_travelDate_status_idx" ON "TravelerRoute"("sourceCity", "destinationCity", "travelDate", "status");

-- CreateIndex
CREATE INDEX "ShipmentRequest_organizationId_status_idx" ON "ShipmentRequest"("organizationId", "status");

-- CreateIndex
CREATE INDEX "ShipmentRequest_sourceCity_destinationCity_requiredBy_statu_idx" ON "ShipmentRequest"("sourceCity", "destinationCity", "requiredBy", "status");

-- CreateIndex
CREATE INDEX "Match_status_createdAt_idx" ON "Match"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Match_travelerRouteId_shipmentRequestId_key" ON "Match"("travelerRouteId", "shipmentRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_listingInquiryId_key" ON "Conversation"("listingInquiryId");

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_matchId_key" ON "Conversation"("matchId");

-- CreateIndex
CREATE UNIQUE INDEX "ConversationParticipant_conversationId_userId_key" ON "ConversationParticipant"("conversationId", "userId");

-- CreateIndex
CREATE INDEX "Message_conversationId_createdAt_idx" ON "Message"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "Report_entityType_entityId_status_idx" ON "Report"("entityType", "entityId", "status");

-- CreateIndex
CREATE INDEX "ParcelTrackingEvent_shipmentRequestId_eventTime_idx" ON "ParcelTrackingEvent"("shipmentRequestId", "eventTime");

-- CreateIndex
CREATE INDEX "ParcelTrackingEvent_matchId_eventTime_idx" ON "ParcelTrackingEvent"("matchId", "eventTime");

-- AddForeignKey
ALTER TABLE "UserOrganizationMembership" ADD constraint "UserOrganizationMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserOrganizationMembership" ADD constraint "UserOrganizationMembership_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationProfile" ADD constraint "VerificationProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthSession" ADD constraint "AuthSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkEmailOtp" ADD constraint "WorkEmailOtp_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhoneOtp" ADD constraint "PhoneOtp_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD constraint "Listing_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD constraint "Listing_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingNearby" ADD constraint "ListingNearby_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingImage" ADD constraint "ListingImage_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HousingNeed" ADD constraint "HousingNeed_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HousingNeed" ADD constraint "HousingNeed_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HousingNeedNearby" ADD constraint "HousingNeedNearby_housingNeedId_fkey" FOREIGN KEY ("housingNeedId") REFERENCES "HousingNeed"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingInquiry" ADD constraint "ListingInquiry_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingInquiry" ADD constraint "ListingInquiry_requesterUserId_fkey" FOREIGN KEY ("requesterUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingInquiry" ADD constraint "ListingInquiry_listingOwnerUserId_fkey" FOREIGN KEY ("listingOwnerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TravelerRoute" ADD constraint "TravelerRoute_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TravelerRoute" ADD constraint "TravelerRoute_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShipmentRequest" ADD constraint "ShipmentRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShipmentRequest" ADD constraint "ShipmentRequest_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD constraint "Match_travelerRouteId_fkey" FOREIGN KEY ("travelerRouteId") REFERENCES "TravelerRoute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD constraint "Match_shipmentRequestId_fkey" FOREIGN KEY ("shipmentRequestId") REFERENCES "ShipmentRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD constraint "Conversation_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD constraint "Conversation_listingInquiryId_fkey" FOREIGN KEY ("listingInquiryId") REFERENCES "ListingInquiry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD constraint "Conversation_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationParticipant" ADD constraint "ConversationParticipant_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationParticipant" ADD constraint "ConversationParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD constraint "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD constraint "Message_senderUserId_fkey" FOREIGN KEY ("senderUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD constraint "Report_reportedByUserId_fkey" FOREIGN KEY ("reportedByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD constraint "Report_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParcelTrackingEvent" ADD constraint "ParcelTrackingEvent_shipmentRequestId_fkey" FOREIGN KEY ("shipmentRequestId") REFERENCES "ShipmentRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParcelTrackingEvent" ADD constraint "ParcelTrackingEvent_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE SET NULL ON UPDATE CASCADE;
