# 性能数据收集客户端

==================

使用方法

1. 引入
```
const rhea = require('rhea-cli');
```

2. 初始化

```
rhea.init('127.0.0.1', 14503, 'nodejs-test');
```

3. 提交打点

单个点：
```
rhea.submit('controller.invocation', {operator: '/test'}, 1),
```

时间段：
```
var item = new rhea.ProfileItem("controller", {operator: '/test'});
...<操作>...

// 根据需要设置超时标签
if (item.last() > 1000) {
  item.addTag('timeout', 'timeout');
}

item.submit()
```
