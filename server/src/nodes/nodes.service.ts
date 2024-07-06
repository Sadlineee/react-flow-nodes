import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { plainToClass } from 'class-transformer'
import { Node } from './node.entity'

@Injectable()
export class NodesService {
  constructor (
    @InjectRepository(Node)
    private nodesRepository: Repository<Node> 
  ) {}

  async getNodes(): Promise<Node[]> {
    const nodes = await this.nodesRepository.find({ 
      relations: ['parent'] 
    })

    return nodes.map(node => plainToClass(Node, node))
  }

  async createNode(title: string, parentId?: number): Promise<Node> {
    const node = new Node()
    node.title = title

    if (parentId) {
      const parent = await this.nodesRepository.findOne({ 
        where: { id: parentId } 
      })

      node.parent = parent
    }

    return this.nodesRepository.save(node)
  }

  async updateNode(id: number, title: string): Promise<Node> {
    const node = await this.nodesRepository.findOneBy({ id })
    node.title = title

    return this.nodesRepository.save(node)
  }

  async deleteNode(id: number): Promise<void> {
    const result = await this.nodesRepository.delete(id)
  }
}