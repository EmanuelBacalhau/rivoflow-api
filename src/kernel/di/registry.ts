export class Registry {
  private static instances: Map<string, Registry.Instance> = new Map();
  private static singletons: Map<string, unknown> = new Map();

  private constructor() {}

  public static register(instance: Registry.Constructor): void {
    const instanceAlreadyExists = Registry.instances.has(instance.name);

    if (instanceAlreadyExists) {
      throw new Error(`Instance with key "${instance.name}" is already registered.`);
    }

    const dependencies = Reflect.getMetadata('design:paramtypes', instance) || [];

    Registry.instances.set(instance.name, {
      instance: instance,
      dependencies,
    });
  }

  public static resolve<T extends Registry.Constructor>(implementation: T): InstanceType<T> {
    const cached = Registry.singletons.get(implementation.name);
    if (cached) {
      return cached as InstanceType<T>;
    }

    const instance = Registry.instances.get(implementation.name);
    if (!instance) {
      throw new Error(`No instance found for key "${implementation.name}".`);
    }

    const dependencies = instance.dependencies.map((dependency: Registry.Constructor) => {
      return Registry.resolve(dependency);
    });

    const resolved = new implementation(...dependencies);
    Registry.singletons.set(implementation.name, resolved);

    return resolved;
  }
}

export namespace Registry {
  export type Constructor<T = any> = new (...args: any[]) => T;
  export type Instance = {
    instance: Constructor;
    dependencies: Constructor[];
  };
}
