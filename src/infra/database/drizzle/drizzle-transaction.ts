import { Injectable } from 'src/kernel/decorators/injectable';
import { db, Transaction } from './db';

@Injectable()
export class DrizzleTransaction {
  async execute(fn: (tx: Transaction) => Promise<void>): Promise<void> {
    await db.transaction(fn);
  }
}
