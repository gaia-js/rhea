
export interface ItemTags {
  [name: string]: string;
}

export interface ItemFields {
  [name: string]: any;
}

export class Item {
  name: string;
  fields?: ItemFields;
  tags: ItemTags;

  timestamp: number;
  start: number;

  duration?: number;
  min?: number;
  max?: number;

  count: number;

  constructor(name: string, tags: ItemTags = {}, count: number = 1) {
    this.name = name;
    this.count = count;
    this.tags = tags;

    this.start = Date.now();
    this.timestamp = Math.floor(this.start / 1000);
  }

  resetStart() {
    this.start = Date.now();
    this.timestamp = Math.floor(this.start / 1000);
  }

  addTag(name: string, value: string) {
    this.tags[name] = value;
  }

  /**
   * 毫秒时长
   */
  last(): number {
    return Date.now() - this.start;
  }

  end(): number {
    this.duration = Date.now() - this.start;
    return this.duration;
  }
}

export default Item;
