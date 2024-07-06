import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm'

@Entity()
export class Node {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ type: 'varchar', length: 255 })
  title: string

  @ManyToOne(() => Node, node => node.children, { nullable: true })
  @JoinColumn({ name: 'parentId' })
  parent: Node

  @OneToMany(() => Node, node => node.parent)
  children: Node[]
}