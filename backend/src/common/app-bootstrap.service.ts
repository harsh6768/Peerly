import { Injectable, Logger } from '@nestjs/common';
import {
  AssetProvider,
  CapacityType,
  ContactMode,
  HousingNeedStatus,
  ItemSize,
  ItemType,
  ListingStatus,
  ListingType,
  OccupancyType,
  OrganizationType,
  ShipmentRequestStatus,
  TravelerRouteStatus,
  UrgencyLevel,
  VerificationBadge,
  VerificationStatus,
  VerificationType,
} from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AppBootstrapService {
  private readonly logger = new Logger(AppBootstrapService.name);

  constructor(private readonly prisma: PrismaService) {}

  // async onModuleInit() {
  //   const userCount = await this.prisma.user.count();
  //   if (userCount > 0) {
  //     return;
  //   }

  //   const organization = await this.prisma.organization.create({
  //     data: {
  //       name: 'Trusted Network Bangalore',
  //       slug: 'trusted-network-bangalore',
  //       type: OrganizationType.NETWORK,
  //       city: 'Bengaluru',
  //       isVerifiedNetwork: true,
  //     },
  //   });

  //   const [harsh, ayaan, riya] = await Promise.all([
  //     this.prisma.user.create({
  //       data: {
  //         fullName: 'Harsh Patel',
  //         email: 'harsh@trustednetwork.app',
  //         isVerified: true,
  //         verificationType: VerificationType.WORK_EMAIL,
  //         verificationStatus: VerificationStatus.APPROVED,
  //         workEmail: 'harsh@trustednetwork.app',
  //         companyName: 'Trustednetwork',
  //         linkedinUrl: 'https://www.linkedin.com/in/harsh-patel-trusted-network',
  //         homeCity: 'Bengaluru',
  //         bio: 'Building a trusted network for urgent everyday problems.',
  //       },
  //     }),
  //     this.prisma.user.create({
  //       data: {
  //         fullName: 'Ayaan Mehra',
  //         email: 'ayaan@trustednetwork.app',
  //         isVerified: true,
  //         verificationType: VerificationType.WORK_EMAIL,
  //         verificationStatus: VerificationStatus.APPROVED,
  //         workEmail: 'ayaan@trustednetwork.app',
  //         companyName: 'Trustednetwork',
  //         homeCity: 'Bengaluru',
  //         bio: 'Looking for reliable flat and room options near tech parks.',
  //       },
  //     }),
  //     this.prisma.user.create({
  //       data: {
  //         fullName: 'Riya Sharma',
  //         email: 'riya@trustednetwork.app',
  //         verificationType: VerificationType.LINKEDIN,
  //         verificationStatus: VerificationStatus.PENDING,
  //         linkedinUrl: 'https://www.linkedin.com/in/riya-sharma-trusted-network',
  //         homeCity: 'Delhi',
  //         bio: 'Frequent traveler between Delhi and Bengaluru who can help with small deliveries.',
  //       },
  //     }),
  //   ]);

  //   await this.prisma.userOrganizationMembership.createMany({
  //     data: [
  //       { userId: harsh.id, organizationId: organization.id, status: 'ACTIVE', role: 'ADMIN' },
  //       { userId: ayaan.id, organizationId: organization.id, status: 'ACTIVE', role: 'MEMBER' },
  //       { userId: riya.id, organizationId: organization.id, status: 'ACTIVE', role: 'MEMBER' },
  //     ],
  //   });

  //   await this.prisma.verificationProfile.createMany({
  //     data: [
  //       {
  //         userId: harsh.id,
  //         companyEmailVerified: true,
  //         linkedinVerified: true,
  //         verificationBadge: VerificationBadge.COMPANY_VERIFIED,
  //         trustScore: 92,
  //         lastVerifiedAt: new Date(),
  //       },
  //       {
  //         userId: ayaan.id,
  //         companyEmailVerified: true,
  //         verificationBadge: VerificationBadge.EMAIL_VERIFIED,
  //         trustScore: 78,
  //         lastVerifiedAt: new Date(),
  //       },
  //       {
  //         userId: riya.id,
  //         companyEmailVerified: true,
  //         verificationBadge: VerificationBadge.EMAIL_VERIFIED,
  //         trustScore: 84,
  //         lastVerifiedAt: new Date(),
  //       },
  //     ],
  //   });

  //   await this.prisma.listing.create({
  //     data: {
  //       ownerUserId: harsh.id,
  //       organizationId: organization.id,
  //       type: ListingType.tenant_replacement,
  //       title: 'Replacement tenant needed for furnished 2BHK in HSR Layout',
  //       description:
  //         'Looking for a replacement tenant for a semi-furnished 2BHK near HSR Layout Sector 2. Ideal for two working professionals. Immediate move-in preferred.',
  //       city: 'Bengaluru',
  //       locality: 'HSR Layout',
  //       locationName: 'HSR Layout Sector 2, Bengaluru, Karnataka, India',
  //       latitude: 12.9116,
  //       longitude: 77.6474,
  //       contactPhone: '+919876543210',
  //       rentAmount: 36000,
  //       depositAmount: 120000,
  //       propertyType: 'APARTMENT',
  //       occupancyType: 'SHARED',
  //       moveInDate: new Date('2026-04-05T00:00:00.000Z'),
  //       moveOutDate: new Date('2026-04-02T00:00:00.000Z'),
  //       urgencyLevel: UrgencyLevel.IMMEDIATE,
  //       contactMode: ContactMode.WHATSAPP,
  //       status: ListingStatus.PUBLISHED,
  //       isBoosted: true,
  //       brokerAllowed: false,
  //       nearbyPlaces: {
  //         create: [
  //           { name: 'Ecospace', type: 'tech_park' },
  //           { name: 'Google', type: 'company' },
  //         ],
  //       },
  //       images: {
  //         create: [
  //           {
  //             assetProvider: AssetProvider.CLOUDINARY,
  //             providerAssetId: 'seed/listings/tenant-1-cover',
  //             imageUrl:
  //               'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
  //             thumbnailUrl:
  //               'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=400&q=80',
  //             detailUrl:
  //               'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
  //             sortOrder: 0,
  //             isCover: true,
  //           },
  //           {
  //             assetProvider: AssetProvider.CLOUDINARY,
  //             providerAssetId: 'seed/listings/tenant-1-bedroom',
  //             imageUrl:
  //               'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80',
  //             thumbnailUrl:
  //               'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=400&q=80',
  //             detailUrl:
  //               'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80',
  //             sortOrder: 1,
  //             isCover: false,
  //           },
  //         ],
  //       },
  //     },
  //   });

  //   await this.prisma.listing.create({
  //     data: {
  //       ownerUserId: ayaan.id,
  //       organizationId: organization.id,
  //       type: ListingType.send_request,
  //       title: 'Need to send signed documents from Delhi to Bengaluru',
  //       description:
  //         'Looking for a trusted traveler to hand-carry a small envelope with signed documents this week.',
  //       fromCity: 'Delhi',
  //       toCity: 'Bengaluru',
  //       itemType: ItemType.DOCUMENTS,
  //       requiredDate: new Date('2026-04-12T00:00:00.000Z'),
  //       urgencyLevel: UrgencyLevel.THIS_WEEK,
  //       contactMode: ContactMode.WHATSAPP,
  //       contactPhone: '+919812345678',
  //       status: ListingStatus.PUBLISHED,
  //       isBoosted: false,
  //       brokerAllowed: false,
  //       images: {
  //         create: [
  //           {
  //             assetProvider: AssetProvider.CLOUDINARY,
  //             providerAssetId: 'seed/listings/send-request-documents',
  //             imageUrl:
  //               'https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=1200&q=80',
  //             thumbnailUrl:
  //               'https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=400&q=80',
  //             detailUrl:
  //               'https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=1200&q=80',
  //             sortOrder: 0,
  //             isCover: true,
  //           },
  //         ],
  //       },
  //     },
  //   });

  //   await this.prisma.housingNeed.create({
  //     data: {
  //       userId: ayaan.id,
  //       organizationId: organization.id,
  //       city: 'Bengaluru',
  //       locality: 'Koramangala',
  //       preferredPropertyType: 'APARTMENT',
  //       preferredOccupancy: OccupancyType.SHARED,
  //       maxRentAmount: 28000,
  //       moveInDate: new Date('2026-04-10T00:00:00.000Z'),
  //       urgencyLevel: UrgencyLevel.THIS_WEEK,
  //       preferredContactMode: ContactMode.WHATSAPP,
  //       notes:
  //         'Searching for either a full 2BHK flat or a room in an existing 2BHK flat, ideally close to Koramangala or HSR.',
  //       status: HousingNeedStatus.OPEN,
  //     },
  //   });

  //   await this.prisma.travelerRoute.createMany({
  //     data: [
  //       {
  //         userId: riya.id,
  //         organizationId: organization.id,
  //         sourceCity: 'Bengaluru',
  //         sourceArea: 'Indiranagar',
  //         destinationCity: 'Delhi',
  //         destinationArea: 'South Delhi',
  //         travelDate: new Date('2026-04-08T00:00:00.000Z'),
  //         travelTimeWindow: 'Evening flight',
  //         capacityType: CapacityType.SMALL_BAG,
  //         capacityNotes: 'Can carry documents, small electronics, and lightweight essentials.',
  //         allowedItemTypes: [ItemType.DOCUMENTS, ItemType.ELECTRONICS, ItemType.CLOTHING],
  //         status: TravelerRouteStatus.PUBLISHED,
  //       },
  //       {
  //         userId: riya.id,
  //         organizationId: organization.id,
  //         sourceCity: 'Delhi',
  //         sourceArea: 'Gurgaon',
  //         destinationCity: 'Bengaluru',
  //         destinationArea: 'Bellandur',
  //         travelDate: new Date('2026-04-15T00:00:00.000Z'),
  //         travelTimeWindow: 'Morning flight',
  //         capacityType: CapacityType.DOCUMENTS_ONLY,
  //         capacityNotes: 'Best suited for document handoff or thin envelopes.',
  //         allowedItemTypes: [ItemType.DOCUMENTS],
  //         status: TravelerRouteStatus.PUBLISHED,
  //       },
  //     ],
  //   });

  //   await this.prisma.shipmentRequest.createMany({
  //     data: [
  //       {
  //         userId: harsh.id,
  //         organizationId: organization.id,
  //         sourceCity: 'Bengaluru',
  //         sourceArea: 'Whitefield',
  //         destinationCity: 'Delhi',
  //         destinationArea: 'Dwarka',
  //         requiredBy: new Date('2026-04-09T00:00:00.000Z'),
  //         itemType: ItemType.ELECTRONICS,
  //         itemSize: ItemSize.SMALL,
  //         itemWeightKg: 1.25,
  //         specialHandlingNotes: 'Need to send a small laptop accessory box safely.',
  //         urgencyLevel: UrgencyLevel.THIS_WEEK,
  //         quotedBudget: 1200,
  //         prohibitedItemConfirmed: true,
  //         status: ShipmentRequestStatus.OPEN,
  //       },
  //       {
  //         userId: ayaan.id,
  //         organizationId: organization.id,
  //         sourceCity: 'Delhi',
  //         sourceArea: 'Nehru Place',
  //         destinationCity: 'Bengaluru',
  //         destinationArea: 'Koramangala',
  //         requiredBy: new Date('2026-04-16T00:00:00.000Z'),
  //         itemType: ItemType.DOCUMENTS,
  //         itemSize: ItemSize.SMALL,
  //         itemWeightKg: 0.35,
  //         specialHandlingNotes: 'Looking for help bringing signed documents from Delhi to Bengaluru.',
  //         urgencyLevel: UrgencyLevel.THIS_WEEK,
  //         quotedBudget: 600,
  //         prohibitedItemConfirmed: true,
  //         status: ShipmentRequestStatus.OPEN,
  //       },
  //     ],
  //   });

  //   this.logger.log('Seeded local Trusted Network demo data.');
  // }
}
