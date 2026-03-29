-- Generated from prisma/schema.prisma
-- PostgreSQL schema for the Trusted Network backend
-- Note: `updatedAt` columns do not have a database default because Prisma manages them.

CREATE SCHEMA IF NOT EXISTS "public";

CREATE TYPE "OrganizationType" AS ENUM ('COMPANY', 'COMMUNITY', 'GATED_COMMUNITY', 'NETWORK', 'OTHER');
CREATE TYPE "MembershipRole" AS ENUM ('MEMBER', 'ADMIN', 'MODERATOR');
CREATE TYPE "MembershipStatus" AS ENUM ('INVITED', 'ACTIVE', 'INACTIVE', 'BLOCKED');
CREATE TYPE "VerificationBadge" AS ENUM ('NONE', 'EMAIL_VERIFIED', 'LINKEDIN_VERIFIED', 'COMPANY_VERIFIED', 'MANUALLY_VERIFIED');
CREATE TYPE "AuthProvider" AS ENUM ('GOOGLE');
CREATE TYPE "VerificationType" AS ENUM ('WORK_EMAIL', 'LINKEDIN');
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "UrgencyLevel" AS ENUM ('IMMEDIATE', 'THIS_WEEK', 'FLEXIBLE');
CREATE TYPE "ContactMode" AS ENUM ('WHATSAPP', 'CALL', 'CHAT');
CREATE TYPE "ListingStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'PAUSED', 'ARCHIVED', 'FILLED');
CREATE TYPE "PropertyType" AS ENUM ('ROOM', 'STUDIO', 'APARTMENT', 'PG', 'HOUSE');
CREATE TYPE "OccupancyType" AS ENUM ('SINGLE', 'DOUBLE', 'SHARED');
CREATE TYPE "ListingInquiryStatus" AS ENUM ('NEW', 'CONTACTED', 'SCHEDULED', 'CLOSED', 'DECLINED');
CREATE TYPE "HousingNeedStatus" AS ENUM ('OPEN', 'MATCHED', 'CLOSED', 'ARCHIVED');
CREATE TYPE "TravelerRouteStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'MATCHED', 'COMPLETED', 'CANCELLED', 'ARCHIVED');
CREATE TYPE "CapacityType" AS ENUM ('DOCUMENTS_ONLY', 'SMALL_BAG', 'CABIN_LUGGAGE', 'CHECK_IN_LUGGAGE');
CREATE TYPE "ShipmentRequestStatus" AS ENUM ('DRAFT', 'OPEN', 'MATCHED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED', 'EXPIRED');
CREATE TYPE "ItemType" AS ENUM ('DOCUMENTS', 'ELECTRONICS', 'CLOTHING', 'FOOD', 'MEDICINE', 'OTHER');
CREATE TYPE "ItemSize" AS ENUM ('SMALL', 'MEDIUM', 'LARGE');
CREATE TYPE "MatchStatus" AS ENUM ('SUGGESTED', 'CONTACTED', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'COMPLETED', 'CANCELLED');
CREATE TYPE "ConversationType" AS ENUM ('LISTING', 'SHIPMENT', 'SUPPORT');
CREATE TYPE "ConversationStatus" AS ENUM ('ACTIVE', 'CLOSED', 'BLOCKED');
CREATE TYPE "MessageType" AS ENUM ('TEXT', 'SYSTEM');
CREATE TYPE "EntityType" AS ENUM ('USER', 'LISTING', 'LISTING_INQUIRY', 'TRAVELER_ROUTE', 'SHIPMENT_REQUEST', 'MATCH', 'CONVERSATION', 'MESSAGE');
CREATE TYPE "ReportStatus" AS ENUM ('OPEN', 'REVIEWED', 'ACTIONED', 'DISMISSED');
CREATE TYPE "ReportReason" AS ENUM ('SPAM', 'FAKE_LISTING', 'HARASSMENT', 'PROHIBITED_ITEM', 'OTHER');
CREATE TYPE "TrackingEventType" AS ENUM ('MATCHED', 'PICKUP_CONFIRMED', 'IN_TRANSIT', 'ARRIVED_HANDOFF', 'DELIVERED', 'ISSUE_REPORTED');

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
    "verificationStatus" "VerificationStatus",
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

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

CREATE TABLE "UserOrganizationMembership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "role" "MembershipRole" NOT NULL DEFAULT 'MEMBER',
    "status" "MembershipStatus" NOT NULL DEFAULT 'ACTIVE',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserOrganizationMembership_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VerificationProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "linkedinVerified" BOOLEAN NOT NULL DEFAULT false,
    "governmentIdVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationBadge" "VerificationBadge" NOT NULL DEFAULT 'NONE',
    "trustScore" INTEGER NOT NULL DEFAULT 0,
    "lastVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "VerificationProfile_pkey" PRIMARY KEY ("id")
);

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

CREATE TABLE "Listing" (
    "id" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "organizationId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "locality" TEXT NOT NULL,
    "rentAmount" INTEGER NOT NULL,
    "depositAmount" INTEGER,
    "propertyType" "PropertyType" NOT NULL,
    "occupancyType" "OccupancyType" NOT NULL,
    "moveInDate" TIMESTAMP(3) NOT NULL,
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

CREATE TABLE "ListingImage" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ListingImage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HousingNeed" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT,
    "city" TEXT NOT NULL,
    "locality" TEXT,
    "preferredPropertyType" "PropertyType" NOT NULL,
    "preferredOccupancy" "OccupancyType" NOT NULL,
    "maxRentAmount" INTEGER,
    "moveInDate" TIMESTAMP(3) NOT NULL,
    "urgencyLevel" "UrgencyLevel" NOT NULL DEFAULT 'FLEXIBLE',
    "preferredContactMode" "ContactMode" NOT NULL DEFAULT 'WHATSAPP',
    "notes" TEXT,
    "status" "HousingNeedStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "HousingNeed_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ListingInquiry" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "requesterUserId" TEXT NOT NULL,
    "listingOwnerUserId" TEXT NOT NULL,
    "message" TEXT,
    "status" "ListingInquiryStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ListingInquiry_pkey" PRIMARY KEY ("id")
);

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

CREATE TABLE "ConversationParticipant" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastReadAt" TIMESTAMP(3),
    CONSTRAINT "ConversationParticipant_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderUserId" TEXT,
    "body" TEXT NOT NULL,
    "messageType" "MessageType" NOT NULL DEFAULT 'TEXT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "reportedByUserId" TEXT NOT NULL,
    "entityType" "EntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "reason" "ReportReason" NOT NULL,
    "notes" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

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

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_googleSub_key" ON "User"("googleSub");
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");
CREATE INDEX "Organization_type_city_idx" ON "Organization"("type", "city");
CREATE INDEX "UserOrganizationMembership_organizationId_status_idx" ON "UserOrganizationMembership"("organizationId", "status");
CREATE UNIQUE INDEX "UserOrganizationMembership_userId_organizationId_key" ON "UserOrganizationMembership"("userId", "organizationId");
CREATE UNIQUE INDEX "VerificationProfile_userId_key" ON "VerificationProfile"("userId");
CREATE UNIQUE INDEX "AuthSession_sessionToken_key" ON "AuthSession"("sessionToken");
CREATE INDEX "AuthSession_userId_expiresAt_idx" ON "AuthSession"("userId", "expiresAt");
CREATE INDEX "WorkEmailOtp_userId_createdAt_idx" ON "WorkEmailOtp"("userId", "createdAt");
CREATE INDEX "WorkEmailOtp_workEmail_createdAt_idx" ON "WorkEmailOtp"("workEmail", "createdAt");
CREATE INDEX "Listing_organizationId_status_idx" ON "Listing"("organizationId", "status");
CREATE INDEX "Listing_city_locality_status_idx" ON "Listing"("city", "locality", "status");
CREATE INDEX "Listing_moveInDate_urgencyLevel_idx" ON "Listing"("moveInDate", "urgencyLevel");
CREATE UNIQUE INDEX "ListingImage_listingId_sortOrder_key" ON "ListingImage"("listingId", "sortOrder");
CREATE INDEX "HousingNeed_organizationId_status_idx" ON "HousingNeed"("organizationId", "status");
CREATE INDEX "HousingNeed_city_locality_status_idx" ON "HousingNeed"("city", "locality", "status");
CREATE INDEX "HousingNeed_moveInDate_urgencyLevel_idx" ON "HousingNeed"("moveInDate", "urgencyLevel");
CREATE INDEX "ListingInquiry_listingId_status_idx" ON "ListingInquiry"("listingId", "status");
CREATE INDEX "ListingInquiry_requesterUserId_createdAt_idx" ON "ListingInquiry"("requesterUserId", "createdAt");
CREATE INDEX "TravelerRoute_organizationId_status_idx" ON "TravelerRoute"("organizationId", "status");
CREATE INDEX "TravelerRoute_sourceCity_destinationCity_travelDate_status_idx" ON "TravelerRoute"("sourceCity", "destinationCity", "travelDate", "status");
CREATE INDEX "ShipmentRequest_organizationId_status_idx" ON "ShipmentRequest"("organizationId", "status");
CREATE INDEX "ShipmentRequest_sourceCity_destinationCity_requiredBy_statu_idx" ON "ShipmentRequest"("sourceCity", "destinationCity", "requiredBy", "status");
CREATE INDEX "Match_status_createdAt_idx" ON "Match"("status", "createdAt");
CREATE UNIQUE INDEX "Match_travelerRouteId_shipmentRequestId_key" ON "Match"("travelerRouteId", "shipmentRequestId");
CREATE UNIQUE INDEX "Conversation_listingInquiryId_key" ON "Conversation"("listingInquiryId");
CREATE UNIQUE INDEX "Conversation_matchId_key" ON "Conversation"("matchId");
CREATE UNIQUE INDEX "ConversationParticipant_conversationId_userId_key" ON "ConversationParticipant"("conversationId", "userId");
CREATE INDEX "Message_conversationId_createdAt_idx" ON "Message"("conversationId", "createdAt");
CREATE INDEX "Report_entityType_entityId_status_idx" ON "Report"("entityType", "entityId", "status");
CREATE INDEX "ParcelTrackingEvent_shipmentRequestId_eventTime_idx" ON "ParcelTrackingEvent"("shipmentRequestId", "eventTime");
CREATE INDEX "ParcelTrackingEvent_matchId_eventTime_idx" ON "ParcelTrackingEvent"("matchId", "eventTime");

ALTER TABLE "UserOrganizationMembership" ADD CONSTRAINT "UserOrganizationMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserOrganizationMembership" ADD CONSTRAINT "UserOrganizationMembership_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VerificationProfile" ADD CONSTRAINT "VerificationProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuthSession" ADD CONSTRAINT "AuthSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkEmailOtp" ADD CONSTRAINT "WorkEmailOtp_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ListingImage" ADD CONSTRAINT "ListingImage_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HousingNeed" ADD CONSTRAINT "HousingNeed_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HousingNeed" ADD CONSTRAINT "HousingNeed_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ListingInquiry" ADD CONSTRAINT "ListingInquiry_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ListingInquiry" ADD CONSTRAINT "ListingInquiry_requesterUserId_fkey" FOREIGN KEY ("requesterUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ListingInquiry" ADD CONSTRAINT "ListingInquiry_listingOwnerUserId_fkey" FOREIGN KEY ("listingOwnerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TravelerRoute" ADD CONSTRAINT "TravelerRoute_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TravelerRoute" ADD CONSTRAINT "TravelerRoute_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ShipmentRequest" ADD CONSTRAINT "ShipmentRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ShipmentRequest" ADD CONSTRAINT "ShipmentRequest_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Match" ADD CONSTRAINT "Match_travelerRouteId_fkey" FOREIGN KEY ("travelerRouteId") REFERENCES "TravelerRoute"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Match" ADD CONSTRAINT "Match_shipmentRequestId_fkey" FOREIGN KEY ("shipmentRequestId") REFERENCES "ShipmentRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_listingInquiryId_fkey" FOREIGN KEY ("listingInquiryId") REFERENCES "ListingInquiry"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ConversationParticipant" ADD CONSTRAINT "ConversationParticipant_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ConversationParticipant" ADD CONSTRAINT "ConversationParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderUserId_fkey" FOREIGN KEY ("senderUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Report" ADD CONSTRAINT "Report_reportedByUserId_fkey" FOREIGN KEY ("reportedByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ParcelTrackingEvent" ADD CONSTRAINT "ParcelTrackingEvent_shipmentRequestId_fkey" FOREIGN KEY ("shipmentRequestId") REFERENCES "ShipmentRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ParcelTrackingEvent" ADD CONSTRAINT "ParcelTrackingEvent_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE SET NULL ON UPDATE CASCADE;
