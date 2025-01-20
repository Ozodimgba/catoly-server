// src/whitelist/entities/whitelist.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity()
export class WhitelistedUser {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  privyUserId: string;  // User ID from Privy

  @Column()
  accessCode: string;   // Code they used to gain access

  @CreateDateColumn()
  whitelistedAt: Date;
}

@Entity()
export class AccessCode {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  code: string;

  @Column({ default: false })
  isUsed: boolean;

  @Column({ nullable: true })
  usedBy: string;

  @Column()
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ default: 0 })
  attempts: number; // Track number of failed attempts
}