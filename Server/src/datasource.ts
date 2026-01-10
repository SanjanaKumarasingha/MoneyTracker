import { DataSource, DataSourceOptions } from 'typeorm';
import 'dotenv/config';

const options: DataSourceOptions = {
  type: 'mysql',
  host: process.env.DB_HOST,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  synchronize: false,
  entities: ['dist/**/entities/*.entity.{ts,js}'],
  migrations: ['dist/migrations/*.{ts,js}'],
};

export const datasource = new DataSource({ ...options });
