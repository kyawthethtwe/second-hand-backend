import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../entities/product.entity';

// --- Interface Definitions for Type Safety ---

/**
 * Shape of data from the pg_stats table.
 */
interface TableStat {
  schemaname: string;
  tablename: string;
  attname: string;
  n_distinct: number;
  correlation: number;
}

/**
 * Shape of data from the pg_stat_user_indexes view.
 */
interface IndexStat {
  index_name: string;
  times_used: number;
  tuples_read: number;
  tuples_fetched: number;
}

/**
 * Shape of data from the pg_stat_statements view.
 */
interface SlowQueryStat {
  query: string;
  total_time: number;
  mean_time: number;
  calls: number;
}

/**
 * The structure of the object returned by analyzeQueryPerformance.
 */
interface QueryPerformanceAnalysis {
  tableStats: TableStat[];
  indexStats: IndexStat[];
  slowQueries: SlowQueryStat[];
  recommendations: string[];
}

/**
 * Shape of the table size metrics.
 */
interface TableSize {
  total_size: string;
  table_size: string;
  index_size: string;
}

/**
 * Shape of the index size metrics.
 */
interface IndexSize {
  index_name: string;
  size: string;
}

/**
 * The structure of the object returned by getPerformanceMetrics.
 */
interface PerformanceMetrics {
  tableSize: TableSize;
  indexSizes: IndexSize[];
  cacheHitRatio: number;
  activeConnections: number;
  timestamp: Date;
}

@Injectable()
export class ProductIndexingService {
  private readonly logger = new Logger(ProductIndexingService.name);

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  /**
   * Creates database indexes for optimized product queries.
   * This should be run during application startup or migrations.
   */
  async createOptimizedIndexes(): Promise<void> {
    try {
      const queryRunner =
        this.productRepository.manager.connection.createQueryRunner();

      // Ensure pg_trgm extension is available for text search optimization
      try {
        await queryRunner.query('CREATE EXTENSION IF NOT EXISTS pg_trgm;');
        this.logger.log('Ensured pg_trgm extension exists.');
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.warn(
          `Failed to create pg_trgm extension. Text search performance may be degraded: ${message}`,
        );
      }

      // Define all indexes to be created
      const indexes = [
        {
          name: 'idx_products_search_main',
          columns: ['status', 'categoryId', 'price', 'condition'],
          where: "status = 'active'",
        },
        {
          name: 'idx_products_location',
          columns: ['latitude', 'longitude', 'status'],
          where:
            "status = 'active' AND latitude IS NOT NULL AND longitude IS NOT NULL",
        },
        {
          name: 'idx_products_seller',
          columns: ['sellerId', 'status', 'createdAt'],
        },
        {
          name: 'idx_products_title_trgm',
          type: 'gin_trgm',
          column: 'title',
        },
        {
          name: 'idx_products_popular',
          columns: ['viewCount', 'favoriteCount', 'status', 'createdAt'],
          where: "status = 'active'",
        },
        {
          name: 'idx_products_price_range',
          columns: ['price', 'status', 'categoryId'],
          where: "status = 'active'",
        },
        {
          name: 'idx_products_recent',
          columns: ['createdAt', 'status'],
          where: "status = 'active'",
        },
        {
          name: 'idx_products_brand_model',
          columns: ['brand', 'model', 'status'],
          where: "status = 'active' AND brand IS NOT NULL",
        },
      ];

      // Loop through and create each index
      for (const index of indexes) {
        try {
          if (index.type === 'gin_trgm') {
            // Create GIN index with trigram support
            await queryRunner.query(`
              CREATE INDEX IF NOT EXISTS ${index.name} 
              ON product USING gin (${index.column} gin_trgm_ops)
            `);
            this.logger.log(`Created index: ${index.name}`);
          } else if (index.columns) {
            // Create regular B-tree index
            const whereClause = index.where ? ` WHERE ${index.where}` : '';
            await queryRunner.query(`
              CREATE INDEX IF NOT EXISTS ${index.name} 
              ON product (${index.columns.join(', ')})${whereClause}
            `);
            this.logger.log(`Created index: ${index.name}`);
          }
        } catch (error) {
          const message =
            error instanceof Error ? error.message : String(error);
          this.logger.warn(
            `Index ${index.name} may already exist or failed to create: ${message}`,
          );
        }
      }

      await queryRunner.release();
      this.logger.log('Database indexing optimization completed');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to create optimized indexes:', message);
      throw error;
    }
  }

  /**
   * Analyzes query performance and suggests optimizations.
   */
  async analyzeQueryPerformance(): Promise<QueryPerformanceAnalysis | null> {
    try {
      const queryRunner =
        this.productRepository.manager.connection.createQueryRunner();

      // Get statistics about table usage
      const tableStats = (await queryRunner.query(`
        SELECT schemaname, tablename, attname, n_distinct, correlation
        FROM pg_stats 
        WHERE tablename = 'product' 
        ORDER BY n_distinct DESC
      `)) as TableStat[];

      // Get index usage statistics
      const indexStats = (await queryRunner.query(`
        SELECT 
          indexrelname as index_name,
          idx_scan as times_used,
          idx_tup_read as tuples_read,
          idx_tup_fetch as tuples_fetched
        FROM pg_stat_user_indexes 
        WHERE relname = 'product'
        ORDER BY idx_scan DESC
      `)) as IndexStat[];

      // Get slow queries (if query logging is enabled)
      const slowQueries = (await queryRunner
        .query(
          `
        SELECT query, total_time, mean_time, calls
        FROM pg_stat_statements 
        WHERE query LIKE '%product%' 
        AND total_time > 1000
        ORDER BY total_time DESC 
        LIMIT 10
      `,
        )
        .catch(() => {
          // pg_stat_statements extension may not be installed
          return [] as SlowQueryStat[];
        })) as SlowQueryStat[];

      await queryRunner.release();

      return {
        tableStats,
        indexStats,
        slowQueries,
        recommendations: this.generateRecommendations(indexStats, tableStats),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to analyze query performance:', message);
      return null;
    }
  }

  /**
   * Generates performance recommendations based on statistics.
   */
  private generateRecommendations(
    indexStats: IndexStat[],
    tableStats: TableStat[],
  ): string[] {
    const recommendations: string[] = [];

    // Check for unused indexes
    const unusedIndexes = indexStats.filter((stat) => stat.times_used === 0);
    if (unusedIndexes.length > 0) {
      recommendations.push(
        `Consider dropping unused indexes: ${unusedIndexes
          .map((i) => i.index_name)
          .join(', ')}`,
      );
    }

    // Check for low-selectivity columns
    const lowSelectivityColumns = tableStats.filter(
      (stat) => stat.n_distinct > 0 && stat.n_distinct < 10,
    );
    if (lowSelectivityColumns.length > 0) {
      recommendations.push(
        `Low selectivity columns detected: ${lowSelectivityColumns
          .map((c) => c.attname)
          .join(', ')}. Consider composite indexes.`,
      );
    }

    // Check for high-correlation columns
    const highCorrelationColumns = tableStats.filter(
      (stat) => Math.abs(stat.correlation) > 0.8,
    );
    if (highCorrelationColumns.length > 0) {
      recommendations.push(
        `High correlation columns detected: ${highCorrelationColumns
          .map((c) => c.attname)
          .join(', ')}. Consider clustering the table.`,
      );
    }

    return recommendations;
  }

  /**
   * Updates table statistics to help the query planner.
   */
  async updateTableStatistics(): Promise<void> {
    try {
      await this.productRepository.query('ANALYZE product');
      this.logger.log('Updated table statistics for products');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to update table statistics:', message);
    }
  }

  /**
   * Gets current database performance metrics.
   */
  async getPerformanceMetrics(): Promise<PerformanceMetrics | null> {
    try {
      const [tableSize, indexSizes, cacheHitRatio, activeConnections] =
        await Promise.all([
          this.getTableSize(),
          this.getIndexSizes(),
          this.getCacheHitRatio(),
          this.getActiveConnections(),
        ]);

      return {
        tableSize,
        indexSizes,
        cacheHitRatio,
        activeConnections,
        timestamp: new Date(),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to get performance metrics:', message);
      return null;
    }
  }

  private async getTableSize(): Promise<TableSize> {
    const result = (await this.productRepository.query(`
      SELECT 
        pg_size_pretty(pg_total_relation_size('product')) as total_size,
        pg_size_pretty(pg_relation_size('product')) as table_size,
        pg_size_pretty(pg_total_relation_size('product') - pg_relation_size('product')) as index_size
    `)) as TableSize[];
    return result[0];
  }

  private async getIndexSizes(): Promise<IndexSize[]> {
    return this.productRepository.query(`
      SELECT 
        indexrelname as index_name,
        pg_size_pretty(pg_relation_size(indexrelid)) as size
      FROM pg_stat_user_indexes 
      WHERE relname = 'product'
      ORDER BY pg_relation_size(indexrelid) DESC
    `) as Promise<IndexSize[]>;
  }

  private async getCacheHitRatio(): Promise<number> {
    const result = (await this.productRepository.query(`
      SELECT 
        round(
          (sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read))) * 100, 
          2
        ) as cache_hit_ratio
      FROM pg_statio_user_tables 
      WHERE relname = 'product'
    `)) as { cache_hit_ratio: number }[];
    return result[0]?.cache_hit_ratio || 0;
  }

  private async getActiveConnections(): Promise<number> {
    const result = (await this.productRepository.query(`
      SELECT count(*) as active_connections
      FROM pg_stat_activity 
      WHERE state = 'active'
    `)) as { active_connections: string }[]; // Postgres returns count as a string
    return Number(result[0]?.active_connections) || 0;
  }
}
