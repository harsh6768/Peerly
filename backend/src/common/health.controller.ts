import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
  @ApiOperation({ summary: 'Check backend health' })
  @ApiOkResponse({ description: 'Backend service is running' })
  @Get()
  getHealth() {
    return {
      status: 'ok',
      service: 'trusted-network-backend',
      timestamp: new Date().toISOString(),
    };
  }
}
