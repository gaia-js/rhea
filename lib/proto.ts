import { getRheaClient } from './rhea_cli';
import Item from './item';

// const assert = require('assert');

import {Item as ProtoItem, Items as ProtoItems} from '../proto/profile_pb';

// interface Item {
//   name: string,
//   tags?: { [key: string]: string },
//   count?: number,
//   duration?: number,
//   min?: number,
//   max?: number,
//   fields?: { [key: string]: number | string },
//   timestamp?: number
// }

export class ProfileItem {
  name: string
  tags: { [key: string]: string }
  _start: number

  constructor(name: string, tags: { [key: string]: string }) {
    this.name = name;
    this.tags = tags;
    this._start = Date.now();
  }

  last() {
    return Date.now() - this._start;
  }

  addTag(name: string, value: string) {
    this.tags[name] = value;
  }

  submit() {
    const item = new Item(this.name, this.tags, 1);
    item.timestamp = this._start;
    item.duration = Date.now() - this._start;
    getRheaClient().addItem(item);
  }
}

export class Items {
  items: ProtoItems;

  constructor() {
    this.items = new ProtoItems();
  }

  toProtoItem(item: Item): ProtoItem {
    const name = item.name;

    let protoItem = new ProtoItem();
    protoItem.setTimestamp(item.timestamp || Math.floor(Date.now() / 1000));
    protoItem.setName(name);
    if (item.tags && typeof item.tags === 'object') {
      // assert(typeof item.tags === 'object');
      Object.keys(item.tags).forEach((name) => {
        protoItem.getTagsMap().set(name, (item.tags as any)[name]);
      });
    }
    if (item.fields && typeof item.fields === 'object') {
      Object.keys(item.fields).forEach((name) => {
        protoItem.getFieldsMap().set(name, (item.fields as any)[name]);
      });
    }

    // assert(typeof item.count === 'number');
    protoItem.setValue(typeof item.count === 'number' ? item.count : 1);
    if (item.duration !== undefined) {
      protoItem.setDuration(item.duration);
    }
    if (item.min !== undefined) {
      protoItem.setMin(item.min);
    }
    if (item.min !== undefined) {
      protoItem.setMax(item.max);
    }

    return protoItem;
  }

  addItem(item: Item) {
    this.items.addItems(this.toProtoItem(item));
  }

  size():number {
    return this.items.getItemsList().length;
  }

  getProtoItems(): ProtoItems {
    return this.items;
  }
}
