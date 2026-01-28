import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CreateTransactionUseCase } from '@/application/use-cases/create-transaction.usecase';
import { GetTransactionUseCase } from '@/application/use-cases/get-transaction.usecase';
import { PayTransactionUseCase } from '@/application/use-cases/pay-transaction.usecase';
import { CreateTransactionDto } from '@/presentation/dto/create-transaction.dto';
import { PayTransactionDto } from '@/presentation/dto/pay-transaction.dto';
import { mapErrorToHttp } from '@/presentation/http/error-mapper';

@ApiTags('transactions')
@Controller('transactions')
export class TransactionController {
  constructor(
    private readonly createTransaction: CreateTransactionUseCase,
    private readonly payTransaction: PayTransactionUseCase,
    private readonly getTransaction: GetTransactionUseCase,
  ) {}

  @Post()
  @ApiCreatedResponse({ description: 'Create pending transaction' })
  async create(@Body() body: CreateTransactionDto) {
    const result = await this.createTransaction.execute({
      productId: body.productId,
      amount: body.amount,
      currency: body.currency,
      customer: body.customer,
      delivery: body.delivery,
    });
    return result.ok ? result.value : mapErrorToHttp(result.error);
  }

  @Post(':id/pay')
  @ApiOkResponse({ description: 'Pay transaction' })
  async pay(@Param('id') id: string, @Body() body: PayTransactionDto) {
    const result = await this.payTransaction.execute({
      transactionId: id,
      card: {
        number: body.cardNumber,
        expMonth: body.expMonth,
        expYear: body.expYear,
        cvc: body.cvc,
        holderName: body.holderName,
      },
    });
    return result.ok ? result.value : mapErrorToHttp(result.error);
  }

  @Get(':id')
  @ApiOkResponse({ description: 'Get transaction by id' })
  async get(@Param('id') id: string) {
    const result = await this.getTransaction.execute(id);
    return result.ok ? result.value : mapErrorToHttp(result.error);
  }
}
