const fs = require('fs');
const path = require('path');

// Get module name from command line arguments
const moduleNameArg = process.argv[2];

if (!moduleNameArg) {
  console.error('Error: Please specify the module name. Example: pnpm g:module product');
  process.exit(1);
}

// Casing utility helpers
function toKebabCase(str) {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

function toPascalCase(str) {
  return toKebabCase(str)
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

function toCamelCase(str) {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

const kebabName = toKebabCase(moduleNameArg);
const PascalName = toPascalCase(moduleNameArg);
const camelName = toCamelCase(moduleNameArg);

const targetDir = path.join(__dirname, '../src/modules', kebabName);
const dtoDir = path.join(targetDir, 'dto');

if (fs.existsSync(targetDir)) {
  console.error(`Error: Module "${kebabName}" already exists at ${targetDir}`);
  process.exit(1);
}

// Create directories
fs.mkdirSync(dtoDir, { recursive: true });

// Helper to replace placeholders
function createFromTemplate(templateStr) {
  return templateStr
    .replace(/{kebabName}/g, kebabName)
    .replace(/{PascalName}/g, PascalName)
    .replace(/{camelName}/g, camelName);
}

// Templates definition
const templates = {
  // 1. Repository
  repository: `import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/postgre-sql/prisma.service';
import { {PascalName}, Prisma } from '@prisma/client';

@Injectable()
export class {PascalName}Repository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create new {PascalName}
   */
  async create(data: Prisma.{PascalName}CreateInput): Promise<{PascalName}> {
    return this.prisma.{camelName}.create({ data });
  }

  /**
   * Find {PascalName} by unique ID
   */
  async findById(id: string): Promise<{PascalName} | null> {
    return this.prisma.{camelName}.findUnique({ where: { id } });
  }

  /**
   * Update {PascalName} by ID
   */
  async update(id: string, data: Prisma.{PascalName}UpdateInput): Promise<{PascalName}> {
    return this.prisma.{camelName}.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete {PascalName} by ID
   */
  async delete(id: string): Promise<{PascalName}> {
    return this.prisma.{camelName}.delete({ where: { id } });
  }

  /**
   * Fetch all {PascalName} records
   */
  async findAll(): Promise<{PascalName}[]> {
    return this.prisma.{camelName}.findMany();
  }
}
`,

  // 2. Service
  service: `import { Injectable, NotFoundException } from '@nestjs/common';
import { {PascalName}Repository } from './{kebabName}.repository';
import { Create{PascalName}Dto } from './dto/create-{kebabName}.dto';
import { Update{PascalName}Dto } from './dto/update-{kebabName}.dto';
import { {PascalName} } from '@prisma/client';

@Injectable()
export class {PascalName}Service {
  constructor(private readonly {camelName}Repository: {PascalName}Repository) {}

  /**
   * Create a new {PascalName}
   */
  async create(create{PascalName}Dto: Create{PascalName}Dto): Promise<{PascalName}> {
    return this.{camelName}Repository.create(create{PascalName}Dto);
  }

  /**
   * Find {PascalName} by ID, throws NotFoundException if missing
   */
  async findById(id: string): Promise<{PascalName}> {
    const item = await this.{camelName}Repository.findById(id);
    if (!item) {
      throw new NotFoundException(\`Không tìm thấy {PascalName} với ID \${id}\`);
    }
    return item;
  }

  /**
   * Update {PascalName} info by ID
   */
  async update(id: string, update{PascalName}Dto: Update{PascalName}Dto): Promise<{PascalName}> {
    await this.findById(id);
    return this.{camelName}Repository.update(id, update{PascalName}Dto);
  }

  /**
   * Delete {PascalName} by ID
   */
  async delete(id: string): Promise<{PascalName}> {
    await this.findById(id);
    return this.{camelName}Repository.delete(id);
  }

  /**
   * Fetch all {PascalName} records
   */
  async findAll(): Promise<{PascalName}[]> {
    return this.{camelName}Repository.findAll();
  }
}
`,

  // 3. Controller
  controller: `import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { {PascalName}Service } from './{kebabName}.service';
import { Create{PascalName}Dto } from './dto/create-{kebabName}.dto';
import { Update{PascalName}Dto } from './dto/update-{kebabName}.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';

@ApiTags('{PascalName}s')
@Controller('{kebabName}s')
export class {PascalName}Controller {
  constructor(private readonly {camelName}Service: {PascalName}Service) {}

  @Post()
  @ApiOperation({ summary: 'Create a new {PascalName}' })
  @ApiResponse({ status: 201, description: 'Created successfully' })
  create(@Body() create{PascalName}Dto: Create{PascalName}Dto) {
    return this.{camelName}Service.create(create{PascalName}Dto);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve list of all {PascalName}s' })
  @ApiResponse({ status: 200, description: 'List of records retrieved successfully' })
  findAll() {
    return this.{camelName}Service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get {PascalName} by ID' })
  @ApiParam({ name: 'id', description: '{PascalName} ID' })
  @ApiResponse({ status: 200, description: 'Record details' })
  @ApiResponse({ status: 404, description: 'Not found' })
  findOne(@Param('id') id: string) {
    return this.{camelName}Service.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update {PascalName} by ID' })
  @ApiParam({ name: 'id', description: '{PascalName} ID' })
  @ApiResponse({ status: 200, description: 'Updated successfully' })
  @ApiResponse({ status: 404, description: 'Not found' })
  update(@Param('id') id: string, @Body() update{PascalName}Dto: Update{PascalName}Dto) {
    return this.{camelName}Service.update(id, update{PascalName}Dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete {PascalName} by ID' })
  @ApiParam({ name: 'id', description: '{PascalName} ID' })
  @ApiResponse({ status: 200, description: 'Deleted successfully' })
  @ApiResponse({ status: 404, description: 'Not found' })
  remove(@Param('id') id: string) {
    return this.{camelName}Service.delete(id);
  }
}
`,

  // 4. Module
  module: `import { Module } from '@nestjs/common';
import { {PascalName}Controller } from './{kebabName}.controller';
import { {PascalName}Service } from './{kebabName}.service';
import { {PascalName}Repository } from './{kebabName}.repository';
import { PrismaModule } from '../../database/postgre-sql/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [{PascalName}Controller],
  providers: [{PascalName}Service, {PascalName}Repository],
  exports: [{PascalName}Service, {PascalName}Repository],
})
export class {PascalName}Module {}
`,

  // 5. Create DTO
  createDto: `import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class Create{PascalName}Dto {
  @ApiProperty({ example: 'Sample Name', description: 'Display name' })
  @IsString({ message: 'Phải là chuỗi' })
  @IsNotEmpty({ message: 'Không được để trống' })
  name: string;
}
`,

  // 6. Update DTO
  updateDto: `import { PartialType } from '@nestjs/swagger';
import { Create{PascalName}Dto } from './create-{kebabName}.dto';

export class Update{PascalName}Dto extends PartialType(Create{PascalName}Dto) {}
`
};

// Write files
fs.writeFileSync(path.join(targetDir, `${kebabName}.repository.ts`), createFromTemplate(templates.repository));
fs.writeFileSync(path.join(targetDir, `${kebabName}.service.ts`), createFromTemplate(templates.service));
fs.writeFileSync(path.join(targetDir, `${kebabName}.controller.ts`), createFromTemplate(templates.controller));
fs.writeFileSync(path.join(targetDir, `${kebabName}.module.ts`), createFromTemplate(templates.module));
fs.writeFileSync(path.join(dtoDir, `create-${kebabName}.dto.ts`), createFromTemplate(templates.createDto));
fs.writeFileSync(path.join(dtoDir, `update-${kebabName}.dto.ts`), createFromTemplate(templates.updateDto));

console.log(`\x1b[32m✔ Successfully generated "${PascalName}Module" in src/modules/${kebabName}/\x1b[0m`);
console.log(`Files created:`);
console.log(`  - src/modules/${kebabName}/${kebabName}.repository.ts`);
console.log(`  - src/modules/${kebabName}/${kebabName}.service.ts`);
console.log(`  - src/modules/${kebabName}/${kebabName}.controller.ts`);
console.log(`  - src/modules/${kebabName}/${kebabName}.module.ts`);
console.log(`  - src/modules/${kebabName}/dto/create-${kebabName}.dto.ts`);
console.log(`  - src/modules/${kebabName}/dto/update-${kebabName}.dto.ts`);
console.log(`\n\x1b[33mRemember to register "${PascalName}Module" in src/app.module.ts!\x1b[0m\n`);
