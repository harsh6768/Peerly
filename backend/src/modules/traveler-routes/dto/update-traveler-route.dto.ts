import { PartialType } from '@nestjs/swagger';

import { CreateTravelerRouteDto } from './create-traveler-route.dto';

export class UpdateTravelerRouteDto extends PartialType(CreateTravelerRouteDto) {}
