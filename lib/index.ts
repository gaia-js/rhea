import Session from './session';
export { init, shutdown } from './rhea_cli';
import { getRheaClient, initialized as rheaInitialized } from './rhea_cli';
export * from './item';
import Item from './item';

export function createSession(): Session {
  return new Session();
}

export function submit(name: string, tags: { [key: string]: string }, count: number, duration?: number) {
  getRheaClient() && getRheaClient().submit(name, tags, count, duration);
}

export function initialized(): boolean {
  return rheaInitialized();
}

export function addItem(item: Item) {
  getRheaClient() && getRheaClient().addItem(item);
}
