import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { AppController } from './app.controller'
import { AppService } from './app.service'

import { NodesController } from './nodes/nodes.controller'
import { NodesService } from './nodes/nodes.service'
import { Node } from './nodes/node.entity'

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'postgres',
      database: 'nodes',
      entities: [Node],
      synchronize: true
    }),
    TypeOrmModule.forFeature([
      Node
    ])
  ],
  controllers: [AppController, NodesController],
  providers: [AppService, NodesService]
})
export class AppModule {}