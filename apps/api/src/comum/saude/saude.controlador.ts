import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { PrismaService } from '../prisma/prisma.service';

@ApiTags('saude')
@Controller('saude')
export class SaudeController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async checar() {
    const inicio = Date.now();
    await this.prisma.$queryRaw`SELECT 1`;
    return {
      status: 'ok',
      versao: '0.1.0',
      latenciaDbMs: Date.now() - inicio,
      timestamp: new Date().toISOString(),
    };
  }
}
