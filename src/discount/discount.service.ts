import { PrismaService } from 'src/prisma.service';
import { BadRequestException, Injectable } from '@nestjs/common';
import { Discount } from '@prisma/client';
import {
  DiscountFilterType,
  DiscountPaginationResponseType,
  createDiscountDto,
  updateDiscountDto,
} from './dto/discount.dto';

@Injectable()
export class DiscountService {
  constructor(private prismaService: PrismaService) {}
  async deleteMany(ids): Promise<void> {
    ids.map(async (id) => {
      await this.prismaService.discount.deleteMany({
        where: { id: Number(id) },
      });
    });
  }
  async delete(id: number): Promise<void> {
    await this.prismaService.discount.delete({ where: { id } });
  }
  async update(id: number, data: updateDiscountDto): Promise<Discount> {
    const currentDate = new Date();
    const startDate = new Date(data.start_date);
    const endDate = new Date(data.end_date);

    if (startDate < currentDate) {
      throw new BadRequestException('Ngày bắt đầu không hợp lệ');
    }

    if (endDate < startDate) {
      throw new BadRequestException('Ngày kết thúc không hợp lệ');
    }
    return await this.prismaService.discount.update({ where: { id }, data });
  }
  async detail(id: number): Promise<Discount> {
    return await this.prismaService.discount.findUnique({
      where: { id },
    });
  }
  async create(data: createDiscountDto): Promise<Discount> {
    const currentDate = new Date();
    const startDate = new Date(data.start_date);
    const endDate = new Date(data.end_date);
    if (data.value < 0)
      throw new BadRequestException(
        'Giá trị không hợp lệ, hãy nhập một số lớn hơn 0',
      );
    if (startDate.getTime() < currentDate.getTime()) {
      throw new BadRequestException('Ngày bắt đầu không hợp lệ');
    }

    if (endDate.getTime() < startDate.getTime()) {
      throw new BadRequestException('Ngày kết thúc không hợp lệ');
    }
    if (startDate.getTime() === endDate.getTime()) {
      throw new BadRequestException(
        'Thời gian bắt đầu và thời gian kết thúc không thể trùng nhau',
      );
    }
    if (data.type === 'percentage') {
      if (data.value > 100)
        throw new BadRequestException(
          'Giá trị không hợp lệ, giảm giá theo phần trăm không thể giảm hơn 100%',
        );
    }
    return await this.prismaService.discount.create({ data });
  }

  async getAll(
    filters: DiscountFilterType,
  ): Promise<DiscountPaginationResponseType> {
    let items_per_page;
    const search = filters.search || '';
    const total = await this.prismaService.discount.count({
      where: {
        OR: [
          {
            name: {
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
    if (filters.items_per_page === 'All') {
      items_per_page = total;
    } else {
      items_per_page = Number(filters.items_per_page) || 10;
    }
    const page = Number(filters.page) || 1;
    const skip = page > 1 ? (page - 1) * items_per_page : 0;
    const discount = await this.prismaService.discount.findMany({
      take: items_per_page,
      skip,
      where: {
        OR: [
          {
            name: {
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
      data: discount,
      total,
      nextPage,
      previousPage,
      lastPage,
      currentPage: page,
      itemsPerPage: items_per_page,
    };
  }
}
