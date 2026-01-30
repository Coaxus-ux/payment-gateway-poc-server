import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ListAdminTransactionsUseCase } from '@/application/use-cases/list-admin-transactions.usecase';
import { mapErrorToHttp } from '@/presentation/http/error-mapper';

@ApiTags('admin')
@Controller('admin')
export class AdminController {
  constructor(
    private readonly listAdminTransactions: ListAdminTransactionsUseCase,
  ) {}

  @Get('transactions')
  @ApiOkResponse({ description: 'List transactions for admin panel' })
  async listTransactions(
    @Query('email') email?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const result = await this.listAdminTransactions.execute({
      adminEmail: email,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });
    return result.ok ? result.value : mapErrorToHttp(result.error);
  }
}
