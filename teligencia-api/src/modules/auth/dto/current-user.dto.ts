/*
 * Response DTO for GET /auth/me.
 * Whitelist exactly the 5 fields from contracts/auth-me.openapi.yaml.
 * class-transformer's `excludeExtraneousValues: true` strips anything else
 * (Security Checklist #7).
 */

import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { STAFF_ROLES, StaffRole } from '../../../common/types/staff-role';

export class CurrentUserDto {
  @Expose()
  @ApiProperty({ example: 'user_2abcDEFghijKLMnopQRstuVWxyz' })
  id!: string;

  @Expose()
  @ApiProperty({ example: 'lea.hoffmann@teligencia.example' })
  email!: string;

  @Expose()
  @ApiProperty({ nullable: true, example: 'Lea Hoffmann' })
  fullName!: string | null;

  @Expose()
  @ApiProperty({ enum: STAFF_ROLES })
  role!: StaffRole;

  @Expose()
  @ApiProperty({ format: 'uuid' })
  orgId!: string;
}
