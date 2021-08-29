import Item, { ItemTags } from './item';
import { DumpType } from './session';
import * as querystring from 'querystring';

export interface TaggedItems {
  count: number;
  taggedItems: Map<string, Item>;
}

export default class ItemContainer {
  public readonly items: Map<number, Map<string, TaggedItems | Item>>;

  constructor() {
    this.items = new Map();
  }

  tagHash(tag: ItemTags): string {
    const keys = Object.keys(tag);
    keys.sort();
    return keys.map(key => key + '=' + tag[key]).join('&');
  }

  addItem(item: Item) {
    //   assert(name, 'name should not be empty');

    let items = this.items.get(item.timestamp);
    if (!items) {
      items = new Map<string, TaggedItems>();
      this.items.set(item.timestamp, items);
    }

    let namedItem = items.get(item.name);

    if (!namedItem) {
      namedItem = { count: 0, taggedItems: new Map<string, Item>() };
      items.set(item.name, namedItem);
    }

    if (item.tags && Object.keys(item.tags).length === 0) {
      if (typeof item.duration !== 'undefined' && namedItem.count + item.count > 0) {
        (namedItem as Item).duration = Math.round(((namedItem as Item).count * ((namedItem as Item).duration || 0) + item.duration * item.count) / (namedItem.count + item.count));
        (namedItem as Item).min = (namedItem as Item).count === 0 ? (namedItem as Item).duration : Math.min((namedItem as Item).min || 0, (namedItem as Item).duration as number) || 0;
        (namedItem as Item).max = Math.max((namedItem as Item).max || 0, item.duration) || 0;
      }

      namedItem.count += item.count;
    } else {
      const hash = this.tagHash(item.tags as ItemTags);

      let taggedItem = (namedItem as TaggedItems).taggedItems.get(hash);
      if (taggedItem === undefined) {
        taggedItem = { count: 0, tags: (item.tags as ItemTags) } as Item;
        (namedItem as TaggedItems).taggedItems.set(hash, taggedItem);
      }

      if (typeof item.duration !== 'undefined') {
        taggedItem.duration = Math.round((taggedItem.count * (taggedItem.duration || 0) + item.duration * item.count) / (taggedItem.count + item.count));
        taggedItem.min = taggedItem.count === 0 ? taggedItem.duration : Math.min(taggedItem.min || 0, taggedItem.duration) || 0;
        taggedItem.max = Math.max(taggedItem.max || 0, item.duration) || 0;
      }

      taggedItem.count += item.count;
    }
  }

  /**
   *
   * @param type 'minimize' | 'medium' | 'full'
   *
   * minimize: { <type>: <count> }
   * medium: { <type>: { count, duration, ...({ <taggedItemName>: { count, duration } }) } }
   */
  dump(type: DumpType = 'full') {
    const ret: { name: string; timestamp: number; count: number; tags?: { [K: string]: string }; duration?: number; min?: number; max?: number; }[] = [];
    const retMap: { [type: string]: (number | { count?: number; duration?: number }) } = {};
    this.items.forEach((items, timestamp) => {
      items.forEach((item, name: string) => {
        if (item.count > 0) {
          if (type === 'minimize') {
            retMap[name] = (retMap[name] as number || 0) + (item.count || 1);
          } else if (type === 'medium') {
            retMap[name] = {
              count: (retMap[name] && (retMap[name] as any).count || 0) + (item.count || 1),
              duration: (retMap[name] && (retMap[name] as any).duration || 0) + ((item as Item).duration || 0),
            }
          } else {
            ret.push({ name, timestamp: timestamp, count: item.count, duration: (item as Item).duration as number, min: (item as Item).min, max: (item as Item).max });
          }
        }

        (item as TaggedItems).taggedItems.forEach(item => {
          if (type === 'minimize') {
            retMap[name] = (retMap[name] as number || 0) + item.count;
          } else if (type === 'medium') {
            if (!retMap[name]) {
              retMap[name] = {};
            }

            const tagName = querystring.stringify(item.tags);
            retMap[name][tagName] = {
              count: (retMap[name][tagName] && retMap[name][tagName].count || 0) + (item.count || 1),
              duration: (retMap[name][tagName] && retMap[name][tagName].duration || 0) + (item.duration || 0),
            }
          } else {
            ret.push({ name, timestamp: timestamp, tags: item.tags, count: item.count, duration: item.duration, min: item.min, max: item.max });
          }
        });
      });
    });

    if (type === 'minimize') {
      return retMap;
    } else if (type === 'medium') {
      return retMap;
    } else {
      return ret.sort((a, b) => a.timestamp - b.timestamp);
    }
  }

  clear() {
    this.items.clear();
  }
}
