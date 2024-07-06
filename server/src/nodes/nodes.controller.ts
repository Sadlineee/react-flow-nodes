import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put } from '@nestjs/common'
import { NodesService } from './nodes.service'
import { Node } from './node.entity'

@Controller('nodes')
export class NodesController {
  constructor (
    private nodesService: NodesService
  ) {}

  @Get()
  getNodes(): Promise<Node[]> {
    return this.nodesService.getNodes()
  }

  @Post()
  async createNode(@Body('title') title: string, @Body('parentId') parentId?: number): Promise<Node> {
    return this.nodesService.createNode(title, parentId)
  }

  @Put(':id')
  async updateNode(@Param('id', ParseIntPipe) id: number, @Body('title') title: string): Promise<void> {
    await this.nodesService.updateNode(id, title)
  }

  @Delete(':id')
  async deleteNode(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.nodesService.deleteNode(id)
  }
}