import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { LessonService } from './lesson.service';
import { Lesson } from '@prisma/client';
import {
  CreateLessonDto,
  LessonFilterType,
  LessonPaginationResponseType,
  UpdateLessonDto,
} from './dto/lesson.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { storageConfig } from 'helpers/config';
import { extname } from 'path';
import { Roles } from 'src/auth/decorator/roles.decorator';

@Controller('lessons')
export class LessonController {
  constructor(private lessonService: LessonService) {}
  @Put('multiple-restore')
  @Roles('Admin')
  multipleRestore(@Body() ids: number[]) {
    return this.lessonService.multipleRestore(ids);
  }
  @Put('restore/:id')
  @Roles('Admin')
  restore(@Param('id', ParseIntPipe) id: number) {
    return this.lessonService.restore(id);
  }
  @Delete('force-delete/:id')
  @Roles('Admin')
  forceDelete(@Param('id', ParseIntPipe) id: number) {
    return this.lessonService.forceDelete(id);
  }
  @Delete('multiple-force-delete')
  @Roles('Admin')
  multipleForceDelete(@Body() ids) {
    return this.lessonService.multipleForceDelete(ids);
  }
  @Delete('multiple-soft-delete')
  @Roles('Admin')
  multipleSoftDelete(@Body() ids) {
    return this.lessonService.multipleSoftDelete(ids);
  }
  @Delete(':id')
  @Roles('Admin')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.lessonService.delete(id);
  }
  @Get('trash')
  @Roles('Admin', 'User')
  trash(
    @Query() params: LessonFilterType,
  ): Promise<LessonPaginationResponseType> {
    return this.lessonService.trash(params);
  }
  @Get('all-lesson')
  @Roles('Admin', 'User')
  getAllLesson(
    @Query() params: LessonFilterType,
  ): Promise<LessonPaginationResponseType> {
    return this.lessonService.getAllLesson(params);
  }
  @Get()
  @Roles('Admin', 'User')
  getAll(
    @Query() params: LessonFilterType,
  ): Promise<LessonPaginationResponseType> {
    return this.lessonService.getAll(params);
  }
  @Get(':id')
  @Roles('Admin', 'User')
  getDetail(@Param('id', ParseIntPipe) id: number) {
    return this.lessonService.getDetail(id);
  }
  @Put(':id')
  @Roles('Admin')
  @UseInterceptors(
    FileInterceptor('videoFile', {
      storage: storageConfig('lesson'),
      fileFilter: (req, file, cb) => {
        const ext = extname(file.originalname);
        const allowedExtArr = ['.mov', '.MOV', '.mp4'];
        if (!allowedExtArr.includes(ext)) {
          req.fileValidationError = `Wrong extension type. Accepted file ext are: ${allowedExtArr.toString()}`;
          return cb(new BadRequestException(req.fileValidationError), false);
        } else {
          cb(null, true);
        }
      },
    }),
  )
  update(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
    @Body() data: UpdateLessonDto,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<Lesson> {
    if (req.fileValidationError) {
      throw new BadRequestException(req.fileValidationError);
    }
    if (file) {
      data.videoFile = 'lesson/' + file.filename;
    }
    return this.lessonService.update(id, data);
  }
  @Post('upload-video-from-client')
  @Roles('Admin')
  @UseInterceptors(
    FileInterceptor('videoFile', {
      storage: storageConfig('lesson'),
      fileFilter: (req, file, cb) => {
        const ext = extname(file.originalname);
        const allowedExtArr = ['.mov', '.mp4'];
        if (!allowedExtArr.includes(ext)) {
          req.fileValidationError = `Wrong extension type. Accepted file ext are: ${allowedExtArr.toString()}`;
          return cb(new BadRequestException(req.fileValidationError), false);
        } else {
          cb(null, true);
        }
      },
    }),
  )
  createUploadVideoFromClient(
    @Body() data: CreateLessonDto,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<Lesson> {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    console.log(data);
    return this.lessonService.create({
      ...data,
      videoFile: 'lesson/' + file.filename,
    });
  }
  @Post('link-video-youtube')
  @Roles('Admin')
  createByLinkVideoYoutube(@Body() data: CreateLessonDto): Promise<Lesson> {
    return this.lessonService.create({
      ...data,
    });
  }
}
