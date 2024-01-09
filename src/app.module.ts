import { MiddlewareConsumer, Module, RequestMethod, ValidationPipe } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { PrismaService } from './prisma.servcie';
import { APP_PIPE } from '@nestjs/core';

@Module({
  imports: [AuthModule, UserModule],
  controllers: [AppController],
  providers: [AppService,
    {
      provide:APP_PIPE,
      useClass: ValidationPipe,
    },
    PrismaService],
})
export class AppModule {

}
