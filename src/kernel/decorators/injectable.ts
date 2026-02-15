import { Registry } from '../di/registry';

export function Injectable(): ClassDecorator {
  return (target) => {
    Registry.register(target as unknown as Registry.Constructor);
  };
}
