import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { PrismaService } from '../prisma/prisma.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @ApiOperation({
    summary: 'Liveness probe (no DB). Use for load balancers; path is /health (no /api prefix).',
  })
  @ApiOkResponse({ description: 'Backend service is running' })
  @Get()
  getHealth() {
    return {
      status: 'ok',
      service: 'trusted-network-backend',
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({
    summary: 'Readiness probe (checks database connectivity). Path is /health/ready.',
  })
  @ApiOkResponse({ description: 'Backend can serve traffic' })
  @Get('ready')
  async getReady() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'ready',
        service: 'trusted-network-backend',
        database: 'up',
        timestamp: new Date().toISOString(),
      };
    } catch {
      throw new ServiceUnavailableException({
        status: 'not_ready',
        service: 'trusted-network-backend',
        database: 'down',
        timestamp: new Date().toISOString(),
      });
    }
  }
}
