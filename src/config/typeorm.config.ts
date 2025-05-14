import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import * as path from 'path';
import { DataSource } from 'typeorm';

config();

const configService = new ConfigService();

const dataSource = new DataSource({
  type: 'postgres',
  url: configService.get('DATABASE_URL'),
  entities: [path.resolve(__dirname, '..', '**', '*.entity.{ts,js}')],
  migrations: [path.resolve(__dirname, '..', 'migrations', '*.{ts,js}')],
  ssl: true,
  extra: {
    ssl: {
      rejectUnauthorized: false,
    },
  },
});

export default dataSource;
