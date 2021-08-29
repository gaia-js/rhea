// import * as is from 'is-type-of';
// import * as assert from 'assert';
// import * as rhea from '17zy_rhea-cli';
import Item, { ItemTags } from './item';
import ItemContainer from './itemContainer';
import { getRheaClient } from './rhea_cli';
const debug = require('debug')('rhea');

export type DumpType = 'minimize' | 'medium' | 'full';

export class Session {
  private container: ItemContainer;

  constructor() {
    this.container = new ItemContainer();
  }

  createItem(name: string, tags = {}, count: number = 1): Item {
    return new Item(name, tags, count);
  }

  addItem(name: string | Item, tags: ItemTags | any = {}, count: number = 1) {
    let item: Item;

    if (typeof tags === 'number') {
      count = <number><any>tags;
      tags = {};
    }

    if (name instanceof Item) {
      item = name;
      if (!item.duration) {
        item.end();
      }

      if (count > item.count) {
        item.count = count;
      }
    } else {
      item = new Item(name, tags, count);
    }

    this.container.addItem(item);
    getRheaClient() && getRheaClient().addItem(item);
  }

  async submitItem(item: { name: string, tags?: ItemTags, count?: number, duration?: number }) {
    const _item = new Item(item.name, item.tags, typeof item.count === 'number' ? item.count : 1);
    Object.assign(_item, item);
    this.addItem(_item);
  }

  dump(dumpType: DumpType = 'full') {
    try {
      return this.container.dump(dumpType);
    } catch (e) {
      debug('rhea dump failed:', e);
    }
  }

  async submit() {
    this.container.clear();
  }
}

export default Session;
