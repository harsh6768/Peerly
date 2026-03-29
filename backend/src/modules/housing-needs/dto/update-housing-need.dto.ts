import { PartialType } from '@nestjs/swagger';

import { CreateHousingNeedDto } from './create-housing-need.dto';

export class UpdateHousingNeedDto extends PartialType(CreateHousingNeedDto) {}
