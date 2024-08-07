import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import {
  CreateUserDto,
  SoftDeleteUserDto,
  UpdateUserDto,
  UpdateUserPassword,
  UploadAvatarResult,
  UserFilterType,
  UserPaginationResponseType,
  softMultipleDeleteUserDto,
} from './dto/user.dto';
import * as bcrypt from 'bcrypt';
@Injectable()
export class UserService {
  constructor(private prismaService: PrismaService) {}
  async create(body: CreateUserDto): Promise<User> {
    // step 1: checking email has already exist
    const user = await this.prismaService.user.findUnique({
      where: {
        email: body.email,
        status: 1,
      },
    });
    if (user) {
      throw new HttpException(
        { message: 'This email has been used' },
        HttpStatus.BAD_REQUEST,
      );
    }
    // step 2: hash password and store to db
    const hashPassword = await bcrypt.hash(body.password, 10);
    console.log(body);
    const result = await this.prismaService.user.create({
      data: { ...body, password: hashPassword },
    });
    return result;
  }
  async getAll(filters: UserFilterType): Promise<UserPaginationResponseType> {
    let items_per_page;
    const page = Number(filters.page) || 1;
    const search = filters.search || '';
    const total = await this.prismaService.user.count({
      where: {
        OR: [
          {
            username: {
              contains: search,
            },
          },
          {
            email: {
              contains: search,
            },
          },
        ],
        AND: [
          {
            status: 1,
          },
        ],
      },
    });
    if (filters.items_per_page !== 'all') {
      items_per_page = Number(filters.items_per_page) || 10;
    } else {
      items_per_page = total;
    }
    const skip = page > 1 ? (page - 1) * items_per_page : 0;
    const users = await this.prismaService.user.findMany({
      take: items_per_page,
      skip,
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        createdAt: true,
      },
      where: {
        OR: [
          {
            username: {
              contains: search,
            },
          },
          {
            email: {
              contains: search,
            },
          },
        ],
        AND: [
          {
            status: 1,
          },
        ],
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const lastPage = Math.ceil(total / items_per_page);
    const nextPage = page + 1 > lastPage ? null : page + 1;
    const previousPage = page - 1 < 1 ? null : page - 1;
    return {
      data: users,
      total,
      lastPage,
      nextPage,
      previousPage,
      currentPage: page,
      itemsPerPage: items_per_page,
    };
  }
  async trash(filters: UserFilterType): Promise<UserPaginationResponseType> {
    let items_per_page;
    const page = Number(filters.page) || 1;
    const search = filters.search || '';
    const total = await this.prismaService.user.count({
      where: {
        OR: [
          {
            username: {
              contains: search,
            },
          },
          {
            email: {
              contains: search,
            },
          },
        ],
        AND: [
          {
            status: 1,
          },
        ],
      },
    });
    if (filters.items_per_page !== 'all') {
      items_per_page = Number(filters.items_per_page) || 10;
    } else {
      items_per_page = total;
    }
    const skip = page > 1 ? (page - 1) * items_per_page : 0;
    const users = await this.prismaService.user.findMany({
      take: items_per_page,
      skip,
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        createdAt: true,
      },
      where: {
        OR: [
          {
            username: {
              contains: search,
            },
          },
          {
            email: {
              contains: search,
            },
          },
        ],
        AND: [
          {
            status: 0,
          },
        ],
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const lastPage = Math.ceil(total / items_per_page);
    const nextPage = page + 1 > lastPage ? null : page + 1;
    const previousPage = page - 1 < 1 ? null : page - 1;
    return {
      data: users,
      total,
      lastPage,
      nextPage,
      previousPage,
      currentPage: page,
      itemsPerPage: items_per_page,
    };
  }
  async getDetail(id: number) {
    return this.prismaService.user.findUnique({
      where: {
        id,
        status: 1,
      },
      select: {
        id: true,
        fullname: true,
        username: true,
        email: true,
        roles: true,
        avatar: true,
        createdAt: true,
      },
    });
  }
  async getProfile(username: string) {
    return await this.prismaService.user.findUnique({
      where: {
        username,
        status: 1,
      },
      select: {
        id: true,
        fullname: true,
        username: true,
        email: true,
        avatar: true,
        createdAt: true,
      },
    });
  }
  async updatePassword(id: number, data: UpdateUserPassword): Promise<User> {
    const user = await this.prismaService.user.findUnique({ where: { id } });
    const verify = await bcrypt.compareSync(data.oldPassword, user.password);
    if (!verify)
      throw new HttpException(
        'Mật khẩu cũ không đúng!',
        HttpStatus.BAD_REQUEST,
      );
    else {
      const hashPassword = await bcrypt.hash(data.newPassword, 10);
      return await this.prismaService.user.update({
        where: { id },
        data: { password: hashPassword },
      });
    }
  }
  async update(id: number, data: UpdateUserDto): Promise<any> {
    if (data.username) {
      const user = await this.prismaService.user.findUnique({
        where: { username: data.username },
      });
      if (user && user.id !== id) {
        throw new HttpException(
          'Tên người dùng đã tồn tại, vui lòng chọn một tên người dùng khác!',
          HttpStatus.BAD_REQUEST,
        );
      }
    }
    await this.prismaService.user.update({
      where: { id },
      data,
    });
  }
  async forceDelete(id: number): Promise<SoftDeleteUserDto> {
    return await this.prismaService.user.delete({
      where: { id },
    });
  }
  async deleteById(id: number): Promise<SoftDeleteUserDto> {
    console.log('delete id: ', id);
    return await this.prismaService.user.update({
      where: { id },
      data: {
        status: 0,
        deletedAt: new Date(),
      },
    });
  }
  async restoreUser(id: number) {
    return await this.prismaService.user.update({
      where: { id },
      data: {
        status: 1,
        deletedAt: null,
      },
    });
  }
  async softDeleteMultiple(ids) {
    return await this.prismaService.user.updateMany({
      where: { id: { in: ids }, status: 1 },
      data: {
        status: 0,
        deletedAt: new Date(),
      },
    });
  }
  async multipleRestore(ids) {
    return await this.prismaService.user.updateMany({
      where: { id: { in: ids }, status: 0 },
      data: {
        status: 1,
        deletedAt: null,
      },
    });
  }
  async multipleForceDelete(ids) {
    return await this.prismaService.user.deleteMany({
      where: { id: { in: ids } },
    });
  }
  async uploadAvatar(id: number, avatar: string): Promise<UploadAvatarResult> {
    return await this.prismaService.user.update({
      where: { id },
      data: { avatar },
    });
  }
}
