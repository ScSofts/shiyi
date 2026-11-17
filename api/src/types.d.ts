// 负责人：C
// 让 req.userId 有类型（requireAuth 中间件里写入）
//
// 注意：这个文件不能有顶层 import/export，否则会变成模块，
// 下面的全局命名空间合并就失效了。

declare namespace Express {
  interface Request {
    /** 由 requireAuth 中间件写入 */
    userId?: string
  }
}