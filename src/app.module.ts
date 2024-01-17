import { MiddlewareConsumer, Module, RequestMethod, ValidationPipe } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { PrismaService } from './prisma.servcie';
import { APP_GUARD, APP_PIPE } from '@nestjs/core';
import { PostModule } from './post/post.module';
import { AuthGuard } from './auth/auth.guard';
import { ConfigModule } from '@nestjs/config';
import { LessonModule } from './lesson/lesson.module';
import { CourseModule } from './course/course.module';

@Module({
  imports: [AuthModule, UserModule, PostModule,ConfigModule.forRoot(), LessonModule, CourseModule],
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
