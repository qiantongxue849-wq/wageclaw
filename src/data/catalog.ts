/**
 * 数据目录桶文件：按领域拆分后的统一出口，保持既有导入路径 `@/data/catalog` 兼容。
 * 新增内容请直接放进对应领域文件（wishes/pets/items/events/labels），无需改这里。
 */
export * from "./wishes";
export * from "./pets";
export * from "./items";
export * from "./events";
export * from "./labels";
