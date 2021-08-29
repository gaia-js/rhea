const chalk = require('chalk');
const dgram = require('dgram');
const os = require('os');
import { Items } from './proto';
import ItemContainer, { TaggedItems } from './itemContainer';
import Item from './item';

let _appName: string;
let _hostname: string;

//从protobuf源码中复制出来的，尚未公开api的encode方法
const writeInt32 = function (buffer_, a) {/*goog.asserts.assert(a==Math.floor(a));for(goog.asserts.assert(0<=a&&a<jspb.BinaryConstants.TWO_TO_32);127<a;)*/buffer_.push(a & 127 | 128), a >>>= 7; buffer_.push(a) };

class RheaClient {
  private _rheaServer: string;
  private _rheaPort: number;
  private _socket: any;

  private processor: NodeJS.Timer | undefined;

  private container: ItemContainer;

  constructor(server: string, port: number, appName: string) {
    this._rheaServer = server;
    this._rheaPort = port;

    _appName = appName;
    _hostname = os.hostname();

    this.container = new ItemContainer();

    RheaClient._instance = this;
  }

  private static _instance: RheaClient;
  static get instance() {
    return this._instance;
  }

  start() {
    if (this._socket) {
      this.shutdown();
    }

    this._socket = dgram.createSocket('udp4');

    this._socket.on('close', function () {
      console.log('socket closed.');
    });

    this._socket.on('error', (err) => {
      this._socket.close();
      this._socket = undefined;

      console.log('socket err', err);
    });

    // @ts-ignore
    this.processor = setInterval(() => {
      const nowSecond = Math.floor(Date.now() / 1000) - 1;

      const items = new Map();
      for (const [timestamp, timedItems] of this.container.items.entries()) {
        if (timestamp <= nowSecond) {
          items.set(timestamp, timedItems);
          this.container.items.delete(timestamp);
        }
      }

      if (items.size > 0) {
        this.flush(items);
      }
    }, 1000);
  }

  async flush(items: Map<number, Map<string, TaggedItems | Item>>): Promise<void> {
    const allItems: Items[] = [];

    let rheaItems = new Items();
    for (const [timestamp, timedItems] of items.entries()) {
      for (const [name, item] of timedItems.entries()) {
        rheaItems.addItem(Object.assign((item as any), { timestamp: timestamp, name }));

        (item as TaggedItems).taggedItems.forEach(item => {
          rheaItems.addItem(Object.assign((item as any), { timestamp: timestamp, name }));
        });

        if (rheaItems.size && rheaItems.size() > 32) {
          allItems.push(rheaItems);
          rheaItems = new Items();
        }
      }
    }

    if (!rheaItems.size || rheaItems.size() > 0) {
      allItems.push(rheaItems);
    }

    try {
      await Promise.all(allItems.map(rheaItems => this.sendItems(rheaItems)));
    } catch (err) {
      console.error('cannot submit profile info: ', err);
    }
  }

  async shutdown() {
    this.processor && clearInterval(this.processor);
    this.processor = undefined;

    await this.flush(this.container.items);

    if (this._socket) {
      this._socket.close();
      this._socket = undefined;
    }
  }

  private sendItems(items: Items): Promise<number> {
    const protoItems = items.getProtoItems();

    protoItems.setApp(_appName);
    protoItems.setHostname(_hostname);

    return new Promise((resolve, reject) => {
      let data = protoItems.serializeBinary();

      let delimiter = [];
      writeInt32(delimiter, data.length);

      let buffer = new Uint8Array(delimiter.length + data.length);
      buffer.set(delimiter, 0);
      buffer.set(data, delimiter.length);

      if (!this._socket) {
        this.start();
      }

      this._rheaServer && this._rheaPort && this._socket.send(buffer, this._rheaPort, this._rheaServer, function (err, bytes) {
        if (err) {
          reject(err);
        }
        else {
          resolve(bytes);
        }
      })
    });
  }

  /**
   * add
   * @param name
   * @param tags
   * @param count optional default as 1
   * @param duration optional
   */
  submit(name: string, tags: { [key: string]: string }, count: number, duration?: number) {
    const item = new Item(name, tags, count);
    if (typeof duration !== 'undefined') {
      item.duration = duration;
    }

    this.addItem(item);
  }

  addItem(item: Item) {
    this.container.addItem(item);
  }
}

export function init(server: string, port: number, appName: string) {
  if (!RheaClient.instance) {
    const client = new RheaClient(server, port, appName);
    client.start();
  }

  return RheaClient.instance;
}

let warned = false;
export function getRheaClient(): RheaClient {
  RheaClient.instance || warned || (console.error(chalk.bgYellow(chalk.black('Rhea-cli is not initialized. And this warning message will be prompted only once.'))), (warned = true));
  return RheaClient.instance as RheaClient;
}

export async function shutdown(): Promise<void> {
  if (RheaClient.instance) {
    await RheaClient.instance.shutdown();
  }
}

export function initialized(): boolean {
  return !!RheaClient.instance;
}
