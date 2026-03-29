import { PartialType } from '@nestjs/swagger';

import { CreateShipmentRequestDto } from './create-shipment-request.dto';

export class UpdateShipmentRequestDto extends PartialType(CreateShipmentRequestDto) {}
